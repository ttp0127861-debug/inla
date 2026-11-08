import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { homeFor } from "../../auth/cognito";
import { Button } from "../../components/ui/Button";
import { Card, PageTitle } from "../../components/ui/DataTable";
import { Dropzone } from "../../components/ui/Dropzone";
import { Field } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { CustomerListPage } from "../customer/CustomerPages";
import { QuoteApprovalPage, QuoteRequestPage } from "../quotation/QuotePages";

export function SharedIndexPage() {
  const links = [
    ["/shared/loading", "SHR-12 Đang tải"],
    ["/shared/empty", "SHR-13 Trống"],
    ["/shared/validation", "SHR-14 Lỗi xác thực"],
    ["/shared/forbidden", "SHR-15 Không có quyền"],
    ["/shared/not-found", "SHR-16 Không tìm thấy"],
    ["/shared/upload", "SHR-10 Upload"],
    ["/shared/preview", "SHR-11 Xem trước PDF"],
    ["/shared/conflict", "SHR-17 Xung đột dữ liệu"],
    ["/shared/cancel", "Hủy báo giá"],
    ["/shared/outcome", "SHR-06 Kết quả kinh doanh"],
    ["/shared/resubmit-reason", "SHR-07 Lý do gửi lại"],
    ["/quotations/BG-2026-001/send", "SHR-01 Gửi xử lý"],
    ["/shared/complete", "SHR-03 Hoàn thành task"],
    ["/shared/approve", "SHR-04 Phê duyệt"],
    ["/shared/reject", "SHR-05 Từ chối"],
    ["/shared/deactivate", "SHR-08 Ngừng hoạt động"],
    ["/shared/toasts", "SHR-09 Toast"],
  ];
  return (
    <>
      <PageTitle title="Trạng thái và hộp thoại dùng chung" kicker="SHR" />
      <div className="grid gap-3 md:grid-cols-2">
        {links.map(([to, label]) => (
          <Link key={to} to={to} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium">
            {label}
          </Link>
        ))}
      </div>
    </>
  );
}

