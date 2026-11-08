import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  addSalesRelation,
  createContact,
  createCustomer,
  CustomersApiError,
  customersErrorMessage,
  deactivateContact,
  deactivateCustomer,
  getContact,
  getCustomer,
  listContacts,
  listCustomerHistory,
  listCustomers,
  listSalesRelations,
  removeSalesRelation,
  updateContact,
  updateCustomer,
  type ApiAuditEvent,
  type ApiContact,
  type ApiCustomer,
  type ApiSalesRelation,
  type CustomerInput,
  type CustomerType,
  type EntityStatus,
} from "../../api/customers";
import { listCustomerQuotations, quotationsErrorMessage, type Quotation } from "../../api/quotations";
import { listUsers, type ApiUser } from "../../api/users";
import { businessOutcomeLabel } from "../../lib/quotationLabels";
import { WorkflowStatusBadge } from "../../components/ui/WorkflowStatusBadge";
import { useAuth } from "../../auth/AuthContext";
import { Badge, statusTone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, DataTable, PageTitle } from "../../components/ui/DataTable";
import { Combobox } from "../../components/ui/Combobox";
import { FILTER_EMPTY_HINT } from "../../components/ui/Skeleton";
import { EntityStatusIcon } from "../../components/ui/EntityStatusIcon";
import { IconAction } from "../../components/ui/IconAction";
import { Field } from "../../components/ui/Field";
import { formatPhoneDisplay, normalizePhoneInput } from "../../lib/phoneVN";
import {
  distinctProvincesFrom,
  mergeProvinceCustomers,
  provinceComboboxOptions,
  useDistinctProvinces,
} from "../../lib/useDistinctProvinces";
import { PROVINCE_OPTIONS } from "../../lib/vietnamProvinces";
import {
  ContactFormFields,
  contactFormTouched,
  phoneForForm,
  validateContactForm,
  type ContactFormFieldKey,
} from "./customerContactForm";
import { IconLock } from "../admin/adminUserIcons";
import { customerFormIcons } from "./customerFormIcons";
import { IconUnlink } from "./customerListIcons";
import {
  validateEmailField,
  validatePhoneField,
  validateProvinceField,
  validateTaxIdField,
  validateWebsiteField,
} from "./customerValidation";
import { CustomerLayoutSkeleton } from "../../components/ui/ListPanelState";
import { CircleIconButton, CollapsibleSection } from "../../components/ui/CollapsibleSection";
import { Modal } from "../../components/ui/Modal";
import { customerTabs, TabRow, type CustomerTabCounts } from "../../components/ui/Tabs";

type CustomerCtx = {
  customer: ApiCustomer;
  tabCounts: CustomerTabCounts;
  reload: () => Promise<void>;
  refreshTabCounts: () => Promise<void>;
  isAdmin: boolean;
};

const CustomerContext = createContext<CustomerCtx | null>(null);

function useCustomerContext(): CustomerCtx {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("CustomerContext missing");
  return ctx;
}

function useCustomerCode(): string {
  const { code } = useParams();
  if (!code) throw new Error("Missing customer code");
  return decodeURIComponent(code);
}

function customerHref(code: string, segment?: string): string {
  const base = `/customers/${encodeURIComponent(code)}`;
  return segment ? `${base}/${segment}` : base;
}

function customerTypeLabel(type: CustomerType): string {
  return type === "business" ? "Doanh nghiệp" : "Cá nhân";
}

function entityStatusLabel(status: EntityStatus): string {
  return status === "active" ? "Hoạt động" : "Ngừng hoạt động";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("vi-VN");
}

function Notice({ tone, children }: { tone: "error" | "info" | "ok"; children: string }) {
  const toneClass = tone === "error" ? "bg-[#fef2f2] text-[#b91c1c]" : tone === "ok" ? "bg-[#f0fdf4] text-[#166534]" : "bg-[#eff6ff] text-[var(--color-text-body)]";
  return <p className={`mb-4 rounded-[var(--radius-sm)] p-3 text-sm ${toneClass}`}>{children}</p>;
}

function auditSummary(event: ApiAuditEvent): string {
  if (event.action) return event.action;
  const parts = [event.operation, event.tableName].filter(Boolean);
  return parts.join(" · ") || "Thay đổi";
}

function auditValue(data: Record<string, unknown> | null | undefined, key: string): string {
  if (!data || data[key] == null) return "—";
  const value = data[key];
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
}

function userDisplayName(account: ApiUser | undefined, username: string): string {
  if (account?.name) return account.name;
  return username;
}

type ListDraft = { q: string; customerType: string; province: string; status: string };

const emptyListDraft: ListDraft = { q: "", customerType: "", province: "", status: "" };

type CustomerFormState = CustomerInput;

const emptyCustomerForm: CustomerFormState = {
  customerType: "business",
  name: "",
  taxId: "",
  phone: "",
  email: "",
  addressLine: "",
  province: "",
  shortName: "",
  website: "",
  notes: "",
};

type InlineContactFormState = {
  fullName: string;
  jobTitle: string;
  department: string;
  phone: string;
  email: string;
  notes: string;
  isPrimary: boolean;
};

type InlineContactRow = InlineContactFormState & { id: string; contactId?: string };

const emptyInlineContact: InlineContactFormState = {
  fullName: "",
  jobTitle: "",
  department: "",
  phone: "",
  email: "",
  notes: "",
  isPrimary: true,
};

function newInlineContactRow(isPrimary: boolean): InlineContactRow {
  return { ...emptyInlineContact, isPrimary, id: crypto.randomUUID() };
}

