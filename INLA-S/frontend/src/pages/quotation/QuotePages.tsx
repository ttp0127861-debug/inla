import { useEffect, useLayoutEffect, useRef, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listContacts, listCustomers, type ApiContact, type ApiCustomer } from "../../api/customers";
import {
  completeTask,
  createQuotation,
  directorDecision,
  getQuotation,
  getQuotationHistory,
  QuotationsApiError,
  listAttachments,
  listQuotations,
  listRevisions,
  quotationsErrorMessage,
  submitQuotation,
  updateAccountingData,
  updateExecutorConsolidation,
  getDevelopmentMinutes,
  updateDevelopmentMinutes,
  updateQaData,
  updateQuotationDraft,
  updateRndData,
  uploadAttachmentFile,
  deleteAttachment,
  type DevelopmentMinutes,
  type QaRunPaperStructure,
  type DevelopmentMinutesPrintPlate,
  type BusinessOutcome,
  type CycleType,
  type Quotation,
  type QuotationAttachment,
  type WorkflowStatus,
  type WorkflowEvent,
} from "../../api/quotations";
import { useAuth } from "../../auth/AuthContext";
import { canAccessPath } from "../../auth/cognito";
import { Badge } from "../../components/ui/Badge";
import { CycleTypeBadge } from "../../components/ui/CycleTypeBadge";
import { WorkflowStatusBadge } from "../../components/ui/WorkflowStatusBadge";
import { Button } from "../../components/ui/Button";
import { Card, DataTable, PageTitle } from "../../components/ui/DataTable";
import { ListEmptyState, ListSkeleton } from "../../components/ui/ListPanelState";
import { FILTER_EMPTY_HINT } from "../../components/ui/Skeleton";
import { Dropzone } from "../../components/ui/Dropzone";
import { Combobox } from "../../components/ui/Combobox";
import { Field } from "../../components/ui/Field";
import { HoverTooltip } from "../../components/ui/HoverTooltip";
import {
  businessOutcomeLabel,
  businessOutcomeTone,
  workflowStatusLabel,
} from "../../lib/quotationLabels";
import {
  emptyLineItemDraft,
  lineItemsFromDetail,
  lineItemsToInput,
  resolvedLineItems,
  totalLineItemQuantity,
  validateLineItemDrafts,
  type LineItemDraft,
  type LineItemValidation,
} from "../../lib/lineItems";
import {
  type QaLinePayload,
  type RndLinePayload,
  emptyRunPaperStructure,
  buildQaLineState,
  buildRndLineState,
  qaDataFromLinePayloads,
  rndDataFromLinePayloads,
  serverSupportsQaLinePersist,
  serverSupportsRndLinePersist,
  validateQaLines,
  validateRndLines,
} from "../../lib/qaRndLineData";
import { LineItemsEditor } from "./LineItemsEditor";
import { LineContextHeading } from "./quoteLineReviewUi";
import { consolidationLinePayload, PriceFormatGrid, pricesFromLineItems } from "./PriceFormatGrid";
import { QuotationLayout, quoteHref, useQuotationCode, useQuotationContext } from "./quotationContext";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("vi-VN");
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function lostReasonFromQuotation(q: Quotation): string | null {
  const raw = q.businessOutcomeReason ?? q.lostReason;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

function lostOutcomeCell(q: Quotation): ReactNode {
  const label = businessOutcomeLabel(q.businessOutcome);
  if (q.businessOutcome !== "lost") {
    return label;
  }
  const reason = lostReasonFromQuotation(q);
  const title = reason ?? "Chưa có lý do từ máy chủ (TODO: API businessOutcomeReason / lostReason)";
  return (
    <HoverTooltip title={title} lines={reason ? [title] : ["Chưa có lý do từ máy chủ", "TODO backend: businessOutcomeReason / lostReason trên list."]}>
      <span className="inline-flex cursor-help">
        <Badge tone={businessOutcomeTone(q.businessOutcome)}>{label}</Badge>
      </span>
    </HoverTooltip>
  );
}

function Notice({ tone, children }: { tone: "error" | "info" | "ok"; children: string }) {
  const toneClass =
    tone === "error" ? "bg-[#fef2f2] text-[#b91c1c]" : tone === "ok" ? "bg-[#f0fdf4] text-[#166534]" : "bg-[#eff6ff] text-[var(--color-text-body)]";
  return <p className={`mb-4 rounded-[var(--radius-sm)] p-3 text-sm ${toneClass}`}>{children}</p>;
}

export function isAdmin(groups: string[]): boolean {
  return groups.includes("ADMIN");
}

export function hasRole(groups: string[], role: string): boolean {
  return groups.includes(role);
}

type ListFilters = {
  q: string;
  workflowStatus: string;
  businessOutcome: string;
  cycleType: string;
};

const emptyFilters: ListFilters = { q: "", workflowStatus: "", businessOutcome: "", cycleType: "" };

export function QuoteListPage() {
  const [rows, setRows] = useState<Quotation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ListFilters>(emptyFilters);
  const [applied, setApplied] = useState<ListFilters>(emptyFilters);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listQuotations({
      q: applied.q || undefined,
      workflowStatus: (applied.workflowStatus || undefined) as WorkflowStatus | undefined,
      businessOutcome: (applied.businessOutcome || undefined) as BusinessOutcome | undefined,
      cycleType: (applied.cycleType || undefined) as CycleType | undefined,
      pageSize: 50,
    })
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
  }, [applied]);

  return (
    <>
      <PageTitle
        title="Danh sách báo giá"
        aside={
          <div className="flex gap-2">
            <Button to="/quotations/clone" variant="secondary">
              Sao chép (Clone)
            </Button>
            <Button to="/quotations/new">+ Tạo báo giá mới</Button>
          </div>
        }
      />
      <Card className="mb-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,160px)_auto_auto]">
          <input
            placeholder="Tìm theo Mã BG, Tên khách hàng..."
            className="h-10 rounded border border-[var(--color-input-border)] px-3 text-sm"
            value={draft.q}
            onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
          />
          <select
            className="h-10 rounded border px-2 text-sm"
            value={draft.workflowStatus}
            onChange={(e) => setDraft((d) => ({ ...d, workflowStatus: e.target.value }))}
          >
            <option value="">Trạng thái quy trình</option>
            {(
              [
                "draft",
                "executor_intake",
                "qa_rnd_review",
                "executor_consolidation",
                "accounting_review",
                "director_review",
                "approved",
                "rejected",
                "cancelled",
              ] as WorkflowStatus[]
            ).map((value) => (
              <option key={value} value={value}>
                {workflowStatusLabel(value)}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded border px-2 text-sm"
            value={draft.businessOutcome}
            onChange={(e) => setDraft((d) => ({ ...d, businessOutcome: e.target.value }))}
          >
            <option value="">Kết quả</option>
            {(["not_updated", "sent_to_customer", "won", "lost"] as BusinessOutcome[]).map((value) => (
              <option key={value} value={value}>
                {businessOutcomeLabel(value)}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded border px-2 text-sm"
            value={draft.cycleType}
            onChange={(e) => setDraft((d) => ({ ...d, cycleType: e.target.value }))}
          >
            <option value="">Loại vòng</option>
            <option value="new">NEW</option>
            <option value="re_submit">RE_SUBMIT</option>
          </select>
          <Button onClick={() => setApplied({ ...draft })}>Lọc</Button>
          <Button variant="text" onClick={() => { setDraft(emptyFilters); setApplied(emptyFilters); }}>
            Đặt lại
          </Button>
        </div>
      </Card>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <DataTable
        loading={loading}
        emptyHint={FILTER_EMPTY_HINT}
        skeletonCells={["link", "barWide", "pill", "bar", "barNarrow", "barNarrow", "barNarrow", "link"]}
        columns={["Mã Báo giá", "Khách hàng", "Trạng thái quy trình", "Kết quả", "Loại vòng", "Sales phụ trách", "Ngày tạo", "Hành động"]}
        rows={(rows ?? []).map((row) => [
            <Link to={quoteHref(row.code)} className="font-semibold text-[var(--color-action-primary)]">
              {row.code}
            </Link>,
            row.customerName ?? "—",
            <WorkflowStatusBadge status={row.workflowStatus} />,
            lostOutcomeCell(row),
            <CycleTypeBadge cycleType={row.currentCycleType} />,
            row.salesOwnerUsername,
            formatDate(row.createdAt),
            <Link to={quoteHref(row.code)} className="font-semibold text-[var(--color-action-primary)]">
              Xem
            </Link>,
          ])}
      />
    </>
  );
}

type SalesFormState = {
  customerId: string;
  contactId: string;
  lineItems: LineItemDraft[];
  printingDescription: string;
  deliveryLocation: string;
  desiredDeliveryTime: string;
  salesNote: string;
  additionalRequirements: string;
};

const emptySalesForm: SalesFormState = {
  customerId: "",
  contactId: "",
  lineItems: [emptyLineItemDraft(1)],
  printingDescription: "",
  deliveryLocation: "",
  desiredDeliveryTime: "",
  salesNote: "",
  additionalRequirements: "",
};

function customerComboboxLabel(customer: ApiCustomer): string {
  return `${customer.name} (${customer.code})`;
}

function salesBodyFromForm(form: SalesFormState) {
  return {
    customerId: form.customerId,
    contactId: form.contactId || undefined,
    lineItems: lineItemsToInput(form.lineItems),
    printingDescription: form.printingDescription || undefined,
    deliveryLocation: form.deliveryLocation || undefined,
    desiredDeliveryTime: form.desiredDeliveryTime || undefined,
    salesNote: form.salesNote || undefined,
    additionalRequirements: form.additionalRequirements || undefined,
  };
}

function QuoteForm({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const editCode = useQuotationCode();
  const { user } = useAuth();
  const [form, setForm] = useState<SalesFormState>(emptySalesForm);
  const [version, setVersion] = useState<number | undefined>();
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<ApiCustomer | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [lineValidation, setLineValidation] = useState<LineItemValidation[]>([]);

  const canMutate = user && !isAdmin(user.groups) && hasRole(user.groups, "SALES");

  useEffect(() => {
    if (mode !== "edit" || !editCode) return;
    let active = true;
    getQuotation(editCode)
      .then((detail) => {
        if (!active) return;
        if (detail.quotation.workflowStatus !== "draft") {
          navigate(quoteHref(editCode), { replace: true });
          return;
        }
        const snap = detail.customerSnapshot;
        setForm({
          ...emptySalesForm,
          customerId: detail.quotation.customerId,
          contactId: detail.quotation.contactId ?? "",
          lineItems: lineItemsFromDetail(detail),
          printingDescription: detail.salesData?.printingDescription ?? "",
          deliveryLocation: detail.salesData?.deliveryLocation ?? "",
          desiredDeliveryTime: detail.salesData?.desiredDeliveryTime ?? "",
          salesNote: detail.salesData?.salesNote ?? "",
          additionalRequirements: detail.salesData?.additionalRequirements ?? "",
        });
        setVersion(detail.quotation.version);
        const loadedCustomer = {
          id: detail.quotation.customerId,
          code: detail.quotation.customerCode ?? "",
          name: detail.quotation.customerName ?? snap?.customerName ?? "",
          customerType: "business",
          shortName: null,
          taxId: snap?.taxId ?? "",
          phone: snap?.phone ?? "",
          email: snap?.email ?? "",
          addressLine: snap?.addressLine ?? "",
          province: snap?.province ?? "",
          website: null,
          notes: null,
          status: "active",
          createdAt: "",
          updatedAt: "",
          createdBy: null,
          updatedBy: null,
        };
        setSelectedCustomer(loadedCustomer as ApiCustomer);
        if (loadedCustomer.code) {
          setCustomerQuery(customerComboboxLabel(loadedCustomer as ApiCustomer));
        }
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
  }, [mode, editCode, navigate]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      listCustomers({ q: customerQuery || undefined, status: "active", pageSize: 20 })
        .then((result) => {
          if (active) setCustomers(result.customers);
        })
        .catch(() => {
          if (active) setCustomers([]);
        });
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [customerQuery]);

  useEffect(() => {
    if (!form.customerId || !selectedCustomer?.code) {
      setContacts([]);
      return;
    }
    listContacts(selectedCustomer.code)
      .then((result) => setContacts(result.contacts.filter((c) => c.status === "active")))
      .catch(() => setContacts([]));
  }, [form.customerId, selectedCustomer?.code]);

  const pickCustomer = (customer: ApiCustomer) => {
    setSelectedCustomer(customer);
    setForm((f) => ({ ...f, customerId: customer.id, contactId: "" }));
    setCustomerQuery(customerComboboxLabel(customer));
  };

  const customerOptions = useMemo(() => customers.map(customerComboboxLabel), [customers]);
  const selectedCustomerLabel = selectedCustomer ? customerComboboxLabel(selectedCustomer) : "";

  const saveDraft = async () => {
    if (!canMutate || !form.customerId) {
      setError("Chọn khách hàng và đảm bảo bạn có quyền Sales.");
      return;
    }
    const validation = validateLineItemDrafts(form.lineItems);
    setLineValidation(validation);
    if (validation.length) {
      setError("Kiểm tra các dòng sản phẩm (tên, sóng, kích thước, số lượng).");
      return;
    }
    setPending(true);
    setError(null);
    setConflict(false);
    try {
      if (mode === "create") {
        const created = await createQuotation(salesBodyFromForm(form));
        navigate(quoteHref(created.quotation.code, "edit"));
      } else if (editCode) {
        const updated = await updateQuotationDraft(editCode, { ...salesBodyFromForm(form), version });
        setVersion(updated.quotation.version);
        setError(null);
      }
    } catch (saveError: unknown) {
      const message = quotationsErrorMessage(saveError);
      setError(message);
      if (saveError instanceof QuotationsApiError && saveError.code === "CONFLICT") {
        setConflict(true);
      }
    } finally {
      setPending(false);
    }
  };

  const sendSubmit = async () => {
    if (!canMutate) return;
    const validation = validateLineItemDrafts(form.lineItems);
    setLineValidation(validation);
    if (validation.length) {
      setError("Kiểm tra các dòng sản phẩm trước khi gửi xử lý.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      let code = editCode;
      if (mode === "create") {
        const created = await createQuotation(salesBodyFromForm(form));
        code = created.quotation.code;
      } else if (editCode) {
        await updateQuotationDraft(editCode, { ...salesBodyFromForm(form), version });
      }
      if (!code) return;
      const submitted = await submitQuotation(code, { version: mode === "edit" ? version : undefined });
      navigate(quoteHref(submitted.quotation.code));
    } catch (submitError: unknown) {
      setError(quotationsErrorMessage(submitError));
    } finally {
      setPending(false);
    }
  };

  if (mode === "edit" && !editCode) {
    return null;
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Đang tải báo giá…</p>;
  }

  return (
    <>
      <PageTitle
        title={mode === "edit" ? "Chỉnh sửa báo giá nháp" : "Tạo báo giá mới"}
        kicker={mode === "edit" && editCode ? `${editCode} · Bản nháp` : undefined}
      />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {conflict ? (
        <Notice tone="info">Phiên bản đã thay đổi. Nhấn tải lại hoặc lưu lại sau khi làm mới trang.</Notice>
      ) : null}
      <div className="flex flex-col gap-4">
        <Card>
          <h2 className="mb-4 font-semibold">Thông tin Khách hàng</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Combobox
              label="Tìm khách hàng"
              required
              allowCustom={false}
              placeholder="Nhập tên hoặc mã KH"
              value={selectedCustomerLabel}
              onChange={(label) => {
                const match = customers.find((customer) => customerComboboxLabel(customer) === label);
                if (match) pickCustomer(match);
              }}
              onDraftChange={(draft) => {
                setCustomerQuery(draft);
                if (selectedCustomer && draft !== customerComboboxLabel(selectedCustomer)) {
                  setSelectedCustomer(null);
                  setForm((f) => ({ ...f, customerId: "", contactId: "" }));
                }
              }}
              options={customerOptions}
              disabled={!canMutate}
            />
            <Field
              label="Người liên hệ"
              as="select"
              options={contacts.map((c) => ({ value: c.id, label: c.fullName }))}
              value={form.contactId}
              onChange={(value) => setForm((f) => ({ ...f, contactId: value }))}
              disabled={!canMutate || !form.customerId}
            />
            <Field label="Mã số thuế" value={selectedCustomer?.taxId ?? ""} readOnly />
            <Field label="Số điện thoại" value={selectedCustomer?.phone ?? ""} readOnly />
            <Field label="Địa chỉ" value={selectedCustomer?.addressLine ?? ""} readOnly />
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">SKU</h2>
          <LineItemsEditor
            rows={form.lineItems}
            validation={lineValidation}
            disabled={!canMutate}
            onChange={(lineItems) => setForm((f) => ({ ...f, lineItems }))}
          />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Thông tin chung</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Mô tả in ấn"
              as="textarea"
              value={form.printingDescription}
              onChange={(v) => setForm((f) => ({ ...f, printingDescription: v }))}
              disabled={!canMutate}
            />
            <Field
              label="Địa điểm giao hàng"
              value={form.deliveryLocation}
              onChange={(v) => setForm((f) => ({ ...f, deliveryLocation: v }))}
              disabled={!canMutate}
            />
            <Field
              label="Thời gian giao mong muốn"
              value={form.desiredDeliveryTime}
              onChange={(v) => setForm((f) => ({ ...f, desiredDeliveryTime: v }))}
              disabled={!canMutate}
            />
            <Field label="Ghi chú Sales" as="textarea" value={form.salesNote} onChange={(v) => setForm((f) => ({ ...f, salesNote: v }))} disabled={!canMutate} />
            <Field
              label="Yêu cầu bổ sung"
              as="textarea"
              value={form.additionalRequirements}
              onChange={(v) => setForm((f) => ({ ...f, additionalRequirements: v }))}
              disabled={!canMutate}
            />
          </div>
        </Card>
        <div className="flex justify-end gap-3">
          <Button to={user?.role === "SALES" ? "/dashboard" : "/quotations"} variant="text">
            Hủy
          </Button>
          {canMutate ? (
            <>
              <Button variant="secondary" disabled={pending} onClick={() => void saveDraft()}>
                Lưu nháp
              </Button>
              <Button disabled={pending} onClick={() => void sendSubmit()}>
                Lưu & xử lý
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function QuoteCreatePage() {
  return <QuoteForm mode="create" />;
}

export function QuoteEditPage() {
  return <QuoteForm mode="edit" />;
}

export function QuoteChrome({ children }: { children: ReactNode }) {
  return <QuotationLayout>{children}</QuotationLayout>;
}

export function QuoteRequestPage() {
  const { code, detail } = useQuotationContext();
  const { user } = useAuth();
  const snap = detail.customerSnapshot;
  const sales = detail.salesData;
  const items = resolvedLineItems(detail);
  const totalQty = totalLineItemQuantity(items);
  const canOpenSimilar = Boolean(user && canAccessPath(user.groups, "/quotations/similar-product"));
  const [infoOpen, setInfoOpen] = useState(true);

  const customerName = detail.quotation.customerName ?? snap?.customerName ?? "—";
  const rows: [string, string][] = [
    ["Người liên hệ", detail.quotation.contactFullName ?? snap?.contactFullName ?? "—"],
    ["Tổng số lượng", totalQty > 0 ? `${totalQty.toLocaleString("vi-VN")} thùng` : "—"],
    ["Ngày giao mong muốn", sales?.desiredDeliveryTime ?? "—"],
    ["Địa điểm giao hàng", sales?.deliveryLocation ?? "—"],
    ["Mô tả in ấn", sales?.printingDescription ?? "—"],
  ];

  return (
    <section className="rounded-[var(--radius-md)] border-2 border-[#6b7280] bg-white p-6 shadow-[var(--shadow-card)]">
      <fieldset className={`mb-6 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 ${infoOpen ? "pb-3" : ""}`}>
        <SubFormLegend title={customerName} open={infoOpen} onToggle={() => setInfoOpen((value) => !value)} />
        {infoOpen ? (
          <dl className="grid gap-4 md:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
                <dd className="text-sm font-medium whitespace-pre-wrap">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </fieldset>
      <h3 className="mb-3 text-sm font-semibold">Dòng sản phẩm</h3>
      <LineItemsEditor rows={lineItemsFromDetail(detail)} onChange={() => {}} disabled />
      {canOpenSimilar ? (
        <div className="mt-6 flex gap-2">
          <Button to={`/quotations/similar-product?source=${encodeURIComponent(code)}`} variant="secondary">
            Báo giá tương tự theo sản phẩm
          </Button>
          <Button to={`/quotations/similar-customer?source=${encodeURIComponent(code)}`} variant="ghost">
            Báo giá tương tự theo khách hàng
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function RoleActionBar({
  onSave,
  onComplete,
  canSave,
  canComplete,
  pending,
}: {
  onSave: () => void;
  onComplete: () => void;
  canSave: boolean;
  canComplete: boolean;
  pending: boolean;
}) {
  return (
    <div className="print-hide mt-6 flex justify-end gap-3">
      {canComplete ? (
        <Button variant="secondary" disabled={pending} onClick={onComplete}>
          Hoàn thành
        </Button>
      ) : null}
      {canSave ? (
        <Button disabled={pending} onClick={onSave}>
          Lưu
        </Button>
      ) : null}
    </div>
  );
}

function LineCollapseToggle({ open }: { open: boolean }) {
  const label = open ? "Thu gọn" : "Mở rộng";
  return (
    <HoverTooltip title={label}>
      <span className="grid h-8 w-8 shrink-0 place-items-center text-[var(--color-text-muted)]" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 ${open ? "" : "rotate-180"}`} aria-hidden>
          <path d="M6 14l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </HoverTooltip>
  );
}

function patchQaLine(rows: QaLinePayload[], lineNumber: number, patch: Partial<QaLinePayload>): QaLinePayload[] {
  return rows.map((row) => (row.lineNumber === lineNumber ? { ...row, ...patch, lineNumber } : row));
}

function patchRndLine(rows: RndLinePayload[], lineNumber: number, patch: Partial<RndLinePayload>): RndLinePayload[] {
  return rows.map((row) => (row.lineNumber === lineNumber ? { ...row, ...patch, lineNumber } : row));
}

function QaIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden>
      {children}
    </svg>
  );
}

const qaIcons = {
  result: (
    <QaIcon>
      <path d="M8 4h8v2H8z" />
      <path d="M8 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1" />
      <path d="m9 13 2 2 4-4" />
    </QaIcon>
  ),
  note: (
    <QaIcon>
      <path d="M7 3h8l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M15 3v5h5M8 13h8M8 17h5" />
    </QaIcon>
  ),
  burst: (
    <QaIcon>
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3z" />
      <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
    </QaIcon>
  ),
  compression: (
    <QaIcon>
      <path d="M12 3v6M9 6l3 3 3-3" />
      <path d="M12 21v-6M9 18l3-3 3 3" />
    </QaIcon>
  ),
  weight: (
    <QaIcon>
      <path d="M12 3v3" />
      <path d="M5 8h14" />
      <path d="M7 8 4 15h6L7 8zM17 8l-3 7h6l-3-7z" />
      <path d="M12 6v15" />
    </QaIcon>
  ),
  kcg: (
    <QaIcon>
      <path d="M12 3.5 14.8 9l6 .9-4.4 4.2 1 5.9L12 17.2 6.6 20l1-5.9L3.2 9.9 9.2 9z" />
    </QaIcon>
  ),
  proposal: (
    <QaIcon>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
      <path d="m13.5 6.5 3 3" />
    </QaIcon>
  ),
  plate: (
    <QaIcon>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M8 10h8M8 14h5" />
    </QaIcon>
  ),
  die: (
    <QaIcon>
      <path d="M5 4h14v6H5z" />
      <path d="M8 10v10M16 10v10M8 15h8" />
    </QaIcon>
  ),
  plan: (
    <QaIcon>
      <path d="M5 7h6M5 12h14M5 17h10" />
      <path d="m14 5 3 2-3 2M19 15l-3 2 3 2" />
    </QaIcon>
  ),
  glue: <img src="/icons/dan.png" alt="" className="h-8 w-8 object-contain" />,
  staple: <img src="/icons/ghim.png" alt="" className="h-8 w-8 object-contain" />,
  box: <img src="/icons/be.png" alt="" className="h-8 w-8 object-contain" />,
  film: <img src="/icons/can-mang.png" alt="" className="h-8 w-8 object-contain" />,
  flute: (
    <QaIcon>
      <path d="M3 15c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
      <path d="M3 19h18" />
    </QaIcon>
  ),
  crease: (
    <QaIcon>
      <path d="M5 6h14M5 12h14M5 18h14" />
    </QaIcon>
  ),
  sheet: (
    <QaIcon>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M8 9h8M8 13h5" />
    </QaIcon>
  ),
  bundle: (
    <QaIcon>
      <path d="M4 8h16v10H4z" />
      <path d="M8 8V6h8v2M12 8v10" />
    </QaIcon>
  ),
  pallet: (
    <QaIcon>
      <path d="M4 8h16v6H4z" />
      <path d="M6 14v3M12 14v3M18 14v3M4 17h16" />
    </QaIcon>
  ),
  edge: (
    <QaIcon>
      <path d="M8 5v14M16 5v14" />
      <path d="M4 8h4M16 8h4M4 16h4M16 16h4" />
    </QaIcon>
  ),
  angle: (
    <QaIcon>
      <path d="M5 19h14" />
      <path d="M5 19 16 7" />
      <path d="M8 19a5 5 0 0 1 4-4" />
    </QaIcon>
  ),
  water: (
    <QaIcon>
      <path d="M12 3s5 5.2 5 9a5 5 0 0 1-10 0c0-3.8 5-9 5-9z" />
      <path d="M9 14h6" />
    </QaIcon>
  ),
  paper: (
    <QaIcon>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </QaIcon>
  ),
};

const PRINT_TITLES = {
  qa: "Tiêu chuẩn kiểm soát chất lượng",
  rnd: "Phương án sản xuất tiêu chuẩn",
} as const;

function PrintFormButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="print-hide inline-flex cursor-pointer items-center gap-1 rounded border border-[var(--color-border)] bg-white px-2 py-1 text-xs font-semibold text-[var(--color-text-strong)]"
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
        <path d="M6 9V4h12v5" strokeLinejoin="round" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v6H6z" />
      </svg>
      {label}
    </button>
  );
}

function SubFormLegend({
  title,
  open,
  onToggle,
  trailing,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  trailing?: ReactNode;
}) {
  return (
    <legend className="mb-1 flex w-full items-center gap-2 px-1 text-sm font-semibold text-[var(--color-text-strong)]">
      <span className="min-w-0 flex-1" aria-hidden />
      <button type="button" className="inline-flex shrink-0 cursor-pointer items-center gap-1" onClick={onToggle} aria-expanded={open}>
        {title}
        <LineCollapseToggle open={open} />
      </button>
      <span className="flex min-w-0 flex-1 justify-end">{trailing}</span>
    </legend>
  );
}

type QaTextKey = {
  [K in keyof QaLinePayload]: QaLinePayload[K] extends string ? K : never;
}[keyof QaLinePayload];

function qaText(row: QaLinePayload, key: QaTextKey): string {
  return row[key];
}

function QaTopicFields({
  row,
  disabled,
  onPatch,
  layerName,
  required,
  paperOnly = false,
  keys,
}: {
  row: QaLinePayload;
  disabled: boolean;
  onPatch: (patch: Partial<QaLinePayload>) => void;
  layerName: (index: number) => string;
  required: boolean;
  paperOnly?: boolean;
  keys: {
    result: QaTextKey;
    note: QaTextKey;
    burst: QaTextKey;
    compression: QaTextKey;
    weight: QaTextKey;
    kcg: QaTextKey;
    edge: QaTextKey;
    slip: QaTextKey;
  water: QaTextKey;
  proposal?: QaTextKey;
    paperTypes: readonly QaTextKey[];
    paperWeights: readonly QaTextKey[];
  };
}) {
  const bind = (key: QaTextKey) => ({
    value: qaText(row, key),
    onChange: (value: string) => onPatch({ [key]: value }),
    disabled,
  });
  return (
    <div className="grid gap-3">
      {paperOnly ? null : (
        <>
          <div className="grid items-center gap-3 md:grid-cols-2">
            <Field label="Kết quả đánh giá chất lượng" labelOnHover required={required} requiredInside={required} icon={qaIcons.result} as="textarea" rows={2} {...bind(keys.result)} />
            <Field label="Ghi chú QA" labelOnHover icon={qaIcons.note} as="textarea" rows={2} {...bind(keys.note)} />
          </div>
          <div className="grid items-center gap-3 md:grid-cols-4">
            <Field label="Tiêu chuẩn — Bục" labelOnHover required={required} requiredInside={required} icon={qaIcons.burst} {...bind(keys.burst)} />
            <Field label="Tiêu chuẩn — Nén" labelOnHover required={required} requiredInside={required} icon={qaIcons.compression} {...bind(keys.compression)} />
            <Field label="Tiêu chuẩn — TL" labelOnHover required={required} requiredInside={required} icon={qaIcons.weight} {...bind(keys.weight)} />
            <Field label="Tiêu chuẩn — KCG" labelOnHover icon={qaIcons.kcg} {...bind(keys.kcg)} />
          </div>
          <div className="grid items-center gap-3 md:grid-cols-3">
            <Field label="Nén cạnh (kgf/10cm)" labelOnHover icon={qaIcons.edge} {...bind(keys.edge)} />
            <Field label="Góc trượt (độ)" labelOnHover icon={qaIcons.angle} {...bind(keys.slip)} />
            <Field label="Chống thấm (s)" labelOnHover icon={qaIcons.water} {...bind(keys.water)} />
          </div>
        </>
      )}
      <div>
        <p className="mb-2 text-left text-sm font-semibold text-[var(--color-text-strong)]">Kết cấu giấy</p>
        <div className="grid gap-3">
          <div className="grid grid-cols-7 items-center gap-3">
            {keys.paperTypes.map((key, index) => (
              <Field key={key} label={`${layerName(index)} — loại giấy`} labelOnHover icon={qaIcons.paper} {...bind(key)} />
            ))}
          </div>
          <div className="grid grid-cols-7 items-center gap-3">
            {keys.paperWeights.map((key, index) => (
              <Field key={key} label={`${layerName(index)} — định lượng`} labelOnHover icon={qaIcons.flute} {...bind(key)} />
            ))}
          </div>
        </div>
      </div>
      {!paperOnly && keys.proposal ? (
        <Field label="KCG QA+SX đề xuất" labelOnHover required={required} requiredInside={required} icon={qaIcons.proposal} as="textarea" rows={2} {...bind(keys.proposal)} />
      ) : null}
    </div>
  );
}

const sampleQaKeys = {
  result: "qualityAssessmentResult",
  note: "qaNote",
  burst: "burstStandard",
  compression: "compressionStandard",
  weight: "weightLimitStandard",
  kcg: "kcgStandard",
  edge: "edgeCrushStandard",
  slip: "slipAngleStandard",
  water: "waterproofStandard",
  paperTypes: ["facePaperType", "flutePaperType", "middlePaperType", "flute2PaperType", "middle2PaperType", "flute3PaperType", "bottomPaperType"],
  paperWeights: ["faceBasisWeight", "fluteBasisWeight", "middleBasisWeight", "flute2BasisWeight", "middle2BasisWeight", "flute3BasisWeight", "bottomBasisWeight"],
} as const;

function QaRunPaperStructures({
  sets,
  disabled,
  onChange,
}: {
  sets: QaRunPaperStructure[];
  disabled: boolean;
  onChange: (next: QaRunPaperStructure[]) => void;
}) {
  const { user } = useAuth();
  const canAdd = Boolean(user && !isAdmin(user.groups) && hasRole(user.groups, "QA"));
  const updateSet = (setIndex: number, patch: Partial<QaRunPaperStructure>) => {
    onChange(sets.map((item, index) => (index === setIndex ? { ...item, ...patch } : item)));
  };
  return (
    <div className="grid gap-4">
      {sets.map((set, setIndex) => (
        <div key={setIndex} className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-left text-sm font-semibold text-[var(--color-text-strong)]">Kết cấu giấy {setIndex + 1}</p>
            {sets.length > 1 ? (
              <button
                type="button"
                className="print-hide cursor-pointer text-sm font-semibold text-[var(--color-action-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled}
                onClick={() => onChange(sets.filter((_, index) => index !== setIndex))}
              >
                Xóa
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-7 items-center gap-3">
            {set.paperTypes.map((value, index) => (
              <Field
                key={`type-${index}`}
                label={`Lớp sóng ${index + 1} — loại giấy`}
                labelOnHover
                icon={qaIcons.paper}
                value={value}
                disabled={disabled}
                onChange={(next) => updateSet(setIndex, { paperTypes: set.paperTypes.map((item, layer) => (layer === index ? next : item)) })}
              />
            ))}
          </div>
          <div className="grid grid-cols-7 items-center gap-3">
            {set.basisWeights.map((value, index) => (
              <Field
                key={`weight-${index}`}
                label={`Lớp sóng ${index + 1} — định lượng`}
                labelOnHover
                icon={qaIcons.flute}
                value={value}
                disabled={disabled}
                onChange={(next) => updateSet(setIndex, { basisWeights: set.basisWeights.map((item, layer) => (layer === index ? next : item)) })}
              />
            ))}
          </div>
        </div>
      ))}
      {canAdd ? (
        <HoverTooltip title="Thêm kết cấu giấy">
          <button
            type="button"
            className="print-hide inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[var(--color-action-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Thêm kết cấu giấy"
            disabled={disabled}
            onClick={() => onChange([...sets, emptyRunPaperStructure()])}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </HoverTooltip>
      ) : null}
    </div>
  );
}

function QaLineFields({
  row,
  disabled,
  onPatch,
  onPrint,
  showPrintTitle,
  forceOpen,
}: {
  row: QaLinePayload;
  disabled: boolean;
  onPatch: (patch: Partial<QaLinePayload>) => void;
  onPrint: () => void;
  showPrintTitle: boolean;
  forceOpen: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [sampleOpen, setSampleOpen] = useState(true);
  const [runOpen, setRunOpen] = useState(true);
  const shown = forceOpen || open;
  const sampleShown = forceOpen || sampleOpen;
  const runShown = forceOpen || runOpen;
  return (
    <fieldset className={`rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 ${shown ? "pb-3" : ""}`}>
      {showPrintTitle ? <h1 className="print-only mb-4 text-xl font-semibold">{PRINT_TITLES.qa}</h1> : null}
      <SubFormLegend
        title="Phân tích QA"
        open={shown}
        onToggle={() => setOpen((value) => !value)}
        trailing={<PrintFormButton label="In" onClick={onPrint} />}
      />
      {shown ? (
        <div className="grid gap-4">
          <div>
            <button
              type="button"
              className="mb-2 inline-flex cursor-pointer items-center gap-1 text-left text-sm font-semibold text-[var(--color-text-strong)]"
              onClick={() => setSampleOpen((value) => !value)}
              aria-expanded={sampleShown}
            >
              Phân tích mẫu | yêu cầu khách hàng
              <LineCollapseToggle open={sampleShown} />
            </button>
            {sampleShown ? (
              <QaTopicFields row={row} disabled={disabled} onPatch={onPatch} required={false} layerName={(index) => `Lớp ${index + 1}`} keys={sampleQaKeys} />
            ) : null}
          </div>
          <div>
            <button
              type="button"
              className="mb-2 inline-flex cursor-pointer items-center gap-1 text-left text-sm font-semibold text-[var(--color-text-strong)]"
              onClick={() => setRunOpen((value) => !value)}
              aria-expanded={runShown}
            >
              Đề xuất kỹ thuật | chạy thực tế
              <LineCollapseToggle open={runShown} />
            </button>
            {runShown ? (
              <div className="grid gap-3">
                <div className="grid items-center gap-3 md:grid-cols-2">
                  <Field label="Bục" labelOnHover required requiredInside icon={qaIcons.burst} value={row.runBurstStandard} onChange={(v) => onPatch({ runBurstStandard: v })} disabled={disabled} />
                  <Field label="Nén" labelOnHover required requiredInside icon={qaIcons.compression} value={row.runCompressionStandard} onChange={(v) => onPatch({ runCompressionStandard: v })} disabled={disabled} />
                </div>
                <QaRunPaperStructures
                  sets={row.runPaperStructures}
                  disabled={disabled}
                  onChange={(next) => onPatch({ runPaperStructures: next })}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}

function FormulaTextarea({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;
    let lastWidth = -1;
    const fit = () => {
      const width = element.clientWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      disabled={disabled}
      className="box-border block min-h-9 w-full resize-none overflow-hidden rounded border border-[#d1d5db] px-2 py-1.5 text-sm leading-5 break-words whitespace-pre-wrap disabled:bg-[#f9fafb]"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function emptyPrintPlates(): DevelopmentMinutesPrintPlate[] {
  return Array.from({ length: 7 }, (_, index) => ({
    plateNo: index + 1,
    colorSystem: "",
    formulaComposition: "",
    quota: "",
    trame: "",
    anilox: "",
  }));
}

function platesOf(minutes: DevelopmentMinutes | null): DevelopmentMinutesPrintPlate[] {
  const byNo = new Map((minutes?.printPlates ?? []).map((plate) => [plate.plateNo, plate]));
  return emptyPrintPlates().map((plate) => ({ ...plate, ...byNo.get(plate.plateNo) }));
}

function flattenMinutes(raw: DevelopmentMinutes | null | undefined): DevelopmentMinutes {
  if (!raw) return {};
  const nested = raw.payload && typeof raw.payload === "object" ? raw.payload : {};
  const { payload: _payload, updatedAt: _updatedAt, ...top } = raw;
  const merged: DevelopmentMinutes = { ...nested };
  for (const [key, value] of Object.entries(top)) {
    if (value !== undefined && value !== null) (merged as Record<string, unknown>)[key] = value;
  }
  delete merged.payload;
  delete merged.updatedAt;
  return merged;
}

function minutesToApi(minutes: DevelopmentMinutes): DevelopmentMinutes {
  return {
    meetingPlace: minutes.meetingPlace ?? null,
    meetingDate: minutes.meetingDate ?? null,
    payload: {
      participants: minutes.participants,
      printPlates: platesOf(minutes),
      designNotes: minutes.designNotes ?? null,
      sampleBoxNotes: minutes.sampleBoxNotes ?? null,
      finishDieCut: minutes.finishDieCut ?? null,
      finishGlue: minutes.finishGlue ?? null,
      finishStaple: minutes.finishStaple ?? null,
      uvCoating: minutes.uvCoating ?? null,
      bundlingMethod: minutes.bundlingMethod ?? null,
      palletNotes: minutes.palletNotes ?? null,
      shippingNotes: minutes.shippingNotes ?? null,
      otherNotes: minutes.otherNotes ?? null,
      meetingConclusion: minutes.meetingConclusion ?? null,
      fluteKind: minutes.fluteKind ?? null,
      creasing: minutes.creasing ?? null,
      sheetSize: minutes.sheetSize ?? null,
      fluteOther: minutes.fluteOther ?? null,
      filmLamination: minutes.filmLamination ?? null,
    },
  };
}

function RndMinutesFields({
  minutes,
  disabled,
  onPatch,
  onPlate,
  forceOpen = false,
}: {
  minutes: DevelopmentMinutes | null;
  disabled: boolean;
  onPatch: (patch: Partial<DevelopmentMinutes>) => void;
  onPlate: (plateNo: number, field: keyof DevelopmentMinutesPrintPlate, value: string) => void;
  forceOpen?: boolean;
}) {
  const [fluteOpen, setFluteOpen] = useState(true);
  const [finishedOpen, setFinishedOpen] = useState(true);
  const [platesOpen, setPlatesOpen] = useState(true);
  const fluteShown = forceOpen || fluteOpen;
  const platesShown = forceOpen || platesOpen;
  const finishedShown = forceOpen || finishedOpen;
  const trameOptions = Array.from({ length: 11 }, (_, index) => String(50 + index * 5));
  return (
    <div className="grid gap-3">
      <div>
        <button
          type="button"
          className="mb-2 inline-flex cursor-pointer items-center gap-1 text-left text-sm font-semibold text-[var(--color-text-strong)]"
          onClick={() => setFluteOpen((value) => !value)}
          aria-expanded={fluteShown}
        >
          Sóng
          <LineCollapseToggle open={fluteShown} />
        </button>
        {fluteShown ? (
          <div className="grid gap-3">
            <div className="grid items-center gap-3 md:grid-cols-3">
              <Field label="Loại sóng" labelOnHover icon={qaIcons.flute} value={minutes?.fluteKind ?? ""} onChange={(v) => onPatch({ fluteKind: v })} disabled={disabled} />
              <Field label="Cán lằn" labelOnHover icon={qaIcons.crease} value={minutes?.creasing ?? ""} onChange={(v) => onPatch({ creasing: v })} disabled={disabled} />
              <Field label="Kích thước tấm" labelOnHover icon={qaIcons.sheet} value={minutes?.sheetSize ?? ""} onChange={(v) => onPatch({ sheetSize: v })} disabled={disabled} />
            </div>
            <Field label="Khác" labelOnHover icon={qaIcons.note} as="textarea" rows={2} value={minutes?.fluteOther ?? ""} onChange={(v) => onPatch({ fluteOther: v })} disabled={disabled} />
          </div>
        ) : null}
      </div>
      <div>
        <button
          type="button"
          className="mb-2 inline-flex cursor-pointer items-center gap-1 text-left text-sm font-semibold text-[var(--color-text-strong)]"
          onClick={() => setPlatesOpen((value) => !value)}
          aria-expanded={platesShown}
        >
          In ấn P1–P7
          <LineCollapseToggle open={platesShown} />
        </button>
        {platesShown ? (
          <div className="grid gap-3">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-14" />
                  <col className="w-[calc(15ch+1.5rem)]" />
                  <col />
                  <col className="w-[calc(18ch+1.5rem)]" />
                  <col className="w-28" />
                  <col className="w-24" />
                </colgroup>
                <thead>
                  <tr className="bg-[#faf7f4] text-left text-xs text-[var(--color-text-muted)]">
                    <th className="border border-[var(--color-border)] px-2 py-2">TT</th>
                    <th className="border border-[var(--color-border)] px-2 py-2">Mã mực</th>
                    <th className="border border-[var(--color-border)] px-2 py-2">Thành phần công thức</th>
                    <th className="border border-[var(--color-border)] px-2 py-2">Định mức</th>
                    <th className="border border-[var(--color-border)] px-2 py-2">Trame</th>
                    <th className="border border-[var(--color-border)] px-2 py-2">Anilox</th>
                  </tr>
                </thead>
                <tbody>
                  {platesOf(minutes).map((plate) => {
                    const trameValue = plate.trame ?? "";
                    const trameChoices = trameOptions.includes(trameValue) || trameValue === "" ? trameOptions : [trameValue, ...trameOptions];
                    return (
                      <tr key={plate.plateNo}>
                        <td className="border border-[var(--color-border)] px-2 py-2 font-medium">P{plate.plateNo}</td>
                        <td className="border border-[var(--color-border)] p-1">
                          <input
                            className="h-9 w-full rounded border border-[#d1d5db] px-2 text-sm disabled:bg-[#f9fafb]"
                            value={plate.colorSystem ?? ""}
                            disabled={disabled}
                            onChange={(e) => onPlate(plate.plateNo, "colorSystem", e.target.value)}
                          />
                        </td>
                        <td className="border border-[var(--color-border)] p-1 align-top">
                          <FormulaTextarea
                            value={plate.formulaComposition ?? ""}
                            disabled={disabled}
                            onChange={(value) => onPlate(plate.plateNo, "formulaComposition", value)}
                          />
                        </td>
                        <td className="border border-[var(--color-border)] p-1">
                          <input
                            className="h-9 w-full rounded border border-[#d1d5db] px-2 text-sm disabled:bg-[#f9fafb]"
                            value={plate.quota ?? ""}
                            disabled={disabled}
                            onChange={(e) => onPlate(plate.plateNo, "quota", e.target.value)}
                          />
                        </td>
                        <td className="border border-[var(--color-border)] p-1">
                          <select
                            className="h-9 w-full rounded border border-[#d1d5db] px-1 text-sm disabled:bg-[#f9fafb]"
                            value={trameValue}
                            disabled={disabled}
                            onChange={(e) => onPlate(plate.plateNo, "trame", e.target.value)}
                          >
                            <option value="">—</option>
                            {trameChoices.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-[var(--color-border)] p-1">
                          <input
                            className="h-9 w-full rounded border border-[#d1d5db] px-2 text-sm disabled:bg-[#f9fafb]"
                            inputMode="numeric"
                            maxLength={4}
                            value={plate.anilox ?? ""}
                            disabled={disabled}
                            onChange={(e) => onPlate(plate.plateNo, "anilox", e.target.value.replace(/\D/g, "").slice(0, 4))}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Field label="Khác" labelOnHover icon={qaIcons.note} as="textarea" rows={2} value={minutes?.otherNotes ?? ""} onChange={(v) => onPatch({ otherNotes: v })} disabled={disabled} />
          </div>
        ) : null}
      </div>
      <div>
        <button
          type="button"
          className="mb-2 inline-flex cursor-pointer items-center gap-1 text-left text-sm font-semibold text-[var(--color-text-strong)]"
          onClick={() => setFinishedOpen((value) => !value)}
          aria-expanded={finishedShown}
        >
          Thành phẩm
          <LineCollapseToggle open={finishedShown} />
        </button>
        {finishedShown ? (
          <div className="grid gap-3">
            <div className="grid items-center gap-3 md:grid-cols-2">
              <Field label="Dán" labelOnHover icon={qaIcons.glue} value={minutes?.finishGlue ?? ""} onChange={(v) => onPatch({ finishGlue: v })} disabled={disabled} />
              <Field label="Ghim" labelOnHover icon={qaIcons.staple} value={minutes?.finishStaple ?? ""} onChange={(v) => onPatch({ finishStaple: v })} disabled={disabled} />
            </div>
            <div className="grid items-center gap-3 md:grid-cols-2">
              <Field label="Bế" labelOnHover icon={qaIcons.box} value={minutes?.finishDieCut ?? ""} onChange={(v) => onPatch({ finishDieCut: v })} disabled={disabled} />
              <Field label="Cán màng" labelOnHover icon={qaIcons.film} value={minutes?.filmLamination ?? ""} onChange={(v) => onPatch({ filmLamination: v })} disabled={disabled} />
            </div>
            <div className="grid items-center gap-3 md:grid-cols-2">
              <Field label="Cách bó cột" labelOnHover icon={qaIcons.bundle} as="textarea" rows={2} value={minutes?.bundlingMethod ?? ""} onChange={(v) => onPatch({ bundlingMethod: v })} disabled={disabled} />
              <Field label="Đóng pallet" labelOnHover icon={qaIcons.pallet} as="textarea" rows={2} value={minutes?.palletNotes ?? ""} onChange={(v) => onPatch({ palletNotes: v })} disabled={disabled} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const RND_ATTACHMENT_LIMIT = 10;

function RndAttachmentBlock() {
  const { code, detail } = useQuotationContext();
  const { user } = useAuth();
  const [files, setFiles] = useState<QuotationAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUpload = Boolean(user && !isAdmin(user.groups) && hasRole(user.groups, "R&D"));

  const reload = () => {
    listAttachments(code, { cycleId: detail.quotation.currentCycleId, section: "rnd" })
      .then((result) => setFiles(result.attachments.filter((file) => !file.deletedAt && file.section === "rnd")))
      .catch((loadError: unknown) => setError(quotationsErrorMessage(loadError)));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, detail.quotation.currentCycleId]);

  const onUpload = async (file: File) => {
    if (!canUpload || files.length >= RND_ATTACHMENT_LIMIT) return;
    setUploading(true);
    setError(null);
    try {
      await uploadAttachmentFile(code, file, "rnd");
      reload();
    } catch (uploadError: unknown) {
      setError(quotationsErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (attachmentId: string) => {
    if (!canUpload) return;
    setError(null);
    try {
      await deleteAttachment(code, attachmentId);
      reload();
    } catch (deleteError: unknown) {
      setError(quotationsErrorMessage(deleteError));
    }
  };

  const full = files.length >= RND_ATTACHMENT_LIMIT;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[var(--color-text-strong)]">
        Tệp đính kèm R&D ({files.length}/{RND_ATTACHMENT_LIMIT})
      </p>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="print-hide">
        <Dropzone
          state={uploading ? "uploading" : "empty"}
          hint="Tối đa 10 tệp cho R&D"
          onSelect={(file) => void onUpload(file)}
          disabled={!canUpload || uploading || full}
        />
      </div>
      {full ? <p className="mt-2 text-xs text-[var(--color-text-muted)]">Đã đủ 10 tệp. Xóa bớt để tải thêm.</p> : null}
      {files.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <div>
                <p className="font-semibold">{file.fileName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {file.uploadedBy} · {formatDateTime(file.uploadedAt)}
                </p>
              </div>
              {canUpload ? (
                <button type="button" className="print-hide cursor-pointer text-[var(--color-action-primary)]" onClick={() => void onDelete(file.id)}>
                  Xóa
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function RndLineSubForm({
  row,
  disabled,
  onPatch,
  minutes,
  minutesDisabled,
  onMinutesPatch,
  onPlate,
  onPrint,
  showPrintTitle,
  forceOpen,
}: {
  row: RndLinePayload;
  disabled: boolean;
  onPatch: (patch: Partial<RndLinePayload>) => void;
  minutes: DevelopmentMinutes | null;
  minutesDisabled: boolean;
  onMinutesPatch: (patch: Partial<DevelopmentMinutes>) => void;
  onPlate: (plateNo: number, field: keyof DevelopmentMinutesPrintPlate, value: string) => void;
  onPrint: () => void;
  showPrintTitle: boolean;
  forceOpen: boolean;
}) {
  const [open, setOpen] = useState(true);
  const shown = forceOpen || open;
  return (
    <fieldset className={`mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 ${shown ? "pb-3" : ""}`}>
      {showPrintTitle ? <h1 className="print-only mb-4 text-xl font-semibold">{PRINT_TITLES.rnd}</h1> : null}
      <SubFormLegend title="Phân tích R&D" open={shown} onToggle={() => setOpen((value) => !value)} />
      {shown ? (
        <div className="grid gap-3">
          <div className="grid items-stretch gap-3 md:grid-cols-4">
            <p className="pl-10 text-center text-sm font-semibold text-[var(--color-text-strong)] md:col-start-1 md:row-start-1">Bảng in</p>
            <p className="pl-10 text-center text-sm font-semibold text-[var(--color-text-strong)] md:col-start-2 md:row-start-1">Khuôn bế</p>
            <div className="flex items-center justify-end md:col-span-2 md:col-start-3 md:row-start-1">
              <PrintFormButton label="In" onClick={onPrint} />
            </div>
            <div className="md:col-start-1 md:row-start-2">
              <Field label="Bảng in" labelOnHover icon={qaIcons.plate} value={row.layoutCode} onChange={(v) => onPatch({ layoutCode: v })} disabled={disabled} />
            </div>
            <div className="md:col-start-2 md:row-start-2">
              <Field label="Khuôn bế" labelOnHover icon={qaIcons.die} value={row.dieCode} onChange={(v) => onPatch({ dieCode: v })} disabled={disabled} />
            </div>
            <div className="md:col-start-1 md:row-start-3">
              <Field label="Mã báo giá bảng in" labelOnHover icon={qaIcons.note} value={row.layoutQuoteCode} onChange={(v) => onPatch({ layoutQuoteCode: v })} disabled={disabled} />
            </div>
            <div className="md:col-start-2 md:row-start-3">
              <Field label="Mã báo giá khuôn bế" labelOnHover icon={qaIcons.note} value={row.dieQuoteCode} onChange={(v) => onPatch({ dieQuoteCode: v })} disabled={disabled} />
            </div>
            <div className="flex min-h-0 flex-col md:col-start-3 md:row-start-2 md:row-span-2">
              <Field
                label="Phương án sản xuất"
                labelOnHover
                required
                requiredInside
                stretch
                icon={qaIcons.plan}
                as="textarea"
                rows={2}
                value={row.productionPlan}
                onChange={(v) => onPatch({ productionPlan: v })}
                disabled={disabled}
              />
            </div>
            <div className="flex min-h-0 flex-col md:col-start-4 md:row-start-2 md:row-span-2">
              <Field
                label="Ghi chú kỹ thuật"
                labelOnHover
                stretch
                icon={qaIcons.note}
                as="textarea"
                rows={2}
                value={row.rndNote}
                onChange={(v) => onPatch({ rndNote: v })}
                disabled={disabled}
              />
            </div>
          </div>
          <RndMinutesFields minutes={minutes} disabled={minutesDisabled} onPatch={onMinutesPatch} onPlate={onPlate} forceOpen={forceOpen} />
          <RndAttachmentBlock />
        </div>
      ) : null}
    </fieldset>
  );
}

export function QuoteQaPage() {
  const { code, detail, applyDetail } = useQuotationContext();
  const { user } = useAuth();
  const lines = useMemo(() => resolvedLineItems(detail), [detail]);
  const [qaLineRows, setQaLineRows] = useState<QaLinePayload[]>(() => buildQaLineState(detail));
  const [rndLineRows, setRndLineRows] = useState<RndLinePayload[]>(() => buildRndLineState(detail));
  const [minutes, setMinutes] = useState<DevelopmentMinutes | null>(() => flattenMinutes(detail.developmentMinutes));
  const [minutesReady, setMinutesReady] = useState(Boolean(detail.developmentMinutes));
  const [openQaLines, setOpenQaLines] = useState<Set<number>>(
    () => new Set(lines[0]?.lineNumber != null ? [lines[0].lineNumber] : []),
  );
  const [printKind, setPrintKind] = useState<"qa" | "rnd" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEditQa = Boolean(user && !isAdmin(user.groups) && hasRole(user.groups, "QA"));
  const canEditRnd = Boolean(user && !isAdmin(user.groups) && hasRole(user.groups, "R&D"));
  const qaTask = detail.tasks.find((t) => t.taskType === "qa_review");
  const rndTask = detail.tasks.find((t) => t.taskType === "rnd_review");
  const qaPersistOk = serverSupportsQaLinePersist(detail);
  const rndPersistOk = serverSupportsRndLinePersist(detail);

  useEffect(() => {
    setQaLineRows(buildQaLineState(detail));
    setRndLineRows(buildRndLineState(detail));
  }, [detail]);

  useEffect(() => {
    let active = true;
    setMinutesReady(false);
    getDevelopmentMinutes(code)
      .then((result) => {
        if (!active) return;
        setMinutes(flattenMinutes(result));
        setMinutesReady(true);
      })
      .catch(() => {
        if (!active) return;
        if (detail.developmentMinutes) {
          setMinutes(flattenMinutes(detail.developmentMinutes));
          setMinutesReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [code, detail.developmentMinutes]);

  useEffect(() => {
    const nums = new Set(lines.map((l) => l.lineNumber));
    if (nums.size === 0) {
      setOpenQaLines(new Set());
      return;
    }
    setOpenQaLines((prev) => {
      const kept = new Set([...prev].filter((lineNumber) => nums.has(lineNumber)));
      if (kept.size === 0 && lines[0]) kept.add(lines[0].lineNumber);
      return kept;
    });
  }, [lines]);

  const canPersistQa = canEditQa && qaPersistOk && validateQaLines(qaLineRows).length === 0;
  const canPersistRnd = canEditRnd && rndPersistOk && validateRndLines(rndLineRows).length === 0;
  const canSaveMinutes = canEditRnd && minutesReady && minutes != null;
  const canCompleteQa = canPersistQa && qaTask?.taskStatus === "in_progress";
  const canCompleteRnd = canPersistRnd && rndTask?.taskStatus === "in_progress";

  const patchMinutes = (patch: Partial<DevelopmentMinutes>) => setMinutes((prev) => ({ ...(prev ?? {}), ...patch }));

  const patchPlate = (plateNo: number, field: keyof DevelopmentMinutesPrintPlate, value: string) => {
    setMinutes((prev) => ({
      ...(prev ?? {}),
      printPlates: platesOf(prev).map((plate) => (plate.plateNo === plateNo ? { ...plate, [field]: value } : plate)),
    }));
  };

  const persistMinutes = async () => {
    if (!canSaveMinutes || !minutes) return null;
    await updateDevelopmentMinutes(code, minutesToApi(minutes));
    const fresh = flattenMinutes(await getDevelopmentMinutes(code));
    setMinutes(fresh);
    return fresh;
  };

  const save = async () => {
    if (!canPersistQa && !canPersistRnd && !canSaveMinutes) return;
    setPending(true);
    setError(null);
    try {
      let next = detail;
      if (canPersistQa) next = await updateQaData(code, qaDataFromLinePayloads(qaLineRows));
      if (canPersistRnd) next = await updateRndData(code, rndDataFromLinePayloads(rndLineRows));
      const savedMinutes = await persistMinutes();
      applyDetail(savedMinutes ? { ...next, developmentMinutes: savedMinutes } : next);
    } catch (saveError: unknown) {
      setError(quotationsErrorMessage(saveError));
    } finally {
      setPending(false);
    }
  };

  const complete = async () => {
    if (!canCompleteQa && !canCompleteRnd) return;
    setPending(true);
    setError(null);
    try {
      let next = detail;
      if (canCompleteQa) {
        await updateQaData(code, qaDataFromLinePayloads(qaLineRows));
        next = await completeTask(code, "qa_review");
      }
      if (canCompleteRnd) {
        await updateRndData(code, rndDataFromLinePayloads(rndLineRows));
        const savedMinutes = await persistMinutes();
        next = await completeTask(code, "rnd_review");
        if (savedMinutes) next = { ...next, developmentMinutes: savedMinutes };
      }
      applyDetail(next);
    } catch (completeError: unknown) {
      setError(quotationsErrorMessage(completeError));
    } finally {
      setPending(false);
    }
  };

  const useAccordion = lines.length > 1;

  useEffect(() => {
    if (!printKind) return;
    const previousTitle = document.title;
    document.body.dataset.print = printKind;
    document.title = PRINT_TITLES[printKind];
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      document.title = previousTitle;
      delete document.body.dataset.print;
      setPrintKind(null);
    };
    window.addEventListener("afterprint", cleanup);
    const frame = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", cleanup);
    };
  }, [printKind]);

  return (
    <Card>
      {canEditQa && !qaPersistOk ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <strong className="font-semibold">Chờ API:</strong> GET/PUT chưa hỗ trợ <code className="text-xs">qaLineData</code>. Phân tích QA chỉ đọc tại chỗ — không lưu được cho tới khi Backend mở contract.
        </div>
      ) : null}
      {canEditRnd && !rndPersistOk ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <strong className="font-semibold">Chờ API:</strong> GET/PUT chưa hỗ trợ <code className="text-xs">rndLineData</code>. Phân tích R&D không lưu được cho tới khi Backend cập nhật contract.
        </div>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="space-y-4">
        {lines.map((line, lineIndex) => {
          const row = qaLineRows.find((r) => r.lineNumber === line.lineNumber);
          const rndRow = rndLineRows.find((r) => r.lineNumber === line.lineNumber);
          if (!row) return null;
          const isOpen = printKind != null || !useAccordion || openQaLines.has(line.lineNumber);
          const toggleLineOpen = () => {
            setOpenQaLines((prev) => {
              const next = new Set(prev);
              if (next.has(line.lineNumber)) next.delete(line.lineNumber);
              else next.add(line.lineNumber);
              return next;
            });
          };
          return (
            <section key={line.lineNumber} className="rounded-[var(--radius-md)] border-2 border-[#6b7280] bg-white p-4 shadow-[var(--shadow-card)]">
              {useAccordion ? (
                <button
                  type="button"
                  className="mb-2 flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                  onClick={toggleLineOpen}
                  aria-expanded={isOpen}
                >
                  <LineContextHeading line={line} />
                  <LineCollapseToggle open={isOpen} />
                </button>
              ) : (
                <LineContextHeading line={line} />
              )}
              {isOpen ? (
                <>
                  <div data-print-root="qa">
                    <QaLineFields
                      row={row}
                      disabled={!canEditQa || !qaPersistOk}
                      onPatch={(patch) => setQaLineRows((prev) => patchQaLine(prev, line.lineNumber, patch))}
                      onPrint={() => setPrintKind("qa")}
                      showPrintTitle={lineIndex === 0}
                      forceOpen={printKind === "qa"}
                    />
                  </div>
                  {rndRow ? (
                    <div data-print-root="rnd">
                      <RndLineSubForm
                        row={rndRow}
                        disabled={!canEditRnd || !rndPersistOk}
                        onPatch={(patch) => setRndLineRows((prev) => patchRndLine(prev, line.lineNumber, patch))}
                        minutes={minutes}
                        minutesDisabled={!canEditRnd || !minutesReady}
                        onMinutesPatch={patchMinutes}
                        onPlate={patchPlate}
                        onPrint={() => setPrintKind("rnd")}
                        showPrintTitle={lineIndex === 0}
                        forceOpen={printKind === "rnd"}
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>
          );
        })}
      </div>

      <RoleActionBar
        onSave={() => void save()}
        onComplete={() => void complete()}
        canSave={canPersistQa || canPersistRnd || canSaveMinutes}
        canComplete={Boolean(canCompleteQa || canCompleteRnd)}
        pending={pending}
      />
    </Card>
  );
}

export function QuoteConsolidationPage() {
  const { code, detail, applyDetail } = useQuotationContext();
  const { user } = useAuth();
  const data = detail.executorConsolidation;
  const rnd = detail.rndData;
  const items = resolvedLineItems(detail);
  const customerName = detail.quotation.customerName ?? detail.customerSnapshot?.customerName ?? "—";
  const [linePrices, setLinePrices] = useState(() => pricesFromLineItems(items));
  const [deliveryTerms, setDeliveryTerms] = useState(data?.deliveryTerms ?? "");
  const [consolidationNote, setConsolidationNote] = useState(data?.consolidationNote ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = user && !isAdmin(user.groups) && hasRole(user.groups, "EXECUTOR");
  const task = detail.tasks.find((t) => t.taskType === "executor_consolidation");

  const consolidationBody = () => ({
    deliveryTerms,
    consolidationNote,
    lineItems: consolidationLinePayload(items, linePrices),
  });

  const save = async () => {
    if (!canEdit) return;
    setPending(true);
    setError(null);
    try {
      const next = await updateExecutorConsolidation(code, consolidationBody());
      applyDetail(next);
      setLinePrices(pricesFromLineItems(resolvedLineItems(next)));
    } catch (saveError: unknown) {
      setError(quotationsErrorMessage(saveError));
    } finally {
      setPending(false);
    }
  };

  const complete = async () => {
    if (!canEdit) return;
    setPending(true);
    setError(null);
    try {
      await updateExecutorConsolidation(code, consolidationBody());
      const next = await completeTask(code, "executor_consolidation");
      applyDetail(next);
    } catch (completeError: unknown) {
      setError(quotationsErrorMessage(completeError));
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-4 font-semibold">Tổng hợp Thông tin & Đơn giá (PRICE-FORMAT)</h2>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <PriceFormatGrid
        items={items}
        customerName={customerName}
        printingPlateCost={rnd?.printingPlateCost}
        dieCost={rnd?.dieCost}
        prices={linePrices}
        editable={Boolean(canEdit)}
        onPriceChange={(lineNumber, patch) =>
          setLinePrices((prev) => ({ ...prev, [lineNumber]: { ...prev[lineNumber], ...patch } }))
        }
      />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Điều kiện giao hàng (EXC-05)" as="textarea" value={deliveryTerms} onChange={setDeliveryTerms} disabled={!canEdit} />
        <Field label="Ghi chú tổng hợp (EXC-06)" as="textarea" value={consolidationNote} onChange={setConsolidationNote} disabled={!canEdit} />
      </div>
      <RoleActionBar
        onSave={() => void save()}
        onComplete={() => void complete()}
        canSave={Boolean(canEdit)}
        canComplete={Boolean(canEdit && task?.taskStatus === "in_progress")}
        pending={pending}
      />
    </Card>
  );
}

export function QuoteAccountingPage() {
  const { code, detail, applyDetail } = useQuotationContext();
  const { user } = useAuth();
  const data = detail.accountingData;
  const items = resolvedLineItems(detail);
  const qty = totalLineItemQuantity(items);
  const [finalQuotationValue, setFinalQuotationValue] = useState(
    data?.finalQuotationValue != null ? String(data.finalQuotationValue) : "",
  );
  const [vatRate, setVatRate] = useState(data?.vatRate != null ? String(data.vatRate) : "10");
  const [paymentTerms, setPaymentTerms] = useState(data?.paymentTerms ?? "");
  const [financialAdjustment, setFinancialAdjustment] = useState(data?.financialAdjustment ?? "");
  const [accountingNote, setAccountingNote] = useState(data?.accountingNote ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = user && !isAdmin(user.groups) && hasRole(user.groups, "ACCOUNTING");
  const task = detail.tasks.find((t) => t.taskType === "accounting_review");

  const save = async () => {
    if (!canEdit) return;
    setPending(true);
    setError(null);
    try {
      const next = await updateAccountingData(code, {
        finalQuotationValue: finalQuotationValue === "" ? undefined : Number(finalQuotationValue),
        vatRate: vatRate === "" ? undefined : Number(vatRate),
        paymentTerms,
        financialAdjustment,
        accountingNote,
      });
      applyDetail(next);
    } catch (saveError: unknown) {
      setError(quotationsErrorMessage(saveError));
    } finally {
      setPending(false);
    }
  };

  const complete = async () => {
    if (!canEdit) return;
    setPending(true);
    setError(null);
    try {
      await updateAccountingData(code, {
        finalQuotationValue: finalQuotationValue === "" ? undefined : Number(finalQuotationValue),
        vatRate: vatRate === "" ? undefined : Number(vatRate),
        paymentTerms,
        financialAdjustment,
        accountingNote,
      });
      const next = await completeTask(code, "accounting_review");
      applyDetail(next);
    } catch (completeError: unknown) {
      setError(quotationsErrorMessage(completeError));
    } finally {
      setPending(false);
    }
  };

  const lineSummary = items
    .map(
      (item) =>
        `Dòng ${item.lineNumber}: ${item.unitPrice != null ? `${item.unitPrice.toLocaleString("vi-VN")} VNĐ × ${item.quantity.toLocaleString("vi-VN")}` : "chưa có giá"}`,
    )
    .join("\n");

  return (
    <Card>
      <h2 className="mb-4 font-semibold">Xử lý Tài chính & Chốt Giá trị Báo giá</h2>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tổng số lượng đặt hàng" value={qty > 0 ? `${qty.toLocaleString("vi-VN")} thùng` : "—"} readOnly />
        <Field label="Đơn giá theo dòng (từ tổng hợp)" as="textarea" value={lineSummary || "—"} readOnly />
        <Field label="Giá trị báo giá cuối" required value={finalQuotationValue} onChange={setFinalQuotationValue} disabled={!canEdit} />
        <Field label="Thuế VAT (%)" value={vatRate} onChange={setVatRate} disabled={!canEdit} />
        <Field label="Điều khoản thanh toán" value={paymentTerms} onChange={setPaymentTerms} disabled={!canEdit} />
        <Field label="Điều chỉnh tài chính" value={financialAdjustment} onChange={setFinancialAdjustment} disabled={!canEdit} />
        <Field label="Ghi chú kế toán" as="textarea" value={accountingNote} onChange={setAccountingNote} disabled={!canEdit} />
      </div>
      <RoleActionBar
        onSave={() => void save()}
        onComplete={() => void complete()}
        canSave={Boolean(canEdit)}
        canComplete={Boolean(canEdit && task?.taskStatus === "in_progress")}
        pending={pending}
      />
    </Card>
  );
}

export function QuoteApprovalPage() {
  const { code, detail, applyDetail, reload } = useQuotationContext();
  const { user } = useAuth();
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDecide = user && !isAdmin(user.groups) && hasRole(user.groups, "DIRECTOR");
  const accounting = detail.accountingData;
  const items = resolvedLineItems(detail);

  const decide = async (decision: "approved" | "rejected") => {
    if (!canDecide) return;
    if (decision === "rejected" && !rejectionReason.trim()) {
      setError("Nhập lý do từ chối.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const next = await directorDecision(code, {
        decision,
        approvalNote: approvalNote || undefined,
        rejectionReason: decision === "rejected" ? rejectionReason : undefined,
        version: detail.quotation.version,
      });
      applyDetail(next);
    } catch (decideError: unknown) {
      const message = quotationsErrorMessage(decideError);
      setError(message);
      if (decideError instanceof QuotationsApiError && decideError.code === "CONFLICT") {
        void reload();
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-4 font-semibold">Phê duyệt Báo giá</h2>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="mb-4 grid gap-3 text-sm md:grid-cols-3">
        <div>
          <p className="text-[var(--color-text-muted)]">Số dòng / tổng SL</p>
          <p className="font-semibold">
            {items.length} dòng · {totalLineItemQuantity(items).toLocaleString("vi-VN")} thùng
          </p>
        </div>
        <div>
          <p className="text-[var(--color-text-muted)]">Tổng giá trị</p>
          <p className="font-semibold">
            {accounting?.finalQuotationValue != null ? `${accounting.finalQuotationValue.toLocaleString("vi-VN")} VNĐ` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[var(--color-text-muted)]">VAT</p>
          <p className="font-semibold">{accounting?.vatRate != null ? `${accounting.vatRate}%` : "—"}</p>
        </div>
      </div>
      <Field label="Ý kiến phê duyệt" as="textarea" value={approvalNote} onChange={setApprovalNote} disabled={!canDecide} />
      <div className="mt-4">
        <Field label="Lý do từ chối (bắt buộc khi từ chối)" as="textarea" value={rejectionReason} onChange={setRejectionReason} disabled={!canDecide} />
      </div>
      {canDecide ? (
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="error-outline" disabled={pending} onClick={() => void decide("rejected")}>
            Từ chối báo giá
          </Button>
          <Button disabled={pending} onClick={() => void decide("approved")}>
            Phê duyệt báo giá
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">Chỉ Giám đốc mới có thể phê duyệt hoặc từ chối.</p>
      )}
    </Card>
  );
}

type UploadSection = "qa" | "rnd" | "executor_consolidation" | "sales";

const UPLOAD_SECTION_OPTIONS: { value: UploadSection; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "qa", label: "QA" },
  { value: "rnd", label: "R&D" },
  { value: "executor_consolidation", label: "Tổng hợp" },
];

function uploadSectionsForRole(role: string | undefined): { value: UploadSection; label: string }[] {
  if (role === "QA") return UPLOAD_SECTION_OPTIONS.filter((option) => option.value === "qa");
  if (role === "R&D") return UPLOAD_SECTION_OPTIONS.filter((option) => option.value === "rnd");
  return UPLOAD_SECTION_OPTIONS;
}

function defaultUploadSection(role: string | undefined): UploadSection {
  if (role === "QA") return "qa";
  if (role === "R&D") return "rnd";
  return "sales";
}

export function QuoteFilesPage() {
  const { code, detail } = useQuotationContext();
  const { user } = useAuth();
  const sectionOptions = uploadSectionsForRole(user?.role);
  const [attachments, setAttachments] = useState<QuotationAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<UploadSection>(() => defaultUploadSection(user?.role));

  const canUpload = user && !isAdmin(user.groups);

  const reloadFiles = () => {
    setLoading(true);
    listAttachments(code, { cycleId: detail.quotation.currentCycleId })
      .then((result) => {
        setAttachments(result.attachments.filter((a) => !a.deletedAt));
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        setError(quotationsErrorMessage(loadError));
        setLoading(false);
      });
  };

  useEffect(() => {
    reloadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, detail.quotation.currentCycleId]);

  const onUpload = async (file: File) => {
    if (!canUpload) return;
    setUploading(true);
    setError(null);
    try {
      await uploadAttachmentFile(code, file, section);
      reloadFiles();
    } catch (uploadError: unknown) {
      setError(quotationsErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (attachmentId: string) => {
    if (!canUpload) return;
    setError(null);
    try {
      await deleteAttachment(code, attachmentId);
      reloadFiles();
    } catch (deleteError: unknown) {
      setError(quotationsErrorMessage(deleteError));
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Tài liệu & Tệp đính kèm</h2>
        <Field
          label="Phân vùng upload"
          as="select"
          options={sectionOptions}
          value={section}
          onChange={(v) => setSection(v as UploadSection)}
        />
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Dropzone state={uploading ? "uploading" : "empty"} onSelect={(file) => void onUpload(file)} disabled={!canUpload || uploading} />
      {loading ? (
        <ListSkeleton rows={3} />
      ) : attachments.length === 0 ? (
        <ListEmptyState />
      ) : (
        <ul className="mt-4 space-y-2">
          {attachments.map((file) => (
            <li key={file.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <div>
                <p className="font-semibold">{file.fileName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {file.section} · {file.uploadedBy} · {formatDateTime(file.uploadedAt)}
                </p>
              </div>
              {canUpload ? (
                <button type="button" className="text-[var(--color-action-primary)]" onClick={() => void onDelete(file.id)}>
                  Xóa
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function QuoteHistoryPage() {
  const { code } = useQuotationContext();
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getQuotationHistory(code, { pageSize: 50 })
      .then((result) => {
        if (!active) return;
        setEvents(result.events);
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Lịch sử thay đổi & Timeline quy trình</h2>
        <div className="flex gap-2">
          <Button to={quoteHref(code, "revisions")} variant="secondary">
            Mở danh sách phiên bản
          </Button>
          <Button to={quoteHref(code, "sla")} variant="ghost">
            Lịch sử SLA theo Task
          </Button>
        </div>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {loading ? (
        <ListSkeleton rows={5} />
      ) : events.length === 0 ? (
        <ListEmptyState />
      ) : (
        <ol className="space-y-4 border-l-2 border-[var(--color-nav-active)] pl-6">
          {events.map((item) => (
            <li key={item.id}>
              <p className="font-semibold">{item.actionType}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {formatDateTime(item.actionAt)} · {item.actorUsername} · {item.toStatus ?? item.fromStatus ?? ""}
              </p>
              {item.actionNote ? <p className="text-sm">{item.actionNote}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

export function QuotationDetailRoute({ children }: { children: ReactNode }) {
  return <QuotationLayout>{children}</QuotationLayout>;
}

export function QuoteRevisionsPage() {
  const { code } = useQuotationContext();
  const [revisions, setRevisions] = useState<Awaited<ReturnType<typeof listRevisions>>["revisions"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRevisions(code)
      .then((result) => {
        setRevisions(result.revisions);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [code]);

  return (
    <Card>
      <h2 className="mb-4 font-semibold">Danh sách phiên bản</h2>
      {loading ? (
        <ListSkeleton rows={4} />
      ) : revisions.length === 0 ? (
        <ListEmptyState />
      ) : (
        <ul className="divide-y text-sm">
          {revisions.map((rev) => (
            <li key={rev.id} className="py-3">
              <Link to={quoteHref(code, `revisions/${rev.revisionCode}`)} className="font-semibold text-[var(--color-action-primary)]">
                {rev.revisionCode} · {formatDateTime(rev.createdAt)} · {rev.createdBy}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
