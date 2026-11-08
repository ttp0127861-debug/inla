import { useEffect, useState } from "react";
import {
  getDevelopmentMinutes,
  quotationsErrorMessage,
  updateDevelopmentMinutes,
  type DevelopmentMinutes,
  type DevelopmentMinutesParticipant,
  type DevelopmentMinutesPrintPlate,
} from "../../api/quotations";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/ui/Button";
import { Card, DataTable } from "../../components/ui/DataTable";
import { SkeletonBar } from "../../components/ui/Skeleton";
import { Field } from "../../components/ui/Field";
import { resolvedLineItems } from "../../lib/lineItems";
import { buildQaLineState, buildRndLineState } from "../../lib/qaRndLineData";
import { LineContextHeading, LineItemsSummaryTable } from "./quoteLineReviewUi";
import { hasRole, isAdmin } from "./QuotePages";
import { useQuotationContext } from "./quotationContext";

function Notice({ children }: { children: string }) {
  return <p className="mb-4 rounded-[var(--radius-sm)] bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">{children}</p>;
}

function ReadOnlyBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#374151]">{label}</p>
      <p className="mt-1 min-h-[42px] rounded-[4px] border border-[#e5e7eb] bg-[#faf7f4] px-3 py-2 text-sm whitespace-pre-wrap">
        {value.trim() ? value : "—"}
      </p>
    </div>
  );
}

function defaultPrintPlates(): DevelopmentMinutesPrintPlate[] {
  return Array.from({ length: 7 }, (_, index) => ({
    plateNo: index + 1,
    colorSystem: "",
    trame: "",
    anilox: "",
  }));
}

function normalizeMinutes(raw: DevelopmentMinutes | null | undefined): DevelopmentMinutes {
  const byNo = new Map((raw?.printPlates ?? []).map((plate) => [plate.plateNo, plate]));
  return {
    meetingPlace: raw?.meetingPlace ?? "",
    meetingDate: raw?.meetingDate ?? "",
    participants:
      raw?.participants && raw.participants.length > 0
        ? raw.participants
        : [{ seq: 1, fullName: "", department: "", jobTitle: "" }],
    designNotes: raw?.designNotes ?? "",
    sampleBoxNotes: raw?.sampleBoxNotes ?? "",
    printPlates: defaultPrintPlates().map((plate) => ({ ...plate, ...byNo.get(plate.plateNo) })),
    finishDieCut: raw?.finishDieCut ?? "",
    finishGlue: raw?.finishGlue ?? "",
    finishStaple: raw?.finishStaple ?? "",
    uvCoating: raw?.uvCoating ?? "",
    bundlingMethod: raw?.bundlingMethod ?? "",
    palletNotes: raw?.palletNotes ?? "",
    shippingNotes: raw?.shippingNotes ?? "",
    otherNotes: raw?.otherNotes ?? "",
    meetingConclusion: raw?.meetingConclusion ?? "",
  };
}

