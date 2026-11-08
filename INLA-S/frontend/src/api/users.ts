import { apiJsonRequest, HttpRequestError } from "./http";

export type ApiUser = {
  username: string;
  email: string;
  name: string;
  phoneNumber: string;
  level: string;
  role: string | null;
  enabled: boolean;
  status: string;
};

export type ApiRole = {
  name: string;
  description: string;
  precedence: number;
};

export type UserInput = {
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  level: string;
};

export class UsersApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "UsersApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await apiJsonRequest<T>(path, init);
  } catch (error) {
    if (error instanceof HttpRequestError) {
      const message =
        error.code === "NETWORK" ? "Không kết nối được máy chủ người dùng." : error.message;
      throw new UsersApiError(error.status, error.code, message);
    }
    throw error;
  }
}

function userPath(username: string): string {
  return `/users/${encodeURIComponent(username)}`;
}

function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export type ListUsersParams = {
  q?: string;
  role?: string;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
};

export function listUsers(params: ListUsersParams = {}): Promise<{
  users: ApiUser[];
  page: number;
  pageSize: number;
  total: number;
}> {
  return request(`/users${queryString(params)}`);
}

export function getUser(username: string): Promise<{ user: ApiUser }> {
  return request(userPath(username));
}

export function createUser(input: UserInput): Promise<{ user: ApiUser }> {
  return request("/users", { method: "POST", body: JSON.stringify(input) });
}

export function updateUser(username: string, input: Omit<UserInput, "email">): Promise<{ user: ApiUser }> {
  return request(userPath(username), { method: "PUT", body: JSON.stringify(input) });
}

export function disableUser(username: string): Promise<{ user: ApiUser }> {
  return request(`${userPath(username)}/disable`, { method: "POST" });
}

export function enableUser(username: string): Promise<{ user: ApiUser }> {
  return request(`${userPath(username)}/enable`, { method: "POST" });
}

export function resetUserPassword(username: string): Promise<{ username: string; message: string }> {
  return request(`${userPath(username)}/reset-password`, { method: "POST" });
}

export function listRoles(): Promise<{ roles: ApiRole[] }> {
  return request("/roles");
}

export function usersErrorMessage(error: unknown): string {
  if (!(error instanceof UsersApiError)) return "Không thể hoàn tất thao tác. Vui lòng thử lại.";
  if (error.message === "Only one active EXECUTOR is allowed.") return "Chỉ được có một EXECUTOR đang hoạt động.";
  if (error.message === "You cannot disable your own account.") return "Bạn không thể khóa tài khoản của chính mình.";
  if (error.message === "A user with this email already exists.") return "Email này đã tồn tại.";
  if (error.message === "User not found.") return "Không tìm thấy người dùng.";
  if (error.code === "VALIDATION_ERROR") return "Dữ liệu không hợp lệ. Kiểm tra họ tên, email, số điện thoại, vai trò và cấp độ.";
  if (error.code === "FORBIDDEN") return "Bạn không có quyền thực hiện thao tác này.";
  if (error.code === "UNAUTHORIZED") return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (error.code === "EMAIL_FAILED") return "Cognito không gửi được email.";
  if (error.code === "TOO_MANY_REQUESTS") return "Quá nhiều yêu cầu. Vui lòng thử lại sau.";
  if (error.code === "NETWORK") return error.message;
  return "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}