function contactRowFromApi(contact: ApiContact): InlineContactRow {
  return {
    id: contact.id,
    contactId: contact.id,
    fullName: contact.fullName,
    jobTitle: contact.jobTitle ?? "",
    department: contact.department ?? "",
    phone: phoneForForm(contact.phone),
    email: contact.email,
    notes: contact.notes ?? "",
    isPrimary: contact.isPrimary,
  };
}

function contactPayloadFromRow(row: InlineContactRow) {
  return {
    fullName: row.fullName.trim(),
    jobTitle: row.jobTitle.trim() || undefined,
    department: row.department.trim() || undefined,
    notes: row.notes.trim() || undefined,
    email: row.email.trim(),
    phone: normalizePhoneInput(row.phone.trim()),
    isPrimary: row.isPrimary,
  };
}

function formFromCustomer(customer: ApiCustomer): CustomerFormState {
  return {
    customerType: customer.customerType,
    name: customer.name,
    taxId: customer.taxId,
    phone: phoneForForm(customer.phone),
    email: customer.email,
    addressLine: customer.addressLine,
    province: customer.province,
    shortName: customer.shortName ?? "",
    website: customer.website ?? "",
    notes: customer.notes ?? "",
  };
}

function validateCustomerForm(form: CustomerFormState): Partial<Record<keyof CustomerFormState, string>> {
  const errors: Partial<Record<keyof CustomerFormState, string>> = {};
  if (!form.name.trim()) errors.name = "Nhập tên khách hàng.";
  const taxErr = validateTaxIdField(form.taxId);
  if (taxErr) errors.taxId = taxErr;
  const phoneErr = validatePhoneField(form.phone);
  if (phoneErr) errors.phone = phoneErr;
  if (form.email.trim()) {
    const emailErr = validateEmailField(form.email);
    if (emailErr) errors.email = emailErr;
  }
  const provinceErr = validateProvinceField(form.province);
  if (provinceErr) errors.province = provinceErr;
  if (!form.addressLine.trim()) errors.addressLine = "Nhập địa chỉ.";
  const websiteErr = validateWebsiteField(form.website);
  if (websiteErr) errors.website = websiteErr;
  return errors;
}

function buildCustomerPayload(form: CustomerFormState): CustomerInput {
  const shortName = form.shortName?.trim();
  const website = form.website?.trim();
  return {
    customerType: form.customerType,
    name: form.name.trim(),
    taxId: form.taxId.trim(),
    phone: normalizePhoneInput(form.phone.trim()),
    email: form.email.trim(),
    addressLine: form.addressLine.trim(),
    province: form.province.trim(),
    notes: form.notes?.trim() || undefined,
    shortName: shortName || undefined,
    website: website || undefined,
  };
}

function CustomerLayout() {
  const code = useCustomerCode();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.groups.includes("ADMIN"));
  const [customer, setCustomer] = useState<ApiCustomer | null>(null);
  const [tabCounts, setTabCounts] = useState<CustomerTabCounts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadTabCounts = useCallback(async () => {
    const [contacts, sales, quotes] = await Promise.all([
      listContacts(code).catch(() => ({ contacts: [] as ApiContact[] })),
      listSalesRelations(code).catch(() => ({ sales: [] as ApiSalesRelation[] })),
      listCustomerQuotations(code, { pageSize: 1 }).catch(() => ({ total: 0, quotations: [] as Quotation[], page: 1, pageSize: 1 })),
    ]);
    setTabCounts({
      contacts: contacts.contacts.filter((c) => c.status === "active").length,
      sales: sales.sales.filter((s) => s.status === "active").length,
      quotes: quotes.total,
    });
  }, [code]);

  const reloadCustomer = useCallback(async () => {
    const detail = await getCustomer(code);
    setCustomer(detail.customer);
  }, [code]);

  const reload = useCallback(async () => {
    await Promise.all([reloadCustomer(), reloadTabCounts()]);
  }, [reloadCustomer, reloadTabCounts]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    reloadCustomer()
      .then(() => {
        if (active) setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(customersErrorMessage(loadError));
        setLoading(false);
      });
    void reloadTabCounts().catch(() => {});
    return () => {
      active = false;
    };
  }, [code, reloadCustomer, reloadTabCounts]);

  if (loading) {
    return <CustomerLayoutSkeleton />;
  }
  if (error || !customer) {
    return <Notice tone="error">{error || "Không tìm thấy khách hàng."}</Notice>;
  }

  return (
    <CustomerContext.Provider value={{ customer, tabCounts, reload, refreshTabCounts: reloadTabCounts, isAdmin }}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-5">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {customer.code} · {customerTypeLabel(customer.customerType)}
          </p>
          <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-brand-primary)]">{customer.name}</h1>
          <Badge tone={statusTone(entityStatusLabel(customer.status))}>{entityStatusLabel(customer.status)}</Badge>
        </div>
        <div className="flex gap-2">
          <Button to={customerHref(code, "edit")} variant="secondary">
            Sửa thông tin
          </Button>
          <Button to="/quotations/new">Tạo báo giá</Button>
        </div>
      </div>
      <TabRow tabs={customerTabs(code, tabCounts)} />
      <div className="pt-6">
        <Outlet />
      </div>
    </CustomerContext.Provider>
  );
}

export function CustomerShellRoute() {
  return <CustomerLayout />;
}

