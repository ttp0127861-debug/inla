const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminResetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  ListGroupsCommand,
  ListUsersInGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { ROLES } = require("./validation");

const USER_POOL_ID = process.env.USER_POOL_ID;
const client = new CognitoIdentityProviderClient({});

function attributesOf(user) {
  const source = user.Attributes || user.UserAttributes || [];
  return Object.fromEntries(source.map((attribute) => [attribute.Name, attribute.Value]));
}

function present(user, groupNames) {
  const attributes = attributesOf(user);
  const roles = ROLES.filter((role) => groupNames.includes(role));
  return {
    username: user.Username,
    email: attributes.email || user.Username,
    name: attributes.name || "",
    phoneNumber: attributes.phone_number || "",
    level: attributes["custom:level"] || "",
    role: roles[0] || null,
    enabled: Boolean(user.Enabled),
    status: user.UserStatus,
  };
}

async function groupNamesFor(username) {
  const groups = [];
  let nextToken;
  do {
    const page = await client.send(new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      NextToken: nextToken,
      Limit: 60,
    }));
    groups.push(...(page.Groups || []).map((group) => group.GroupName));
    nextToken = page.NextToken;
  } while (nextToken);
  return groups;
}

async function mapInChunks(items, size, mapper) {
  const output = [];
  for (let index = 0; index < items.length; index += size) {
    const chunk = items.slice(index, index + size);
    output.push(...await Promise.all(chunk.map(mapper)));
  }
  return output;
}

async function listUsers() {
  const users = [];
  let paginationToken;
  do {
    const page = await client.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      PaginationToken: paginationToken,
      Limit: 60,
    }));
    users.push(...(page.Users || []));
    paginationToken = page.PaginationToken;
  } while (paginationToken && users.length < 1000);

  return mapInChunks(users, 8, async (user) => present(user, await groupNamesFor(user.Username)));
}

async function getUser(username) {
  const user = await client.send(new AdminGetUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  }));
  return present(user, await groupNamesFor(username));
}

async function activeExecutorCount(exceptUsername) {
  const excluded = (exceptUsername || "").toLowerCase();
  let count = 0;
  let nextToken;
  do {
    const page = await client.send(new ListUsersInGroupCommand({
      UserPoolId: USER_POOL_ID,
      GroupName: "EXECUTOR",
      NextToken: nextToken,
      Limit: 60,
    }));
    count += (page.Users || []).filter((user) => {
      return user.Enabled && user.Username.toLowerCase() !== excluded;
    }).length;
    nextToken = page.NextToken;
  } while (nextToken);
  return count;
}

async function assertExecutorAvailable(exceptUsername) {
  if (await activeExecutorCount(exceptUsername) > 0) {
    const error = new Error("Only one active EXECUTOR is allowed.");
    error.name = "ExecutorConflict";
    throw error;
  }
}

async function createUser(input) {
  if (input.role === "EXECUTOR") await assertExecutorAvailable();
  await client.send(new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: input.email,
    DesiredDeliveryMediums: ["EMAIL"],
    UserAttributes: [
      { Name: "email", Value: input.email },
      { Name: "email_verified", Value: "true" },
      { Name: "name", Value: input.name },
      { Name: "phone_number", Value: input.phoneNumber },
      { Name: "custom:level", Value: input.level },
    ],
  }));
  try {
    await client.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: input.email,
      GroupName: input.role,
    }));
  } catch (error) {
    await client.send(new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: input.email,
    })).catch((rollbackError) => {
      console.error("Rollback delete failed", rollbackError.name, rollbackError.message);
    });
    throw error;
  }
  return getUser(input.email);
}

async function setSingleRole(username, role, enabled) {
  if (role === "EXECUTOR" && enabled) await assertExecutorAvailable(username);
  const current = await groupNamesFor(username);
  const removable = current.filter((group) => ROLES.includes(group) && group !== role);
  for (const group of removable) {
    await client.send(new AdminRemoveUserFromGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: group,
    }));
  }
  if (!current.includes(role)) {
    await client.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: role,
    }));
  }
}

async function updateUser(username, input) {
  const current = await getUser(username);
  if (input.role) await setSingleRole(username, input.role, current.enabled);
  const attributes = [];
  if (input.name) attributes.push({ Name: "name", Value: input.name });
  if (input.phoneNumber) attributes.push({ Name: "phone_number", Value: input.phoneNumber });
  if (input.level) attributes.push({ Name: "custom:level", Value: input.level });
  if (attributes.length > 0) {
    await client.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      UserAttributes: attributes,
    }));
  }
  return getUser(username);
}

async function setEnabled(username, enabled) {
  const current = await getUser(username);
  const groups = await groupNamesFor(username);
  if (enabled && !current.enabled && groups.includes("EXECUTOR")) {
    await assertExecutorAvailable(username);
  }
  const command = enabled
    ? new AdminEnableUserCommand({ UserPoolId: USER_POOL_ID, Username: username })
    : new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: username });
  if (current.enabled !== enabled) await client.send(command);
  return getUser(username);
}

async function resetPassword(username) {
  await getUser(username);
  await client.send(new AdminResetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  }));
}

async function listRoles() {
  const groups = [];
  let nextToken;
  do {
    const page = await client.send(new ListGroupsCommand({
      UserPoolId: USER_POOL_ID,
      NextToken: nextToken,
      Limit: 60,
    }));
    groups.push(...(page.Groups || []));
    nextToken = page.NextToken;
  } while (nextToken);
  return ROLES.flatMap((name) => {
    const group = groups.find((item) => item.GroupName === name);
    if (!group) return [];
    return [{ name: group.GroupName, description: group.Description || "", precedence: group.Precedence }];
  });
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  setEnabled,
  resetPassword,
  listRoles,
};