export function QuoteDevelopmentMinutesPage() {
  const { code, detail } = useQuotationContext();
  const { user } = useAuth();
  const [minutes, setMinutes] = useState<DevelopmentMinutes>(() => normalizeMinutes(detail.developmentMinutes));
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const canEdit = Boolean(user && !isAdmin(user.groups) && hasRole(user.groups, "R&D"));
  const snapshot = detail.customerSnapshot;
  const lineItems = resolvedLineItems(detail);
  const qaLineMirror = buildQaLineState(detail);
  const rndLineMirror = buildRndLineState(detail);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getDevelopmentMinutes(code)
      .then((result) => {
        if (!active) return;
        setMinutes(normalizeMinutes(result));
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        if (detail.developmentMinutes) {
          setMinutes(normalizeMinutes(detail.developmentMinutes));
        } else {
          setError(quotationsErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [code, detail.developmentMinutes]);

  const patch = (partial: Partial<DevelopmentMinutes>) => setMinutes((prev) => ({ ...prev, ...partial }));

  const updateParticipant = (index: number, partial: Partial<DevelopmentMinutesParticipant>) => {
    setMinutes((prev) => ({
      ...prev,
      participants: (prev.participants ?? []).map((row, i) => (i === index ? { ...row, ...partial } : row)),
    }));
  };

  const addParticipant = () => {
    setMinutes((prev) => {
      const rows = prev.participants ?? [];
      return {
        ...prev,
        participants: [...rows, { seq: rows.length + 1, fullName: "", department: "", jobTitle: "" }],
      };
    });
  };

  const removeParticipant = (index: number) => {
    setMinutes((prev) => {
      const rows = (prev.participants ?? []).filter((_, i) => i !== index);
      return {
        ...prev,
        participants: rows.length
          ? rows.map((row, i) => ({ ...row, seq: i + 1 }))
          : [{ seq: 1, fullName: "", department: "", jobTitle: "" }],
      };
    });
  };

  const save = async () => {
    if (!canEdit) return;
    setPending(true);
    setError(null);
    setSaved(null);
    try {
      const next = await updateDevelopmentMinutes(code, minutes);
      setMinutes(normalizeMinutes(next));
      setSaved("Đã lưu biên bản PTDSP.");
    } catch (saveError: unknown) {
      setError(quotationsErrorMessage(saveError));
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <SkeletonBar preset="barWide" className="mb-2 h-6 w-72" />
        <SkeletonBar preset="barWide" className="mb-6 w-full max-w-2xl" />
        <SkeletonBar preset="barWide" className="mb-4 h-5 w-48" />
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <SkeletonBar preset="barWide" className="h-16 w-full" />
          <SkeletonBar preset="barWide" className="h-16 w-full" />
        </div>
        <h3 className="mb-3 font-semibold">Thành phần tham dự</h3>
        <DataTable
          loading
          columns={["STT", "Họ và tên", "Bộ phận", "Chức vụ", "Hành động"]}
          skeletonCells={["barNarrow", "barWide", "barWide", "barWide", "actions"]}
          rows={[]}
        />
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-1 font-semibold">Biên bản họp PTDSP (BM03-QT02-LTM)</h2>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        Việc B — nội dung họp phát triển sản phẩm. Tiêu chuẩn QA và phương án R&D mirror <strong className="font-semibold">theo từng dòng</strong> từ tab QA / R&D.
      </p>
      {error ? <Notice>{error}</Notice> : null}
      {saved ? <p className="mb-4 text-sm text-[#047857]">{saved}</p> : null}

      <section className="mb-6 space-y-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[#faf7f4] p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Khách hàng & Sales (read-only)</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <ReadOnlyBlock label="Khách hàng" value={[snapshot?.customerCode, snapshot?.customerName].filter(Boolean).join(" — ")} />
          <ReadOnlyBlock label="Số dòng sản phẩm" value={String(lineItems.length)} />
        </div>
      </section>

      <section className="mb-6 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Dòng sản phẩm (Sales — read-only)</h3>
        <LineItemsSummaryTable lines={lineItems} />
      </section>

      <section className="mb-6 space-y-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[#faf7f4] p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Tiêu chuẩn chất lượng (QA — mirror theo dòng)</h3>
        {qaLineMirror.map((qaRow) => {
          const line = lineItems.find((l) => l.lineNumber === qaRow.lineNumber);
          if (!line) return null;
          return (
            <div key={qaRow.lineNumber} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-3">
              <LineContextHeading line={line} />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <ReadOnlyBlock label="Tiêu chuẩn — Bục (QA-09)" value={qaRow.burstStandard} />
                <ReadOnlyBlock label="Tiêu chuẩn — Nén (QA-10)" value={qaRow.compressionStandard} />
                <ReadOnlyBlock label="Tiêu chuẩn — TL (QA-11)" value={qaRow.weightLimitStandard} />
                <ReadOnlyBlock label="Tiêu chuẩn — KCG (QA-12)" value={qaRow.kcgStandard} />
              </div>
              <ReadOnlyBlock label="KCG QA+SX đề xuất — dòng 1 (QA-13)" value={qaRow.kcgQaSxProposal1} />
              <ReadOnlyBlock label="KCG QA+SX đề xuất — dòng 2 (QA-14)" value={qaRow.kcgQaSxProposal2} />
              <ReadOnlyBlock label="KCG QA+SX đề xuất — dòng 3 (QA-15)" value={qaRow.kcgQaSxProposal3} />
            </div>
          );
        })}
      </section>

      <section className="mb-6 space-y-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[#faf7f4] p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">R&D — mirror theo dòng</h3>
        {rndLineMirror.map((rndRow) => {
          const line = lineItems.find((l) => l.lineNumber === rndRow.lineNumber);
          if (!line) return null;
          return (
            <div key={rndRow.lineNumber} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-3">
              <LineContextHeading line={line} />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <ReadOnlyBlock label="Phương án sản xuất (RND-11)" value={rndRow.productionPlan} />
                <ReadOnlyBlock label="Ghi chú kỹ thuật (RND-05)" value={rndRow.rndNote} />
                <ReadOnlyBlock label="Chi phí bản in (RND-01)" value={rndRow.printingPlateCost} />
                <ReadOnlyBlock label="Chi phí khuôn bế (RND-02)" value={rndRow.dieCost} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="mb-6 space-y-4">
        <h3 className="font-semibold">Meta cuộc họp</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Địa điểm họp (BM03-M01)"
            value={minutes.meetingPlace ?? ""}
            onChange={(value) => patch({ meetingPlace: value })}
            disabled={!canEdit}
          />
          <Field
            label="Ngày họp (BM03-M02)"
            type="date"
            value={minutes.meetingDate ?? ""}
            onChange={(value) => patch({ meetingDate: value })}
            disabled={!canEdit}
          />
        </div>
      </section>

      <section className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Thành phần tham dự</h3>
          {canEdit ? (
            <Button type="button" variant="secondary" onClick={addParticipant}>
              Thêm dòng
            </Button>
          ) : null}
        </div>
        {(minutes.participants ?? []).length === 0 ? (
          <DataTable
            columns={["STT", "Họ và tên", "Bộ phận", "Chức vụ", "Hành động"]}
            rows={[]}
            emptyHint={canEdit ? "Nhấn «Thêm dòng» để thêm thành phần tham dự." : undefined}
          />
        ) : (
        <div className="space-y-3">
          {(minutes.participants ?? []).map((row, index) => (
            <div key={index} className="grid gap-3 rounded border border-[var(--color-border)] p-3 md:grid-cols-[64px_1fr_1fr_1fr_auto]">
              <Field label="STT" value={String(row.seq)} readOnly disabled />
              <Field
                label="Họ và tên"
                value={row.fullName}
                onChange={(value) => updateParticipant(index, { fullName: value })}
                disabled={!canEdit}
              />
              <Field
                label="Bộ phận"
                value={row.department}
                onChange={(value) => updateParticipant(index, { department: value })}
                disabled={!canEdit}
              />
              <Field
                label="Chức vụ"
                value={row.jobTitle ?? ""}
                onChange={(value) => updateParticipant(index, { jobTitle: value })}
                disabled={!canEdit}
              />
              {canEdit && (minutes.participants?.length ?? 0) > 1 ? (
                <div className="flex items-end">
                  <Button type="button" variant="text" onClick={() => removeParticipant(index)}>
                    Xóa
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        )}
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <Field
          label="Thiết kế (BM03-R01)"
          as="textarea"
          value={minutes.designNotes ?? ""}
          onChange={(value) => patch({ designNotes: value })}
          disabled={!canEdit}
        />
        <Field
          label="Thùng mẫu (BM03-R02)"
          as="textarea"
          value={minutes.sampleBoxNotes ?? ""}
          onChange={(value) => patch({ sampleBoxNotes: value })}
          disabled={!canEdit}
        />
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Field label="Tạo bóng (UV) (BM03-R23)" value={minutes.uvCoating ?? ""} onChange={(v) => patch({ uvCoating: v })} disabled={!canEdit} />
        <Field
          label="Vận chuyển / giao hàng (BM03-R26)"
          as="textarea"
          value={minutes.shippingNotes ?? ""}
          onChange={(v) => patch({ shippingNotes: v })}
          disabled={!canEdit}
        />
        <Field
          label="Kết thúc cuộc họp (BM03-R28)"
          as="textarea"
          value={minutes.meetingConclusion ?? ""}
          onChange={(v) => patch({ meetingConclusion: v })}
          disabled={!canEdit}
        />
      </section>

      {canEdit ? (
        <div className="flex justify-end">
          <Button disabled={pending} loading={pending} onClick={() => void save()}>
            Lưu biên bản
          </Button>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">Chỉ R&D có thể chỉnh sửa biên bản PTDSP.</p>
      )}
    </Card>
  );
}
