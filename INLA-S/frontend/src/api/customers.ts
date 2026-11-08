import { apiJsonRequest, HttpRequestError } from "./http";

export type CustomerType = "business" | "individual";
export type EntityStatus = "active" | "inactive";

export type ApiCustomer = {
  id: string;
  code: string;
  customerType: CustomerType;
  name: string;
  shortName: string | null;
  taxId: string;
  phone: string;
  email: string;
  addressLine: string;
  province: string;
  website: string | null;
  notes: string | null;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type ApiContact = {
  id: string;
  customerId: string;
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  email: string;
  phone: string;
  notes: string | null;
  isPrimary: boolean;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
};

export type ApiSalesRelation = {
  id: string;
  customerId: string;
  salesUsername: string;
  status: "active" | "inactive";
  createdAt: string;
  createdBy: string | null;
  endedAt: string | null;
  endedBy: string | null;
};

export type ApiAuditEvent = {
  id?: number;
  occurredAt?: string;
  actorUsername?: string | null;
  actorRole?: string | null;
  requestId?: string | null;
  schemaName?: string;
  tableName?: string;
  operation?: string;
  entityId?: string;
  customerId?: string | null;
  action?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
};

export type CustomerInput = {
  customerType: CustomerType;
  name: string;
  taxId: string;
  phone: string;
  email: string;
  addressLine: string;
  province: string;
  shortName?: string;
  website?: string;
  notes?: string;
};

export type ContactInput = {
  fullName: string;
  email: string;
  phone: string;
  jobTitle?: string;
  department?: string;
  notes?: string;
  isPrimary?: boolean;
};

export type ListCustomersParams = {
  q?: string;
  customerType?: CustomerType;
  province?: string;
  status?: EntityStatus;
  page?: number;
  pageSize?: number;
};

export class CustomersApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "CustomersApiError";
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
        error.code === "NETWORK" ? "Không kết nối được máy chủ khách hàng." : error.message;
      throw new CustomersApiError(error.status, error.code, message);
    }
    throw error;
  }
}

function customerPath(code: string): string {
  return `/customers/${encodeURIComponent(code)}`;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listCustomers(params: ListCustomersParams = {}): Promise<{ customers: ApiCustomer[]; page: number; pageSize: number; total: number }> {
  return request(`/customers${queryString(params)}`);
}

export function getCustomer(code: string): Promise<{ customer: ApiCustomer }> {
  return request(customerPath(code));
}

export function createCustomer(input: CustomerInput): Promise<{ customer: ApiCustomer }> {
  return request("/customers", { method: "POST", body: JSON.stringify(input) });
}

export function updateCustomer(code: string, input: Partial<CustomerInput>): Promise<{ customer: ApiCustomer }> {
  return request(customerPath(code), { method: "PUT", body: JSON.stringify(input) });
}

export function deactivateCustomer(code: string): Promise<{ customer: ApiCustomer }> {
  return request(`${customerPath(code)}/deactivate`, { method: "POST" });
}

export function activateCustomer(code: string): Promise<{ customer: ApiCustomer }> {
  return request(`${customerPath(code)}/activate`, { method: "POST" });
}

export function listContacts(code: string): Promise<{ contacts: ApiContact[] }> {
  return request(`${customerPath(code)}/contacts`);
}

export function getContact(code: string, contactId: string): Promise<{ contact: ApiContact }> {
  return request(`${customerPath(code)}/contacts/${encodeURIComponent(contactId)}`);
}

export function createContact(code: string, input: ContactInput): Promise<{ contact: ApiContact }> {
  return request(`${customerPath(code)}/contacts`, { method: "POST", body: JSON.stringify(input) });
}

export function updateContact(code: string, contactId: string, input: Partial<ContactInput>): Promise<{ contact: ApiContact }> {
  return request(`${customerPath(code)}/contacts/${encodeURIComponent(contactId)}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deactivateContact(code: string, contactId: string): Promise<{ contact: ApiContact }> {
  return request(`${customerPath(code)}/contacts/${encodeURIComponent(contactId)}/deactivate`, { method: "POST" });
}

export function listSalesRelations(code: string): Promise<{ sales: ApiSalesRelation[] }> {
  return request(`${customerPath(code)}/sales`);
}

export function addSalesRelation(code: string, salesUsername: string): Promise<{ relation: ApiSalesRelation }> {
  return request(`${customerPath(code)}/sales`, { method: "POST", body: JSON.stringify({ salesUsername }) });
}

export function removeSalesRelation(code: string, salesUsername: string): Promise<{ relation: ApiSalesRelation }> {
  return request(`${customerPath(code)}/sales/${encodeURIComponent(salesUsername)}/remove`, { method: "POST" });
}

export function listCustomerHistory(
  code: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<{ events: ApiAuditEvent[]; page: number; pageSize: number; total: number }> {
  return request(`${customerPath(code)}/history${queryString(params)}`);
}

export function customersErrorMessage(error: unknown): string {
  if (!(error instanceof CustomersApiError)) return "Không thể hoàn tất thao tác. Vui lòng thử lại.";
  if (error.message === "A customer with this tax ID (MST) already exists.") return "Mã số thuế này đã tồn tại.";
  if (error.message === "Customer not found.") return "Không tìm thấy khách hàng.";
  if (error.message === "Contact not found.") return "Không tìm thấy người liên hệ.";
  if (error.code === "VALIDATION_ERROR") return "Dữ liệu không hợp lệ. Kiểm tra các trường bắt buộc.";
  if (error.code === "FORBIDDEN") return "Bạn không có quyền thực hiện thao tác này.";
  if (error.code === "UNAUTHORIZED") return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (error.code === "NOT_FOUND") return "Không tìm thấy dữ liệu.";
  if (error.code === "CONFLICT") return error.message || "Dữ liệu đã tồn tại.";
  if (error.code === "NETWORK") return error.message;
  return "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}
