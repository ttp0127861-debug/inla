import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/DataTable";
import { REPORT_DEPARTMENT_OPTIONS, type ReportFilterState, type ReportFilterVariant } from "./reportConstants";

const selectClass =
  "h-[42px] w-full rounded-[4px] border border-[#d1d5db] bg-white px-3 text-[13px] text-[#111827] disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#9ca3af]";

function FilterSelect({
  label,
  value,
  options,
  onChange,
  unsupported,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  unsupported?: boolean;
}) {
  return (
    <label
      className="flex flex-col gap-2 text-xs font-medium text-[#374151]"
      title={unsupported ? "Chưa hỗ trợ" : undefined}
    >
      {label}
      <select
        className={selectClass}
        value={value}
        disabled={unsupported}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateRange({
  fromDate,
  toDate,
  onChange,
}: {
  fromDate: string;
  toDate: string;
  onChange: (patch: Partial<Pick<ReportFilterState, "fromDate" | "toDate">>) => void;
}) {
  return (
    <div className="flex flex-col gap-2 text-xs font-medium text-[#374151]">
      Khoảng thời gian
      <div className="flex items-center gap-2">
        <input
          type="date"
          className={selectClass}
          value={fromDate}
          onChange={(event) => onChange({ fromDate: event.target.value })}
        />
        <span className="shrink-0 text-xs text-[#756e68]">đến</span>
        <input
          type="date"
          className={selectClass}
          value={toDate}
          onChange={(event) => onChange({ toDate: event.target.value })}
        />
      </div>
    </div>
  );
}

type ReportFiltersProps = {
  variant: ReportFilterVariant;
  role: string;
  value: ReportFilterState;
  onChange: (next: ReportFilterState) => void;
  onApply: () => void;
  loading?: boolean;
};

export function ReportFilters({ variant, role, value, onChange, onApply, loading }: ReportFiltersProps) {
  const patch = (partial: Partial<ReportFilterState>) => onChange({ ...value, ...partial });
  const showSalesStaff = variant === "business" && (role === "ADMIN" || role === "DIRECTOR");
  const showDepartment = (variant === "ops" && role !== "SALES") || variant === "departments";

  return (
    <Card className="mb-6 p-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end">
        <DateRange fromDate={value.fromDate} toDate={value.toDate} onChange={patch} />

        {variant === "ops" ? (
          <>
            <FilterSelect
              label="Trạng thái quy trình"
              value={value.workflowStatus}
              onChange={(workflowStatus) => patch({ workflowStatus })}
              unsupported
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "new", label: "Mới tạo" },
                { value: "processing", label: "Đang xử lý" },
                { value: "approval", label: "Chờ phê duyệt" },
              ]}
            />
            {showDepartment ? (
              <FilterSelect
                label="Phòng ban"
                value={value.department}
                onChange={(department) => patch({ department })}
                options={REPORT_DEPARTMENT_OPTIONS}
              />
            ) : (
              <div className="hidden lg:block" />
            )}
            <FilterSelect
              label="Loại vòng"
              value={value.cycleType}
              onChange={(cycleType) => patch({ cycleType })}
              unsupported
              options={[
                { value: "all", label: "Tất cả loại vòng" },
                { value: "new", label: "Tạo mới" },
                { value: "resubmit", label: "Gửi lại" },
              ]}
            />
          </>
        ) : null}

        {variant === "business" ? (
          <>
            <FilterSelect
              label="Kết quả"
              value={value.outcome}
              onChange={(outcome) => patch({ outcome })}
              unsupported
              options={[
                { value: "all", label: "Tất cả kết quả" },
                { value: "won", label: "Thành công" },
                { value: "lost", label: "Thất bại" },
                { value: "sent", label: "Đã gửi" },
              ]}
            />
            {showSalesStaff ? (
              <FilterSelect
                label="Nhân viên kinh doanh"
                value={value.salesStaff}
                onChange={(salesStaff) => patch({ salesStaff })}
                unsupported
                options={[
                  { value: "all", label: "Tất cả nhân viên" },
                  { value: "nma", label: "Nguyễn Minh Anh" },
                  { value: "tht", label: "Trần Hoài Thu" },
                ]}
              />
            ) : (
              <div className="hidden lg:block" />
            )}
            <FilterSelect
              label="Nhóm khách hàng"
              value={value.customerGroup}
              onChange={(customerGroup) => patch({ customerGroup })}
              unsupported
              options={[
                { value: "all", label: "Tất cả nhóm" },
                { value: "fmcg", label: "FMCG" },
                { value: "industrial", label: "Công nghiệp" },
              ]}
            />
          </>
        ) : null}

        {variant === "departments" ? (
          <>
            <FilterSelect
              label="Phòng ban"
              value={value.department}
              onChange={(department) => patch({ department })}
              options={REPORT_DEPARTMENT_OPTIONS}
            />
            <FilterSelect
              label="Tình trạng SLA"
              value={value.slaStatus}
              onChange={(slaStatus) => patch({ slaStatus })}
              unsupported
              options={[
                { value: "all", label: "Tất cả tình trạng" },
                { value: "ok", label: "Đúng hạn" },
                { value: "late", label: "Trễ hạn" },
              ]}
            />
            <FilterSelect
              label="Công đoạn"
              value={value.stage}
              onChange={(stage) => patch({ stage })}
              unsupported
              options={[
                { value: "all", label: "Tất cả công đoạn" },
                { value: "intake", label: "Tiếp nhận" },
                { value: "approval", label: "Phê duyệt" },
              ]}
            />
          </>
        ) : null}

        {variant === "resubmit" ? (
          <>
            <FilterSelect
              label="Nguồn kích hoạt"
              value={value.triggerSource}
              onChange={(triggerSource) => patch({ triggerSource })}
              unsupported
              options={[
                { value: "all", label: "Tất cả nguồn" },
                { value: "customer", label: "Khách hàng yêu cầu" },
                { value: "internal", label: "Nội bộ phát hiện" },
              ]}
            />
            <FilterSelect
              label="Người phụ trách"
              value={value.assignee}
              onChange={(assignee) => patch({ assignee })}
              unsupported
              options={[
                { value: "all", label: "Tất cả nhân viên" },
                { value: "sales", label: "Sales phụ trách" },
                { value: "executor", label: "Người xử lý" },
              ]}
            />
            <FilterSelect
              label="Trạng thái hiện tại"
              value={value.currentStatus}
              onChange={(currentStatus) => patch({ currentStatus })}
              unsupported
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "open", label: "Đang xử lý" },
                { value: "done", label: "Đã hoàn thành" },
              ]}
            />
          </>
        ) : null}

        <div className="flex items-end lg:justify-end">
          <Button type="button" onClick={onApply} loading={loading} className="min-w-[96px]">
            Áp dụng
          </Button>
        </div>
      </div>
    </Card>
  );
}
