import { Amplify } from "aws-amplify";
import {
  confirmSignIn,
  fetchAuthSession,
  fetchUserAttributes,
  signIn,
  signOut,
} from "aws-amplify/auth";

export const cognitoConfig = {
  region: "ap-southeast-1",
  userPoolId: "ap-southeast-1_2d8iwcBko",
  userPoolClientId: "34g1h5s3oji7qjnj6695s21759",
} as const;

const groupOrder = ["ADMIN", "DIRECTOR", "EXECUTOR", "SALES", "QA", "R&D", "ACCOUNTING"] as const;

const homeByGroup: Record<(typeof groupOrder)[number], string> = {
  ADMIN: "/dashboard/admin",
  DIRECTOR: "/dashboard/director",
  EXECUTOR: "/dashboard/executor",
  SALES: "/dashboard",
  QA: "/dashboard/qa",
  "R&D": "/dashboard/rnd",
  /** Same overview experience as Executor (department head planning). */
  ACCOUNTING: "/dashboard/executor",
};

export type AuthUser = {
  email: string;
  name: string;
  initials: string;
  groups: string[];
  role: string;
  level: string;
};

export type SignInStep =
  | { step: "done"; user: AuthUser }
  | { step: "new-password" };

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.userPoolId,
      userPoolClientId: cognitoConfig.userPoolClientId,
      userPoolEndpoint: `https://cognito-idp.${cognitoConfig.region}.amazonaws.com`,
      loginWith: { email: true },
    },
  },
});

const sectionsByRole: Record<string, string[]> = {
  ADMIN: ["overview", "quotations", "tasks", "customers", "reports", "admin"],
  DIRECTOR: ["overview", "quotations", "reports"],
  EXECUTOR: ["overview", "quotations", "tasks", "reports"],
  SALES: ["overview", "customers"],
  QA: ["overview", "tasks"],
  "R&D": ["overview", "tasks"],
  /** Mirror EXECUTOR — Trưởng phòng Kế hoạch. */
  ACCOUNTING: ["overview", "quotations", "tasks", "reports"],
};

/** Screen Inventory §9 — RPT-03 departments excludes SALES; other report tabs need reports section. */
export function canAccessReportTab(role: string, path: string): boolean {
  if (!sectionsFor(role).includes("reports")) return false;
  const tab = path.replace(/\/$/, "") || path;
  if (tab === "/reports/departments") return role !== "SALES";
  return tab === "/reports" || tab.startsWith("/reports/");
}

export function sectionsFor(role: string): string[] {
  return sectionsByRole[role] ?? sectionsByRole.SALES;
}

function dashboardRole(path: string): string | null {
  if (path.startsWith("/dashboard/executor")) return "EXECUTOR";
  if (path.startsWith("/dashboard/qa")) return "QA";
  if (path.startsWith("/dashboard/rnd")) return "R&D";
  if (path.startsWith("/dashboard/accounting")) return "ACCOUNTING";
  if (path.startsWith("/dashboard/director")) return "DIRECTOR";
  if (path.startsWith("/dashboard/admin")) return "ADMIN";
  if (path === "/dashboard") return "SALES";
  return null;
}

function sectionFor(path: string): string | null {
  const dashboard = dashboardRole(path);
  if (dashboard) return "overview";
  if (path.startsWith("/quotations")) return "quotations";
  if (path.startsWith("/tasks")) return "tasks";
  if (path.startsWith("/customers")) return "customers";
  if (path.startsWith("/reports")) return "reports";
  if (path.startsWith("/admin")) return "admin";
  return null;
}

const quotationUtilityRoutes = new Set(["new", "clone", "resubmit", "similar-product", "similar-customer"]);
const quotationMutationSegments = new Set(["edit", "send"]);

/** Detail of an existing quotation (workflow tabs). Excludes list, create, clone, and sales edit/send. */
function isQuotationWorkflowPath(path: string): boolean {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "quotations" || parts.length < 2) return false;
  const code = decodeURIComponent(parts[1] ?? "");
  if (quotationUtilityRoutes.has(code)) return false;
  const segment = parts[2];
  if (segment && quotationMutationSegments.has(segment)) return false;
  return true;
}

/** Sales creates a quotation, continues on the draft editor, then opens the saved detail. */
function salesCanOpenQuotation(path: string): boolean {
  if (path === "/quotations/new") return true;
  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "quotations" || parts.length < 2) return false;
  const code = decodeURIComponent(parts[1] ?? "");
  if (quotationUtilityRoutes.has(code)) return false;
  if (parts[2] === "edit") return true;
  return isQuotationWorkflowPath(path);
}

