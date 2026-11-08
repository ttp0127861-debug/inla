import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  cloneQuotation,
  getQuotation,
  getRevision,
  prepareResubmit,
  resubmitSubmit,
  similarByCustomer,
  similarByProduct,
  submitQuotation,
  quotationsErrorMessage,
  type Quotation,
} from "../../api/quotations";
import { Badge } from "../../components/ui/Badge";
import { CycleTypeBadge } from "../../components/ui/CycleTypeBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/DataTable";
import { Dropzone } from "../../components/ui/Dropzone";
import { Field } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { businessOutcomeLabel, businessOutcomeTone } from "../../lib/quotationLabels";
import { quoteHref, QuotationLayout, useQuotationCode } from "./quotationContext";
import { QuoteListPage, QuoteRequestPage } from "./QuotePages";

function sourceFromQuery(search: URLSearchParams): string | null {
  const raw = search.get("source");
  if (!raw) return null;
  const decoded = decodeURIComponent(raw);
  return /^BG-\d{6,}$/.test(decoded) ? decoded : null;
}

export function QuoteClonePage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const source = sourceFromQuery(search);
  const [sourceDetail, setSourceDetail] = useState<{ code: string; customerName: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    getQuotation(source)
      .then((detail) =>
        setSourceDetail({
          code: detail.quotation.code,
          customerName: detail.quotation.customerName ?? "—",
        }),
      )
      .catch(() => setSourceDetail(null));
  }, [source]);

  const runClone = async () => {
    if (!source) {
      setError("Thiếu mã báo giá nguồn (?source=BG-…).");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const created = await cloneQuotation(source);
      navigate(quoteHref(created.quotation.code, "edit"));
    } catch (cloneError: unknown) {
      setError(quotationsErrorMessage(cloneError));
      setPending(false);
    }
  };

  return (
    <>
      <QuoteListPage />
      <Modal title="Sao chép báo giá" closeTo="/quotations">
        <p className="mb-4 text-sm text-[var(--color-text-body)]">
          Tạo bản nháp mới từ báo giá nguồn. Thông tin khách hàng và quy cách được sao chép; tệp đính kèm không được sao chép trừ khi chọn riêng (API hỗ trợ copyAttachmentIds).
        </p>
        {error ? <p className="mb-3 text-sm text-[#b91c1c]">{error}</p> : null}
        <Field label="Mã báo giá nguồn" value={source ?? ""} readOnly />
        <div className="mt-4">
          <Field label="Khách hàng" value={sourceDetail?.customerName ?? "—"} readOnly />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/quotations" variant="text">
            Hủy
          </Button>
          <Button disabled={pending || !source} onClick={() => void runClone()}>
            Sao chép
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function QuoteResubmitPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const source = sourceFromQuery(search);
  const [reason, setReason] = useState("");
  const [detailCode, setDetailCode] = useState<string | null>(source);
  const [customerName, setCustomerName] = useState("—");
  const [spec, setSpec] = useState("—");
  const [version, setVersion] = useState<number | undefined>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    prepareResubmit(source)
      .then((detail) => {
        setDetailCode(detail.quotation.code);
        setCustomerName(detail.quotation.customerName ?? "—");
        setSpec(
          detail.lineItems?.length
            ? detail.lineItems.map((l) => `${l.itemName} (${l.quantity})`).join("; ")
            : detail.salesData?.boxType ?? "—",
        );
        setVersion(detail.quotation.version);
      })
      .catch((loadError: unknown) => setError(quotationsErrorMessage(loadError)));
  }, [source]);

  const submit = async () => {
    if (!detailCode || !reason.trim()) {
      setError("Nhập lý do gửi lại.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const next = await resubmitSubmit(detailCode, { resubmitReason: reason.trim(), version });
      navigate(quoteHref(next.quotation.code));
    } catch (submitError: unknown) {
      setError(quotationsErrorMessage(submitError));
      setPending(false);
    }
  };

  return (
    <>
      <h1 className="mb-4 font-[family-name:var(--font-serif)] text-2xl font-bold text-[var(--color-brand-primary)]">
        Chuẩn bị gửi lại báo giá (Re-submit) {detailCode ? `— ${detailCode}` : ""}
      </h1>
      <Card className="mb-4">
        <CycleTypeBadge cycleType="re_submit" />
        <p className="mt-3 text-sm">Báo giá đã bị từ chối hoặc cần vòng xử lý mới. Hoàn tất lý do và gửi lại.</p>
      </Card>
      {error ? <p className="mb-3 text-sm text-[#b91c1c]">{error}</p> : null}
      <Card>
        <div className="grid gap-4">
          <Field label="Lý do gửi lại" required as="textarea" value={reason} onChange={setReason} />
          <Field label="Khách hàng" value={customerName} readOnly />
          <Field label="Quy cách thùng" value={spec} readOnly />
          <Dropzone />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button to={detailCode ? quoteHref(detailCode) : "/quotations"} variant="text">
            Hủy
          </Button>
          <Button disabled={pending} onClick={() => void submit()}>
            Gửi lại
          </Button>
        </div>
      </Card>
    </>
  );
}

