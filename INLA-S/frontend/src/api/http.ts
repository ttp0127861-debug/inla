import { accessToken } from "../auth/cognito";
import { triggerForbidden, triggerUnauthorized } from "../auth/sessionPolicy";

export const apiBase = (import.meta.env.VITE_USERS_API_URL || "https://0awsflv60a.execute-api.ap-southeast-1.amazonaws.com").replace(/\/$/, "");

type ErrorBody = { error?: { code?: string; message?: string } };

export async function apiJsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let token: string;
  try {
    token = await accessToken();
  } catch {
    void triggerUnauthorized();
    throw new HttpRequestError(401, "UNAUTHORIZED", "Missing Cognito access token.");
  }
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (init?.body) headers.set("content-type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, { ...init, headers });
  } catch {
    throw new HttpRequestError(0, "NETWORK", "Không kết nối được máy chủ.");
  }

  const text = await response.text();
  let payload: ErrorBody = {};
  if (text) {
    try {
      payload = JSON.parse(text) as ErrorBody;
    } catch {
      payload = {};
    }
  }

  const code = payload.error?.code || "";
  if (response.status === 401 || code === "UNAUTHORIZED") {
    void triggerUnauthorized();
    throw new HttpRequestError(response.status || 401, code || "UNAUTHORIZED", payload.error?.message || "Unauthorized.");
  }
  if (response.status === 403 || code === "FORBIDDEN") {
    triggerForbidden();
    throw new HttpRequestError(response.status || 403, code || "FORBIDDEN", payload.error?.message || "Forbidden.");
  }

  if (!response.ok) {
    throw new HttpRequestError(response.status, code || "INTERNAL_ERROR", payload.error?.message || "Yêu cầu không thành công.");
  }

  return payload as T;
}

export class HttpRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HttpRequestError";
    this.status = status;
    this.code = code;
  }
}