export function canAccessPath(groups: string[], path: string): boolean {
  const role = orderedGroups(groups)[0] ?? "SALES";
  const required = dashboardRole(path);
  if (required) {
    if (role === "ACCOUNTING" && required === "EXECUTOR") return true;
    return required === role;
  }
  if (path.startsWith("/quotations") && (role === "SALES" || role === "QA" || role === "R&D")) {
    if (role === "QA" || role === "R&D") return isQuotationWorkflowPath(path);
    if (role === "SALES") return salesCanOpenQuotation(path);
    return false;
  }
  if (path.startsWith("/reports")) {
    if (role === "SALES" || role === "QA" || role === "R&D") return false;
    return canAccessReportTab(role, path);
  }
  const section = sectionFor(path);
  if (!section) return true;
  return sectionsFor(role).includes(section);
}

export function destinationFor(groups: string[], from?: string): string {
  const home = homeFor(groups);
  if (from && from.startsWith("/") && from !== "/" && !from.startsWith("/forgot") && !from.startsWith("/reset") && canAccessPath(groups, from)) {
    return from;
  }
  return home;
}

export function homeFor(groups: string[]): string {
  const role = orderedGroups(groups)[0];
  if (role && role in homeByGroup) return homeByGroup[role as keyof typeof homeByGroup];
  return "/dashboard";
}

export function orderedGroups(groups: string[]): string[] {
  const known = groupOrder.filter((group) => groups.includes(group));
  const extra = groups.filter((group) => !groupOrder.includes(group as (typeof groupOrder)[number]));
  return [...known, ...extra];
}

export async function currentUser(): Promise<AuthUser | null> {
  const session = await fetchAuthSession();
  const payload = session.tokens?.idToken?.payload;
  if (!payload) return null;
  return userFromToken(payload);
}

export async function accessToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  if (!token) throw new Error("Missing Cognito access token.");
  return token;
}

export async function cognitoSignIn(email: string, password: string): Promise<SignInStep> {
  try {
    const output = await signIn({
      username: email.trim(),
      password,
      options: { authFlowType: "USER_SRP_AUTH" },
    });
    return stepFromSignIn(output.isSignedIn, output.nextStep.signInStep);
  } catch (error) {
    if (errorName(error) === "UserAlreadyAuthenticatedException") {
      const user = await currentUser();
      if (user) return { step: "done", user };
    }
    throw error;
  }
}

export async function cognitoConfirmPassword(password: string): Promise<AuthUser> {
  const output = await confirmSignIn({ challengeResponse: password });
  if (!output.isSignedIn) {
    throw new Error("Cognito did not finish the new-password step.");
  }
  const user = await currentUser();
  if (!user) throw new Error("Signed in, but the session has no ID token.");
  return user;
}

export async function cognitoSignOut(): Promise<void> {
  await signOut();
}

export function authErrorMessage(error: unknown): string {
  const name = errorName(error);
  if (name === "NotAuthorizedException" || name === "UserNotFoundException") {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (name === "InvalidPasswordException" || name === "InvalidParameterException") {
    return "Mật khẩu mới cần tối thiểu 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";
  }
  if (name === "PasswordResetRequiredException" || name === "PasswordResetException") {
    return "Tài khoản cần đặt mật khẩu mới trước khi đăng nhập.";
  }
  if (name === "TooManyRequestsException" || name === "LimitExceededException") {
    return "Bạn đã thử quá nhiều lần. Vui lòng đợi rồi thử lại.";
  }
  if (name === "UserNotConfirmedException") {
    return "Tài khoản chưa được xác nhận.";
  }
  if (name === "ResourceNotFoundException") {
    return "Không tìm thấy user pool hoặc app client. Kiểm tra lại cấu hình Cognito.";
  }
  return "Không thể đăng nhập. Vui lòng thử lại.";
}

async function stepFromSignIn(isSignedIn: boolean, signInStep: string): Promise<SignInStep> {
  if (signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
    return { step: "new-password" };
  }
  if (isSignedIn || signInStep === "DONE") {
    const user = await currentUser();
    if (!user) throw new Error("Signed in, but the session has no ID token.");
    return { step: "done", user };
  }
  throw new Error(`Unsupported Cognito sign-in step: ${signInStep}`);
}

async function userFromToken(payload: Record<string, unknown>): Promise<AuthUser> {
  const groups = orderedGroups(claimGroups(payload["cognito:groups"]));
  let name = claimString(payload.name);
  let email = claimString(payload.email);
  let level = claimString(payload["custom:level"]);

  if (!name || !email || !level) {
    const attributes = await fetchUserAttributes();
    name = name || attributes.name || "";
    email = email || attributes.email || "";
    level = level || attributes["custom:level"] || "";
  }

  const displayName = name || email || "Người dùng";
  return {
    email,
    name: displayName,
    initials: initialsFrom(displayName),
    groups,
    role: groups[0] ?? "USER",
    level,
  };
}

function claimString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function claimGroups(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";
  return `${first}${last}`.toLocaleUpperCase("vi");
}

function errorName(error: unknown): string {
  if (typeof error === "object" && error !== null && "name" in error) return String(error.name);
  return "";
}