function SimilarList({ title, load }: { title: string; load: (code: string) => Promise<{ quotations: Quotation[] }> }) {
  const [search] = useSearchParams();
  const source = sourceFromQuery(search);
  const [items, setItems] = useState<Quotation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    load(source)
      .then((result) => setItems(result.quotations))
      .catch((loadError: unknown) => setError(quotationsErrorMessage(loadError)));
  }, [source, load]);

  if (!source) {
    return <p className="text-sm text-[var(--color-text-muted)]">Thiếu tham số ?source=BG-…</p>;
  }

  return (
    <>
      <h2 className="mb-4 font-semibold">{title}</h2>
      {error ? <p className="mb-3 text-sm text-[#b91c1c]">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((row) => (
          <Link key={row.id} to={quoteHref(row.code)} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4">
            <p className="font-semibold text-[var(--color-action-primary)]">{row.code}</p>
            <p className="mt-1 text-sm">{row.customerName ?? "—"}</p>
            <p className="mt-2 text-xs">
              <Badge tone={businessOutcomeTone(row.businessOutcome)}>{businessOutcomeLabel(row.businessOutcome)}</Badge>
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}

function SimilarRoute({ title, load }: { title: string; load: (code: string) => Promise<{ quotations: Quotation[] }> }) {
  const [search] = useSearchParams();
  const source = sourceFromQuery(search);
  if (!source) return <SimilarList title={title} load={load} />;
  return (
    <QuotationLayout code={source}>
      <SimilarList title={title} load={load} />
    </QuotationLayout>
  );
}

export function SimilarProductPage() {
  return <SimilarRoute title="Báo giá tương tự theo sản phẩm" load={similarByProduct} />;
}

export function SimilarCustomerPage() {
  return <SimilarRoute title="Báo giá tương tự theo khách hàng" load={similarByCustomer} />;
}

export function QuoteSnapshotPage() {
  const code = useQuotationCode();
  const { id: revisionParam = "" } = useParams();
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !revisionParam) return;
    getRevision(code, revisionParam)
      .then((result) => {
        setBanner(
          `Phiên bản ${result.revision.revisionCode} · ${new Date(result.revision.createdAt).toLocaleString("vi-VN")} · ${result.revision.createdBy}`,
        );
      })
      .catch(() => setBanner(null));
  }, [code, revisionParam]);

  if (!code) return null;

  return (
    <>
      {banner ? (
        <div className="mb-4 flex items-center justify-between rounded-[var(--radius-sm)] bg-[#fff7ed] px-4 py-3 text-sm">
          <span>Bạn đang xem phiên bản cũ — {banner}</span>
          <Button to={quoteHref(code, "history")} variant="secondary">
            Quay lại phiên bản hiện tại
          </Button>
        </div>
      ) : null}
      <QuotationLayout>
        <QuoteRequestPage />
      </QuotationLayout>
    </>
  );
}

export function RevisionDrawerPage() {
  return null;
}

export function SendConfirmPage() {
  const code = useQuotationCode();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<number | undefined>();

  useEffect(() => {
    if (!code) return;
    getQuotation(code)
      .then((detail) => setVersion(detail.quotation.version))
      .catch(() => setVersion(undefined));
  }, [code]);

  const confirm = async () => {
    if (!code) return;
    setPending(true);
    setError(null);
    try {
      const next = await submitQuotation(code, { version });
      navigate(quoteHref(next.quotation.code));
    } catch (submitError: unknown) {
      setError(quotationsErrorMessage(submitError));
      setPending(false);
    }
  };

  if (!code) return null;

  return (
    <>
      <QuotationLayout>
        <QuoteRequestPage />
      </QuotationLayout>
      <Modal title="Xác nhận gửi xử lý" closeTo={quoteHref(code)}>
        <p className="text-sm">Báo giá sẽ chuyển sang EXECUTOR (Trưởng phòng Kế hoạch) để tiếp nhận.</p>
        {error ? <p className="mt-3 text-sm text-[#b91c1c]">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button to={quoteHref(code)} variant="text">
            Hủy
          </Button>
          <Button disabled={pending} onClick={() => void confirm()}>
            Gửi xử lý
          </Button>
        </div>
      </Modal>
    </>
  );
}