export function LoadingPage() {
  return (
    <>
      <PageTitle kicker="SHR-12 · Trạng thái tải" title="Danh sách báo giá" />
      <p className="mb-4 text-sm">Dữ liệu đang được tải, vui lòng chờ trong giây lát.</p>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded bg-[#efe7e0]" />
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold tracking-wide text-[var(--color-text-muted)]">ĐANG TẢI DỮ LIỆU</p>
    </>
  );
}

export function EmptyPage() {
  return (
    <div className="grid min-h-[420px] place-items-center text-center">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold">Không có dữ liệu</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Chưa có bản ghi nào trong danh sách này.</p>
      </div>
    </div>
  );
}

export function ValidationPage() {
  return (
    <>
      <PageTitle kicker="SHR-14 · Kiểm tra dữ liệu" title="Thông tin liên hệ" />
      <p className="mb-4 text-sm">Vui lòng kiểm tra và hoàn thiện các thông tin bên dưới.</p>
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Họ và tên" required error="Vui lòng nhập thông tin bắt buộc" />
          <Field label="Email" value="nguyenvana@inla.vn" />
          <Field label="Số điện thoại" value="0901 234 567" />
          <Field label="Chức vụ" value="Trưởng phòng Kinh doanh" />
        </div>
        <div className="mt-6 flex justify-end"><Button>Lưu</Button></div>
      </Card>
    </>
  );
}

export function ForbiddenPage() {
  const { user } = useAuth();
  return (
    <div className="grid min-h-[420px] place-items-center text-center">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl leading-8 font-bold text-[var(--color-brand-primary)]">Không có quyền</h1>
        <p className="mt-2 text-sm leading-5 text-[var(--color-text-muted)]">Bạn không có quyền thực hiện thao tác hoặc xem nội dung này.</p>
        <div className="mt-6"><Button to={homeFor(user?.groups ?? [])}>Về trang chủ</Button></div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="grid min-h-[420px] place-items-center text-center">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl font-bold">Không tìm thấy dữ liệu</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Bản ghi bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
        <div className="mt-6"><Button to="/dashboard">Về trang chủ</Button></div>
      </div>
    </div>
  );
}

export function UploadStatesPage() {
  return (
    <>
      <PageTitle kicker="SHR-10 · Upload/Dropzone" title="Trạng thái tải tệp" />
      <div className="grid gap-4">
        <Card><p className="mb-3 text-sm font-semibold">01 · Mặc định</p><Dropzone /></Card>
        <Card><p className="mb-3 text-sm font-semibold">02 · Đang tải lên</p><Dropzone state="uploading" /></Card>
        <Card><p className="mb-3 text-sm font-semibold">03 · Đã tải lên</p><Dropzone state="done" /></Card>
        <Card><p className="mb-3 text-sm font-semibold">04 · Lỗi</p><Dropzone state="error" /><div className="mt-3"><Button>Chọn tệp</Button></div></Card>
      </div>
    </>
  );
}

export function PreviewPage() {
  return (
    <>
      <PageTitle title="Trình xuất bản & xem trước báo giá" />
      <Card className="mx-auto max-w-[720px]">
        <p className="text-center text-xs font-bold tracking-wide">CÔNG TY CỔ PHẦN BAO BÌ VÀ GIẢI PHÁP ĐÓNG GÓI INLA</p>
        <h2 className="mt-4 text-center font-[family-name:var(--font-serif)] text-2xl font-bold">BÁO GIÁ</h2>
        <p className="mt-2 text-sm">Kính gửi: Công ty CP Thực phẩm Á Châu</p>
        <p className="text-sm">Ngày báo giá: 14/10/2026 · BG-2026-001</p>
        <table className="mt-4 w-full text-sm">
          <thead><tr className="border-b"><th className="py-2 text-left">Hạng mục</th><th>Số lượng</th><th className="text-right">Thành tiền</th></tr></thead>
          <tbody>
            <tr><td className="py-2">Thùng carton 5 lớp</td><td className="text-center">25.000</td><td className="text-right">425.000.000</td></tr>
          </tbody>
        </table>
      </Card>
    </>
  );
}

export function ConflictPage() {
  return (
    <>
      <PageTitle title="Chỉnh sửa báo giá nháp" kicker="BG-2026-001 · Bản nháp" />
      <Card>
        <Field label="Tên báo giá" value="Thùng carton thực phẩm tháng 10" />
        <div className="mt-4"><Field label="Số lượng dự kiến" value="25.000 sản phẩm" /></div>
      </Card>
      <Modal title="Dữ liệu đã bị thay đổi" closeTo="/quotations/BG-2026-001">
        <p className="text-sm">Người khác đã cập nhật dữ liệu này trong khi bạn đang chỉnh sửa.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/quotations/BG-2026-001" variant="text">Đóng</Button>
          <Button to="/quotations/BG-2026-001">Tải lại</Button>
        </div>
      </Modal>
    </>
  );
}

export function CancelQuotePage() {
  return (
    <>
      <QuoteRequestPage />
      <Modal title="Xác nhận hủy báo giá" closeTo="/quotations/BG-2026-001">
        <p className="text-sm">Xác nhận chuyển báo giá nháp này sang trạng thái Đã hủy (CANCELLED)? Thao tác này không thể hoàn tác và báo giá đã hủy không thể gửi lại (Re-submit).</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/quotations/BG-2026-001" variant="text">Quay lại</Button>
          <Button to="/quotations" variant="error">Hủy báo giá</Button>
        </div>
      </Modal>
    </>
  );
}

export function ApprovePage() {
  return (
    <>
      <QuoteApprovalPage />
      <Modal title="Xác nhận phê duyệt" closeTo="/quotations/BG-2026-001/approval">
        <p className="text-sm">Xác nhận phê duyệt báo giá này? Báo giá sẽ chuyển sang trạng thái đã phê duyệt.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/quotations/BG-2026-001/approval" variant="text">Hủy</Button>
          <Button to="/quotations/BG-2026-001">Phê duyệt</Button>
        </div>
      </Modal>
    </>
  );
}

export function RejectPage() {
  return (
    <>
      <QuoteApprovalPage />
      <Modal title="Từ chối phê duyệt" closeTo="/quotations/BG-2026-001/approval">
        <Field label="Lý do từ chối" required as="textarea" placeholder="Nhập lý do từ chối" />
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/quotations/BG-2026-001/approval" variant="text">Hủy</Button>
          <Button to="/quotations/resubmit" variant="error">Từ chối</Button>
        </div>
      </Modal>
    </>
  );
}

export function CompleteTaskPage() {
  return (
    <>
      <QuoteRequestPage />
      <Modal title="Xác nhận hoàn thành công việc" closeTo="/tasks">
        <p className="text-sm">Dữ liệu và tệp đính kèm của phòng ban trong vòng xử lý này sẽ được khóa sau khi hoàn thành.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/tasks" variant="text">Quay lại</Button>
          <Button to="/tasks">Hoàn thành</Button>
        </div>
      </Modal>
    </>
  );
}

export function OutcomePage() {
  return (
    <>
      <QuoteRequestPage />
      <Modal title="Cập nhật kết quả kinh doanh" closeTo="/quotations/BG-2026-001">
        <div className="flex flex-col gap-2 text-sm">
          {["Đã gửi khách hàng", "Thành công (Won)", "Thất bại (Lost)"].map((item) => (
            <label key={item} className="flex items-center gap-2"><input type="radio" name="outcome" /> {item}</label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/quotations/BG-2026-001" variant="text">Hủy</Button>
          <Button to="/quotations/BG-2026-001">Lưu</Button>
        </div>
      </Modal>
    </>
  );
}

export function ResubmitReasonPage() {
  return (
    <>
      <QuoteRequestPage />
      <Modal title="Nhập lý do gửi lại" closeTo="/quotations/resubmit">
        <Field label="Lý do gửi lại" required as="textarea" placeholder="Mô tả nội dung đã điều chỉnh" />
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/quotations/resubmit" variant="text">Hủy</Button>
          <Button to="/quotations/resubmit">Tiếp tục</Button>
        </div>
      </Modal>
    </>
  );
}

export function DeactivatePage() {
  return (
    <>
      <CustomerListPage />
      <Modal title="Xác nhận ngừng hoạt động" closeTo="/customers">
        <p className="text-sm">Khách hàng sẽ chuyển sang trạng thái Ngừng hoạt động và không được chọn khi tạo báo giá mới.</p>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">Luồng thật: mở từ Sửa khách hàng tại đường dẫn /customers/:code/deactivate (chỉ ADMIN).</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/customers" variant="text">Hủy</Button>
          <Button to="/customers" variant="error">Ngừng hoạt động</Button>
        </div>
      </Modal>
    </>
  );
}

export function ToastPage() {
  return (
    <>
      <PageTitle title="Danh sách khách hàng" aside={<Button to="/customers/new">+ Tạo khách hàng</Button>} />
      <div className="fixed right-6 bottom-6 z-50 w-[320px] rounded-[var(--radius-md)] bg-[var(--color-text-strong)] px-4 py-3 text-sm text-white shadow-[var(--shadow-lg)]">
        Đã lưu khách hàng KH-000128.
        <Link to="/customers" className="mt-2 block font-semibold text-[#bfdbfe]">Xem danh sách</Link>
      </div>
    </>
  );
}
