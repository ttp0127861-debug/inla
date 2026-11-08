import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  getQuotation,
  quotationsErrorMessage,
  type QuotationDetailResponse,
} from "../../api/quotations";
import { QuotationLayoutSkeleton } from "../../components/ui/ListPanelState";
import { quoteTabs, TabRow } from "../../components/ui/Tabs";
import { Badge } from "../../components/ui/Badge";
import { CycleTypeBadge } from "../../components/ui/CycleTypeBadge";
import { SlaIndicatorBadge } from "../../components/ui/SlaIndicatorBadge";
import { WorkflowStatusBadge } from "../../components/ui/WorkflowStatusBadge";
import {
  activeSlaTask,
  businessOutcomeLabel,
  businessOutcomeTone,
  slaAlertLabel,
} from "../../lib/quotationLabels";

const QUOTATION_CODE_RE = /^BG-\d{6,}$/;

export function useQuotationCode(): string | null {
  const { code } = useParams();
  const decoded = code ? decodeURIComponent(code) : "";
  if (!QUOTATION_CODE_RE.test(decoded)) return null;
  return decoded;
}

export function quoteHref(code: string, segment?: string): string {
  const base = `/quotations/${encodeURIComponent(code)}`;
  return segment ? `${base}/${segment}` : base;
}

type QuotationCtx = {
  code: string;
  detail: QuotationDetailResponse;
  reload: () => Promise<void>;
  applyDetail: (next: QuotationDetailResponse) => void;
};

const QuotationContext = createContext<QuotationCtx | null>(null);

export function useQuotationContext(): QuotationCtx {
  const ctx = useContext(QuotationContext);
  if (!ctx) throw new Error("QuotationContext missing");
  return ctx;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("vi-VN");
}

function Notice({ children }: { tone: "error"; children: string }) {
  return <p className="mb-4 rounded-[var(--radius-sm)] bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">{children}</p>;
}

export function QuotationLayout({ children, code: codeOverride }: { children: ReactNode; code?: string }) {
  const paramCode = useQuotationCode();
  const code = codeOverride ?? paramCode;
  const [detail, setDetail] = useState<QuotationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!code) return;
    const next = await getQuotation(code);
    setDetail(next);
  }, [code]);

  useEffect(() => {
    if (!code) return;
    let active = true;
    setLoading(true);
    setError(null);
    getQuotation(code)
      .then((result) => {
        if (!active) return;
        setDetail(result);
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

  if (!code) {
    return <Navigate to="/shared/not-found" replace />;
  }
  if (loading) {
    return <QuotationLayoutSkeleton />;
  }
  if (error || !detail) {
    return <Notice tone="error">{error || "Không tìm thấy báo giá."}</Notice>;
  }

  const { quotation } = detail;
  const slaTask = activeSlaTask(detail.tasks);

  return (
    <QuotationContext.Provider value={{ code, detail, reload, applyDetail: setDetail }}>
      <section className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-brand-primary)]">
              {quotation.code}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-body)]">
              Khách hàng: {quotation.customerName ?? "—"} · Sales phụ trách: {quotation.salesOwnerUsername}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WorkflowStatusBadge status={quotation.workflowStatus} />
            {quotation.currentCycleType ? <CycleTypeBadge cycleType={quotation.currentCycleType} /> : null}
            <Badge tone={businessOutcomeTone(quotation.businessOutcome)}>
              {businessOutcomeLabel(quotation.businessOutcome)}
            </Badge>
            <SlaIndicatorBadge
              state={slaTask?.slaAlertState && slaTask.slaAlertState !== "none" ? slaTask.slaAlertState : "normal"}
              label={`${formatDate(quotation.createdAt)} · ${slaAlertLabel(slaTask?.slaAlertState) ?? "Trong hạn"}`}
            />
          </div>
        </div>
      </section>
      <div className="print-hide">
        <TabRow tabs={quoteTabs(code)} />
      </div>
      <div className="pt-6">{children}</div>
    </QuotationContext.Provider>
  );
}