export function CustomerListPage() {
  const [rows, setRows] = useState<ApiCustomer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ListDraft>(emptyListDraft);
  const [applied, setApplied] = useState<ListDraft>(emptyListDraft);
  const [provincePool, setProvincePool] = useState<ApiCustomer[]>([]);

  const distinctProvinces = useMemo(() => distinctProvincesFrom(provincePool), [provincePool]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listCustomers({
      q: applied.q || undefined,
      customerType: (applied.customerType as CustomerType) || undefined,
      province: applied.province || undefined,
      status: (applied.status as EntityStatus) || undefined,
      pageSize: 100,
    })
      .then((result) => {
        if (!active) return;
        setRows(result.customers);
        setProvincePool((prev) => mergeProvinceCustomers(prev, result.customers));
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(customersErrorMessage(loadError));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applied]);

  useEffect(() => {
    if (loading || distinctProvinces.length >= 3) return;
    let cancelled = false;
    (async () => {
      for (let page = 1; page <= 2; page++) {
        const result = await listCustomers({ page, pageSize: 20 });
        if (cancelled) return;
        setProvincePool((prev) => mergeProvinceCustomers(prev, result.customers));
        if (page * result.pageSize >= result.total) break;
      }
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loading, distinctProvinces.length]);

  return (
    <>
      <PageTitle title="Quản lý khách hàng" aside={<Button to="/customers/new">+ Tạo khách hàng</Button>} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_160px_auto_auto]">
          <input
            placeholder="Tìm theo tên khách hàng, mã số thuế, SĐT, email..."
            className="h-10 rounded border border-[var(--color-input-border)] px-3 text-sm"
            value={draft.q}
            onChange={(event) => setDraft((prev) => ({ ...prev, q: event.target.value }))}
          />
          <select
            className="h-10 rounded border border-[var(--color-input-border)] px-3 text-sm"
            value={draft.customerType}
            onChange={(event) => setDraft((prev) => ({ ...prev, customerType: event.target.value }))}
          >
            <option value="">Loại khách hàng</option>
            <option value="business">Doanh nghiệp</option>
            <option value="individual">Cá nhân</option>
          </select>
          <Combobox
            placeholder="Tỉnh/Thành phố"
            ariaLabel="Tỉnh/Thành phố"
            value={draft.province}
            options={distinctProvinces}
            onChange={(province) => setDraft((prev) => ({ ...prev, province }))}
          />
          <select
            className="h-10 rounded border border-[var(--color-input-border)] px-3 text-sm"
            value={draft.status}
            onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="">Trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
          <Button onClick={() => setApplied({ ...draft })}>Lọc</Button>
          <Button
            variant="text"
            onClick={() => {
              setDraft(emptyListDraft);
              setApplied(emptyListDraft);
            }}
          >
            Đặt lại
          </Button>
        </div>
      </Card>
      <DataTable
        loading={loading}
        emptyHint={FILTER_EMPTY_HINT}
        skeletonCells={["barWide", "bar", "bar", "barNarrow", "barWide", "bar", "pill"]}
        columns={["Tên khách hàng", "Loại KH", "Mã số thuế", "Số điện thoại", "Email", "Tỉnh/Thành phố", "Trạng thái"]}
        rows={(rows ?? []).map((row) => [
          <Link key={`${row.code}-name`} to={customerHref(row.code)} className="font-semibold text-[var(--color-action-primary)]">
            {row.name}
          </Link>,
          customerTypeLabel(row.customerType),
          row.taxId,
          formatPhoneDisplay(row.phone),
          row.email,
          row.province,
          <EntityStatusIcon key={`${row.code}-status`} status={row.status} />,
        ])}
      />
    </>
  );
}

function CustomerFormBody({ code }: { code?: string }) {
  const editing = Boolean(code);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.groups.includes("ADMIN"));
  const isSales = Boolean(user?.role === "SALES" || user?.groups.includes("SALES"));
  const [form, setForm] = useState<CustomerFormState>(emptyCustomerForm);
  const [inlineContacts, setInlineContacts] = useState<InlineContactRow[]>([newInlineContactRow(true)]);
  const [inlineContactErrors, setInlineContactErrors] = useState<
    Record<string, Partial<Record<ContactFormFieldKey, string>>>
  >({});
  const [customerInfoOpen, setCustomerInfoOpen] = useState(true);
  const [contactsSectionOpen, setContactsSectionOpen] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormState, string>>>({});
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    (location.state as { notice?: string } | null)?.notice ?? null,
  );
  const [salesUsers, setSalesUsers] = useState<ApiUser[]>([]);
  const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
  const [initialSales, setInitialSales] = useState<Set<string>>(new Set());
  const [customerStatus, setCustomerStatus] = useState<EntityStatus>("active");
  const [initialContactIds, setInitialContactIds] = useState<string[]>([]);
  const [formProvinceSeed, setFormProvinceSeed] = useState<ApiCustomer[] | null>(null);
  const formDistinctProvinces = useDistinctProvinces(formProvinceSeed);
  const formProvinceOptions = useMemo(
    () => provinceComboboxOptions(formDistinctProvinces, form.province, PROVINCE_OPTIONS, editing),
    [formDistinctProvinces, form.province, editing],
  );

  useEffect(() => {
    let active = true;
    listCustomers({ pageSize: 100, page: 1 })
      .then((result) => {
        if (!active) return;
        setFormProvinceSeed(result.customers);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!editing || !code) return;
    let active = true;
    Promise.all([getCustomer(code), listSalesRelations(code), listUsers(), listContacts(code)])
      .then(([detail, relations, users, contactList]) => {
        if (!active) return;
        setForm(formFromCustomer(detail.customer));
        setCustomerStatus(detail.customer.status);
        const activeSales = new Set(
          relations.sales.filter((item) => item.status === "active").map((item) => item.salesUsername.toLowerCase()),
        );
        setSelectedSales(activeSales);
        setInitialSales(new Set(activeSales));
        setSalesUsers(users.users.filter((account) => account.role === "SALES" && account.enabled));
        const activeContacts = contactList.contacts.filter((item) => item.status === "active");
        setInitialContactIds(activeContacts.map((item) => item.id));
        if (detail.customer.customerType === "business") {
          setInlineContacts(
            activeContacts.length > 0 ? activeContacts.map(contactRowFromApi) : [newInlineContactRow(true)],
          );
          setInlineContactErrors({});
        }
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setNotice(customersErrorMessage(loadError));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [code, editing]);

  useEffect(() => {
    if (editing || !isAdmin) return;
    let active = true;
    listUsers()
      .then((result) => {
        if (!active) return;
        setSalesUsers(result.users.filter((account) => account.role === "SALES" && account.enabled));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [editing, isAdmin]);

  const setField = (key: keyof CustomerFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setContactField = (id: string, key: keyof InlineContactFormState | ContactFormFieldKey, value: string | boolean) => {
    setInlineContacts((prev) =>
      prev.map((row) => {
        if (row.id !== id) {
          if (key === "isPrimary" && value === true) return { ...row, isPrimary: false };
          return row;
        }
        return { ...row, [key]: value };
      }),
    );
    setInlineContactErrors((prev) => ({ ...prev, [id]: { ...prev[id], [key]: undefined } }));
  };

  const addInlineContact = () => {
    setInlineContacts((prev) => [...prev, newInlineContactRow(prev.length === 0)]);
  };

  const removeInlineContact = (id: string) => {
    setInlineContacts((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((row) => row.id !== id);
      if (!next.some((row) => row.isPrimary) && next[0]) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
    setInlineContactErrors((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const toggleSales = (username: string) => {
    const key = username.toLowerCase();
    setSelectedSales((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    const nextErrors = validateCustomerForm(form);
    setErrors(nextErrors);
    const contactErrorsById: Record<string, Partial<Record<ContactFormFieldKey, string>>> = {};
    if (form.customerType === "business") {
      for (const row of inlineContacts) {
        const rowErrors = validateContactForm(row, editing ? { requireAll: true } : undefined);
        if (Object.keys(rowErrors).length > 0) contactErrorsById[row.id] = rowErrors;
      }
      setInlineContactErrors(contactErrorsById);
    }
    if (Object.keys(nextErrors).length > 0 || Object.keys(contactErrorsById).length > 0) return;
    if (editing && form.customerType === "business" && inlineContacts.length < 1) {
      setNotice("Doanh nghiệp phải có ít nhất một người liên hệ đang hoạt động.");
      return;
    }

    setSaving(true);
    setNotice(null);
    const payload = buildCustomerPayload(form);
    try {
      if (editing && code) {
        const { customer } = await updateCustomer(code, payload);
        if (isAdmin) {
          const toAdd = [...selectedSales].filter((username) => !initialSales.has(username));
          const toRemove = [...initialSales].filter((username) => !selectedSales.has(username));
          await Promise.all([
            ...toAdd.map((username) => addSalesRelation(customer.code, username)),
            ...toRemove.map((username) => removeSalesRelation(customer.code, username)),
          ]);
        }
        if (form.customerType === "business") {
          const remainingIds = new Set(
            inlineContacts.map((row) => row.contactId).filter((id): id is string => Boolean(id)),
          );
          const toDeactivate = initialContactIds.filter((id) => !remainingIds.has(id));
          try {
            for (const contactId of toDeactivate) {
              await deactivateContact(code, contactId);
            }
            for (const row of inlineContacts) {
              const contactPayload = contactPayloadFromRow(row);
              if (row.contactId) {
                await updateContact(code, row.contactId, contactPayload);
              } else {
                await createContact(code, contactPayload);
              }
            }
          } catch (contactError: unknown) {
            setSaving(false);
            setNotice(customersErrorMessage(contactError));
            return;
          }
        }
        navigate(customerHref(customer.code));
      } else {
        const { customer } = await createCustomer(payload);
        if (isAdmin && selectedSales.size > 0) {
          await Promise.all([...selectedSales].map((username) => addSalesRelation(customer.code, username)));
        }
        const contactsToCreate = inlineContacts.filter((row) => contactFormTouched(row));
        if (form.customerType === "business" && contactsToCreate.length > 0) {
          try {
            for (const row of contactsToCreate) {
              await createContact(customer.code, contactPayloadFromRow(row));
            }
          } catch (contactError: unknown) {
            setSaving(false);
            navigate(customerHref(customer.code), {
              replace: true,
              state: { notice: customersErrorMessage(contactError) },
            });
            return;
          }
        }
        navigate(customerHref(customer.code));
      }
    } catch (saveError: unknown) {
      const message = customersErrorMessage(saveError);
      if (
        saveError instanceof CustomersApiError &&
        (message.includes("Mã số thuế") || saveError.message.includes("tax ID"))
      ) {
        setErrors((prev) => ({ ...prev, taxId: message }));
      } else {
        setNotice(message);
      }
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Đang tải…</p>;
  }

  return (
    <>
      <Link to="/customers" className="mb-3 inline-block text-sm text-[var(--color-action-primary)]">
        ← Quay lại danh sách khách hàng
      </Link>
      <PageTitle
        title={editing ? "Cập nhật khách hàng" : "Tạo khách hàng mới"}
        aside={editing && code ? <Badge tone={statusTone(entityStatusLabel(customerStatus))}>{`${code} · ${entityStatusLabel(customerStatus)}`}</Badge> : undefined}
      />
      {notice ? <Notice tone="error">{notice}</Notice> : null}
      <Card className="space-y-4">
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              checked={form.customerType === "business"}
              onChange={() => {
                setField("customerType", "business");
              }}
            />{" "}
            Doanh nghiệp
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              checked={form.customerType === "individual"}
              onChange={() => {
                setField("customerType", "individual");
                setInlineContacts([newInlineContactRow(true)]);
                setInlineContactErrors({});
              }}
            />{" "}
            Cá nhân
          </label>
        </div>
        <CollapsibleSection
          title="Thông tin khách hàng"
          open={customerInfoOpen}
          onToggle={() => setCustomerInfoOpen((value) => !value)}
        >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Tên khách hàng"
            labelOnHover
            required
            requiredInside
            icon={customerFormIcons.name}
            value={form.name}
            error={errors.name}
            placeholder="Nhập tên khách hàng"
            onChange={(value) => setField("name", value)}
          />
          <Field
            label="Tên viết tắt"
            labelOnHover
            icon={customerFormIcons.shortName}
            value={form.shortName ?? ""}
            placeholder="Nhập tên viết tắt"
            onChange={(value) => setField("shortName", value)}
          />
          <Field
            label="Mã số thuế"
            labelOnHover
            required
            requiredInside
            icon={customerFormIcons.taxId}
            value={form.taxId}
            error={errors.taxId}
            placeholder="Nhập mã số thuế"
            onChange={(value) => setField("taxId", value)}
          />
          <Field
            label="Website"
            labelOnHover
            icon={customerFormIcons.website}
            value={form.website ?? ""}
            error={errors.website}
            placeholder="https://"
            onChange={(value) => setField("website", value)}
          />
          <Field
            label="Số điện thoại"
            labelOnHover
            required
            requiredInside
            icon={customerFormIcons.phone}
            value={form.phone}
            error={errors.phone}
            placeholder="Nhập số điện thoại"
            onChange={(value) => setField("phone", value)}
            onBlur={() => {
              const normalized = phoneForForm(normalizePhoneInput(form.phone.trim()));
              if (normalized !== form.phone) setField("phone", normalized);
            }}
          />
          <Field
            label="Email công ty"
            labelOnHover
            icon={customerFormIcons.email}
            value={form.email}
            error={errors.email}
            placeholder="Nhập địa chỉ email"
            onChange={(value) => setField("email", value)}
          />
          <Combobox
            label="Tỉnh/Thành phố"
            labelOnHover
            required
            requiredInside
            icon={customerFormIcons.province}
            allowCustom={false}
            placeholder="Nhập Tỉnh/Thành phố"
            ariaLabel="Tỉnh/Thành phố"
            value={form.province}
            error={errors.province}
            options={formProvinceOptions}
            onChange={(value) => setField("province", value)}
          />
          <Field
            label="Địa chỉ"
            labelOnHover
            required
            requiredInside
            icon={customerFormIcons.address}
            as="textarea"
            rows={1}
            value={form.addressLine}
            error={errors.addressLine}
            placeholder="Nhập số nhà, tên đường, phường/xã"
            onChange={(value) => setField("addressLine", value)}
          />
        </div>
        <div className="mt-4">
          <Field
            label="Ghi chú"
            labelOnHover
            icon={customerFormIcons.notes}
            as="textarea"
            rows={2}
            value={form.notes ?? ""}
            placeholder="Nhập ghi chú về khách hàng"
            onChange={(value) => setField("notes", value)}
          />
        </div>
        {!editing && isSales && user?.name ? (
          <p className="mt-4 text-sm text-[var(--color-text-body)]">
            <span className="font-medium text-[var(--color-text-muted)]">Sales phụ trách:</span> {user.name}
          </p>
        ) : null}
        </CollapsibleSection>
        {form.customerType === "business" ? (
          <CollapsibleSection
            title="Người liên hệ"
            open={contactsSectionOpen}
            onToggle={() => setContactsSectionOpen((value) => !value)}
            trailing={<CircleIconButton label="Thêm người liên hệ" variant="add" onClick={addInlineContact} />}
          >
            <Notice tone="info">
              Báo giá chỉ gửi được khi doanh nghiệp có ít nhất một người liên hệ đang hoạt động. Phải giữ ít nhất
              một người liên hệ trên form.
            </Notice>
            <div className="mt-4 space-y-6">
              {inlineContacts.map((row, index) => {
                const touched = contactFormTouched(row);
                const rowErrors = inlineContactErrors[row.id] ?? {};
                return (
                  <div key={row.id} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--color-text-strong)]">Người liên hệ {index + 1}</p>
                      <CircleIconButton
                        label="Xóa người liên hệ"
                        variant="remove"
                        disabled={inlineContacts.length <= 1}
                        onClick={() => removeInlineContact(row.id)}
                      />
                    </div>
                    <ContactFormFields
                      values={row}
                      errors={rowErrors}
                      required={editing || touched}
                      layout="grid"
                      primaryMode="checkbox"
                      isPrimary={row.isPrimary}
                      onChange={(key, value) => setContactField(row.id, key, value)}
                      onPhoneBlur={() => {
                        const normalized = phoneForForm(normalizePhoneInput(row.phone.trim()));
                        if (normalized !== row.phone) setContactField(row.id, "phone", normalized);
                      }}
                      onPrimaryChange={(value) => setContactField(row.id, "isPrimary", Boolean(value))}
                    />
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        ) : null}
        {form.customerType === "individual" ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Cá nhân không bắt buộc người liên hệ. Khi không có, hệ thống dùng thông tin khách hàng.
          </p>
        ) : null}
        {isAdmin ? (
          <>
            <p className="mt-6 mb-2 text-sm font-semibold">Nhân viên Sales liên quan</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {salesUsers.length === 0 ? (
                <span className="text-[var(--color-text-muted)]">Chưa có tài khoản Sales hoạt động.</span>
              ) : (
                salesUsers.map((account) => (
                  <label key={account.username} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedSales.has(account.username.toLowerCase())}
                      onChange={() => toggleSales(account.username)}
                    />{" "}
                    {account.name}
                  </label>
                ))
              )}
            </div>
          </>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          {editing && code && isAdmin && customerStatus === "active" ? (
            <Button to={customerHref(code, "deactivate")} variant="error-outline">
              Ngừng hoạt động
            </Button>
          ) : null}
          <Button to="/customers" variant="text">
            Hủy
          </Button>
          <Button loading={saving} onClick={save}>
            {editing ? "Lưu thay đổi" : "Lưu"}
          </Button>
        </div>
      </Card>
    </>
  );
}

export function CustomerCreatePage() {
  return <CustomerFormBody />;
}

export function CustomerEditPage() {
  const code = useCustomerCode();
  return <CustomerFormBody code={code} />;
}

export function CustomerDetailPage() {
  const { customer } = useCustomerContext();
  const [salesInCharge, setSalesInCharge] = useState<string>("—");

  useEffect(() => {
    let active = true;
    Promise.all([listSalesRelations(customer.code), listUsers()])
      .then(([relations, users]) => {
        if (!active) return;
        const activeRelations = relations.sales.filter((item) => item.status === "active");
        const byUsername = new Map(users.users.map((account) => [account.username.toLowerCase(), account]));
        const labels = activeRelations.map((relation) =>
          userDisplayName(byUsername.get(relation.salesUsername.toLowerCase()), relation.salesUsername),
        );
        setSalesInCharge(labels.length > 0 ? labels.join(", ") : "—");
      })
      .catch(() => {
        if (active) setSalesInCharge("—");
      });
    return () => {
      active = false;
    };
  }, [customer.code]);

  const detailFields: { label: string; value: string; icon: ReactNode }[] = [
    { label: "Tên khách hàng", value: customer.name, icon: customerFormIcons.name },
  ];
  if (customer.shortName?.trim()) {
    detailFields.push({ label: "Tên viết tắt", value: customer.shortName, icon: customerFormIcons.shortName });
  }
  detailFields.push(
    { label: "Mã số thuế", value: customer.taxId, icon: customerFormIcons.taxId },
    { label: "Số điện thoại", value: formatPhoneDisplay(customer.phone), icon: customerFormIcons.phone },
    { label: "Email", value: customer.email, icon: customerFormIcons.email },
    { label: "Tỉnh/Thành phố", value: customer.province, icon: customerFormIcons.province },
    { label: "Địa chỉ", value: customer.addressLine, icon: customerFormIcons.address },
  );
  if (customer.website?.trim()) {
    detailFields.push({ label: "Website", value: customer.website, icon: customerFormIcons.website });
  }
  detailFields.push(
    { label: "Loại khách hàng", value: customerTypeLabel(customer.customerType), icon: customerFormIcons.customerType },
    { label: "Sales phụ trách", value: salesInCharge, icon: customerFormIcons.sales },
    { label: "Trạng thái", value: entityStatusLabel(customer.status), icon: customerFormIcons.status },
  );
  if (customer.notes) {
    detailFields.push({ label: "Ghi chú", value: customer.notes, icon: customerFormIcons.notes });
  }

  const location = useLocation();
  const routeNotice = (location.state as { notice?: string } | null)?.notice;

  return (
    <Card>
      {routeNotice ? <Notice tone="error">{routeNotice}</Notice> : null}
      <h2 className="mb-4 text-base font-semibold">Thông tin khách hàng</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {detailFields.map((field) => (
          <Field key={field.label} label={field.label} labelOnHover icon={field.icon} value={field.value} readOnly />
        ))}
      </div>
    </Card>
  );
}

function ContactFormModal({ contactId }: { contactId?: string }) {
  const code = useCustomerCode();
  const navigate = useNavigate();
  const editing = Boolean(contactId);
  const [form, setForm] = useState({
    fullName: "",
    jobTitle: "",
    department: "",
    email: "",
    phone: "",
    notes: "",
    isPrimary: "false",
  });
  const [errors, setErrors] = useState<Partial<Record<ContactFormFieldKey, string>>>({});
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!contactId) return;
    let active = true;
    getContact(code, contactId)
      .then(({ contact }) => {
        if (!active) return;
        setForm({
          fullName: contact.fullName,
          jobTitle: contact.jobTitle ?? "",
          department: contact.department ?? "",
          email: contact.email,
          phone: phoneForForm(contact.phone),
          notes: contact.notes ?? "",
          isPrimary: contact.isPrimary ? "true" : "false",
        });
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setNotice(customersErrorMessage(loadError));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [code, contactId]);

  const save = async () => {
    const nextErrors = validateContactForm(
      {
        fullName: form.fullName,
        jobTitle: form.jobTitle,
        department: form.department,
        phone: form.phone,
        email: form.email,
        notes: form.notes,
      },
      { requireAll: true },
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setNotice(null);
    const payload = {
      fullName: form.fullName.trim(),
      jobTitle: form.jobTitle.trim() || undefined,
      department: form.department.trim() || undefined,
      notes: form.notes.trim() || undefined,
      email: form.email.trim(),
      phone: normalizePhoneInput(form.phone.trim()),
      isPrimary: form.isPrimary === "true",
    };
    try {
      if (editing && contactId) {
        await updateContact(code, contactId, payload);
      } else {
        await createContact(code, payload);
      }
      navigate(customerHref(code, "contacts"));
    } catch (saveError: unknown) {
      setNotice(customersErrorMessage(saveError));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? "Chỉnh sửa người liên hệ" : "Thêm người liên hệ"}
      closeTo={customerHref(code, "contacts")}
    >
      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Đang tải…</p>
      ) : (
        <>
          {notice ? <Notice tone="error">{notice}</Notice> : null}
          <ContactFormFields
            layout="stack"
            required
            values={{
              fullName: form.fullName,
              jobTitle: form.jobTitle,
              department: form.department,
              phone: form.phone,
              email: form.email,
              notes: form.notes,
            }}
            errors={errors}
            onChange={(key, value) => {
              setForm((prev) => ({ ...prev, [key]: value }));
              setErrors((prev) => ({ ...prev, [key]: undefined }));
            }}
            onPhoneBlur={() => {
              const normalized = phoneForForm(normalizePhoneInput(form.phone.trim()));
              if (normalized !== form.phone) setForm((prev) => ({ ...prev, phone: normalized }));
            }}
            primaryMode="select"
            isPrimary={form.isPrimary}
            onPrimaryChange={(value) => setForm((prev) => ({ ...prev, isPrimary: String(value) }))}
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button to={customerHref(code, "contacts")} variant="text">
              Hủy
            </Button>
            <Button loading={saving} onClick={save}>
              Lưu
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

export function CustomerContactsPage({ modal }: { modal?: boolean }) {
  const code = useCustomerCode();
  const { contactId } = useParams();
  const [contacts, setContacts] = useState<ApiContact[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listContacts(code)
      .then((result) => {
        if (!active) return;
        setContacts(result.contacts);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(customersErrorMessage(loadError));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [code]);

  const activeContacts = useMemo(
    () => (contacts ?? []).filter((row) => row.status === "active"),
    [contacts],
  );
  const allowDeactivateContact = activeContacts.length > 1;

  return (
    <>
      <div className="mb-4 flex justify-between">
        <h2 className="text-base font-semibold">Danh sách người liên hệ</h2>
        <Button to={customerHref(code, "contacts/new")}>+ Thêm người liên hệ</Button>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <DataTable
        loading={loading}
        skeletonCells={
          allowDeactivateContact
            ? ["barWide", "bar", "bar", "barNarrow", "barWide", "bar", "icon", "icon"]
            : ["barWide", "bar", "bar", "barNarrow", "barWide", "bar", "icon"]
        }
        columns={
          allowDeactivateContact
            ? ["Họ và tên", "Chức vụ", "Phòng ban", "Số điện thoại", "Email", "Vai trò liên hệ", "Trạng thái", "Hành động"]
            : ["Họ và tên", "Chức vụ", "Phòng ban", "Số điện thoại", "Email", "Vai trò liên hệ", "Trạng thái"]
        }
        rows={activeContacts.map((row) => {
          const cells: ReactNode[] = [
            <Link
              key={`${row.id}-name`}
              to={customerHref(code, `contacts/${row.id}/edit`)}
              className="font-semibold text-[var(--color-action-primary)]"
            >
              {row.fullName}
            </Link>,
            row.jobTitle || "—",
            row.department || "—",
            formatPhoneDisplay(row.phone),
            row.email,
            row.isPrimary ? "Liên hệ chính" : "Liên hệ phụ",
            <EntityStatusIcon key={`${row.id}-status`} status={row.status} />,
          ];
          if (allowDeactivateContact) {
            cells.push(
              <IconAction
                key={`${row.id}-deactivate`}
                label="Ngừng hoạt động"
                variant="danger"
                to={customerHref(code, `contacts/${row.id}/deactivate`)}
                icon={<IconLock open />}
              />,
            );
          }
          return cells;
        })}
      />
      {modal ? <ContactFormModal contactId={contactId} /> : null}
    </>
  );
}

export function CustomerSalesPage() {
  const code = useCustomerCode();
  const { isAdmin } = useCustomerContext();
  const [relations, setRelations] = useState<ApiSalesRelation[] | null>(null);
  const [accounts, setAccounts] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [addUsername, setAddUsername] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([listSalesRelations(code), listUsers()])
      .then(([sales, users]) => {
        setRelations(sales.sales.filter((item) => item.status === "active"));
        setAccounts(users.users);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        setError(customersErrorMessage(loadError));
        setLoading(false);
      });
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  const accountByUsername = useMemo(() => {
    const map = new Map<string, ApiUser>();
    for (const account of accounts) {
      map.set(account.username.toLowerCase(), account);
      map.set(account.email.toLowerCase(), account);
    }
    return map;
  }, [accounts]);

  const salesOptions = useMemo(
    () =>
      accounts
        .filter((account) => account.role === "SALES" && account.enabled)
        .map((account) => ({ value: account.username, label: account.name })),
    [accounts],
  );

  const remove = async (username: string) => {
    setPending(username);
    setError(null);
    try {
      await removeSalesRelation(code, username);
      load();
    } catch (removeError: unknown) {
      setError(customersErrorMessage(removeError));
    } finally {
      setPending(null);
    }
  };

  const add = async () => {
    if (!addUsername) return;
    setPending("add");
    setError(null);
    try {
      await addSalesRelation(code, addUsername);
      setAddUsername("");
      load();
    } catch (addError: unknown) {
      setError(customersErrorMessage(addError));
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Nhân viên Sales phụ trách</h2>
        {isAdmin ? (
          <div className="flex flex-wrap items-end gap-2">
            <Field
              label="Thêm Sales"
              as="select"
              options={salesOptions}
              value={addUsername}
              placeholder="Chọn nhân viên"
              onChange={setAddUsername}
            />
            <Button variant="secondary" loading={pending === "add"} onClick={add}>
              + Thêm Sales liên quan
            </Button>
          </div>
        ) : null}
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <DataTable
        loading={loading}
        skeletonCells={
          isAdmin
            ? ["barWide", "barWide", "barNarrow", "barNarrow", "icon", "icon"]
            : ["barWide", "barWide", "barNarrow", "barNarrow", "icon"]
        }
        columns={
          isAdmin
            ? ["Nhân viên Sales", "Email", "Số điện thoại", "Ngày gán", "Trạng thái tài khoản", "Hành động"]
            : ["Nhân viên Sales", "Email", "Số điện thoại", "Ngày gán", "Trạng thái tài khoản"]
        }
        rows={(relations ?? []).map((row) => {
          const account = accountByUsername.get(row.salesUsername.toLowerCase());
          const accountActive = account?.enabled !== false;
          const cells: ReactNode[] = [
            userDisplayName(account, row.salesUsername),
            account?.email ?? "—",
            account?.phoneNumber ?? "—",
            formatDate(row.createdAt),
            <EntityStatusIcon key={`${row.salesUsername}-status`} status={accountActive ? "active" : "inactive"} />,
          ];
          if (isAdmin) {
            cells.push(
              <IconAction
                key={`${row.salesUsername}-unlink`}
                label="Gỡ liên kết"
                variant="danger"
                disabled={pending === row.salesUsername}
                onClick={() => remove(row.salesUsername)}
                icon={<IconUnlink />}
              />,
            );
          }
          return cells;
        })}
      />
    </>
  );
}

export function CustomerQuotesPage() {
  const code = useCustomerCode();
  const [rows, setRows] = useState<Quotation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listCustomerQuotations(code, { pageSize: 50 })
      .then((result) => {
        if (!active) return;
        setRows(result.quotations);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(quotationsErrorMessage(loadError));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <>
      <h2 className="mb-4 text-base font-semibold">Danh sách báo giá của khách hàng</h2>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <DataTable
        loading={loading}
        skeletonCells={["link", "pill", "bar", "barNarrow", "barNarrow"]}
        columns={["Mã Báo giá", "Trạng thái quy trình", "Kết quả", "Sales phụ trách", "Ngày tạo"]}
        rows={(rows ?? []).map((row) => [
          <Link key={row.code} to={`/quotations/${encodeURIComponent(row.code)}`} className="font-semibold text-[var(--color-action-primary)]">
            {row.code}
          </Link>,
          <WorkflowStatusBadge key={`${row.code}-status`} status={row.workflowStatus} />,
          businessOutcomeLabel(row.businessOutcome),
          row.salesOwnerUsername,
          formatDate(row.createdAt),
        ])}
      />
    </>
  );
}

export function CustomerHistoryPage() {
  const code = useCustomerCode();
  const [events, setEvents] = useState<ApiAuditEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listCustomerHistory(code, { pageSize: 50 })
      .then((result) => {
        if (!active) return;
        setEvents(result.events);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(customersErrorMessage(loadError));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Nhật ký thay đổi thông tin khách hàng</h2>
        <Badge>Chỉ đọc</Badge>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <DataTable
        loading={loading}
        skeletonCells={["barNarrow", "bar", "barWide", "barWide", "barWide"]}
        columns={["Thời gian", "Người thực hiện", "Loại sự kiện / Trường thay đổi", "Giá trị cũ", "Giá trị mới"]}
        rows={(events ?? []).map((event) => [
          event.occurredAt ? formatDateTime(event.occurredAt) : "—",
          event.actorUsername || "—",
          auditSummary(event),
          auditValue(event.oldData, "phone") !== "—" ? auditValue(event.oldData, "phone") : JSON.stringify(event.oldData ?? "—"),
          auditValue(event.newData, "phone") !== "—" ? auditValue(event.newData, "phone") : JSON.stringify(event.newData ?? "—"),
        ])}
      />
    </>
  );
}

export function CustomerDeactivatePage() {
  const code = useCustomerCode();
  const navigate = useNavigate();
  const { isAdmin } = useCustomerContext();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!isAdmin) return;
    setPending(true);
    setError(null);
    try {
      await deactivateCustomer(code);
      navigate("/customers");
    } catch (deactivateError: unknown) {
      setError(customersErrorMessage(deactivateError));
      setPending(false);
    }
  };

  return (
    <>
      <CustomerDetailPage />
      <Modal title="Xác nhận ngừng hoạt động" closeTo={customerHref(code)}>
        <p className="text-sm">Khách hàng sẽ chuyển sang trạng thái Ngừng hoạt động và không được chọn khi tạo báo giá mới.</p>
        {!isAdmin ? <Notice tone="error">Chỉ ADMIN mới được ngừng hoạt động khách hàng.</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button to={customerHref(code)} variant="text">
            Hủy
          </Button>
          <Button variant="error" loading={pending} disabled={!isAdmin} onClick={confirm}>
            Ngừng hoạt động
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function ContactDeactivatePage() {
  const code = useCustomerCode();
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!contactId) return;
    setPending(true);
    setError(null);
    try {
      await deactivateContact(code, contactId);
      navigate(customerHref(code, "contacts"));
    } catch (deactivateError: unknown) {
      setError(customersErrorMessage(deactivateError));
      setPending(false);
    }
  };

  return (
    <>
      <CustomerContactsPage />
      <Modal title="Xác nhận ngừng hoạt động" closeTo={customerHref(code, "contacts")}>
        <p className="text-sm">Người liên hệ sẽ chuyển sang trạng thái Ngừng hoạt động.</p>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button to={customerHref(code, "contacts")} variant="text">
            Hủy
          </Button>
          <Button variant="error" loading={pending} onClick={confirm}>
            Ngừng hoạt động
          </Button>
        </div>
      </Modal>
    </>
  );
}

