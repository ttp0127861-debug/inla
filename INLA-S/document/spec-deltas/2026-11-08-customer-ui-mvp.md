# Spec delta — Customer Management UI (Frontend MVP)

| | |
|--|--|
| **Ngày** | 2026-11-08 |
| **Nguồn UI** | `frontend/src/pages/customer/CustomerPages.tsx`, `frontend/src/api/customers.ts`, `frontend/src/lib/vietnamProvinces.ts`, `frontend/src/lib/phoneVN.ts` |
| **Routes** | `frontend/src/App.tsx` (`/customers/*`) |

Cập nhật baseline `Customer_Management_Specification_Quotation_Management_MVP.md` và `Screen_Inventory_Quotation_Management_MVP.md` §7. Không đổi quotation domain.

---

## 1. Customer_Management_Specification — thay đổi chính

### §5 Customer Data — CUS-05, CUS-06, CUS-04, CUS-08

| ID | Thay đổi |
|----|----------|
| CUS-04 | MST: **10 hoặc 13 chữ số** (`/^\d{10}$|^\d{13}$/`). UNIQUE toàn hệ thống (**đã chốt** — DB + API 409). |
| CUS-05 | Lưu chuẩn **`+84` + 8–11 chữ số**; UI nhập dạng VN, blur chuẩn hóa. |
| CUS-06 | Label form: **Email công ty**; vẫn **bắt buộc** khi Lưu (backend `NOT NULL`); format email khi có giá trị. |
| CUS-08 | **Combobox** đóng danh sách 63 tỉnh/thành (`PROVINCE_OPTIONS`); không nhập tự do. Cột DB vẫn `text`. |

### §9.2 Danh sách

- **Tìm kiếm (`q`):** placeholder gồm tên, MST, SĐT, email — backend hiện chỉ ILIKE name/code/tax_id/email (**SĐT: gap API**, không phải DB).
- **Lọc:** Loại KH, Tỉnh/TP (combobox), Trạng thái; nút **Lọc** / **Đặt lại**.
- **Cột:** Mã KH, Tên, Loại, MST, SĐT, Email, Tỉnh/TP, Trạng thái (icon), Hành động (**chỉ Xem**).
- **Không có** trên list: Sửa, Ngừng hoạt động, số Contact, Sales liên quan, phân trang UI (tải `pageSize` 100).

### §9.1 / §11 Tạo & Chi tiết

- Form **CollapsibleSection**: *Thông tin khách hàng*; *Người liên hệ* (chỉ **Tạo** + **Doanh nghiệp**).
- **Tạo Doanh nghiệp:** contact inline tùy chọn tại save; chỉ validate dòng đã nhập; thông báo info: báo giá cần ≥1 contact active.
- **SALES tạo KH:** hiển thị read-only *Sales phụ trách*; backend auto-relation.
- **ADMIN:** checkbox *Nhân viên Sales liên quan* (create + edit).
- **Chi tiết:** header (mã · loại, tên, badge trạng thái), **Sửa thông tin**, **Tạo báo giá**; tabs có count: Thông tin, Người liên hệ, Sales liên quan, Báo giá, Lịch sử thay đổi.
- **Ngừng hoạt động KH:** route modal `/deactivate`; **ADMIN only** (khớp API).
- **Contact tab:** chỉ **active** trên bảng; modal Tạo/Sửa; *Vai trò liên hệ* = select (chính/phụ).

### §17 Open Details — chốt một phần

| Open ID | Trạng thái |
|---------|------------|
| CM-O01 | **Chốt:** UNIQUE `tax_id`. |
| CM-O06 | **Chốt:** Cho lưu Doanh nghiệp không contact tại create; contact inline hoặc tab sau. |
| CM-O08 | **Chốt (UI):** master cố định trong `vietnamProvinces.ts`; chưa có bảng DB. |
| CM-O09 | **Chốt (UI/API):** phone `+84…`; MST 10/13. |
| CM-O02 | **Một phần:** Thêm/gỡ Sales trên KH đã tồn tại = **ADMIN**; SALES chỉ auto-relation khi tạo. |

---

## 2. Screen_Inventory §7 — bổ sung route/modal

| Screen | Route / ghi chú |
|--------|-----------------|
| CUS-01 | `/customers` |
| CUS-02 | `/customers/new` |
| CUS-03 | `/customers/:code/edit` |
| CUS-04 | `/customers/:code` (tab Thông tin, `end`) |
| CUS-05 | `/customers/:code/contacts` |
| CUS-06 | `/customers/:code/contacts/new`, `.../contacts/:id/edit` (modal) |
| CUS-07 | `/customers/:code/sales` |
| CUS-08 | `/customers/:code/quotes` |
| CUS-09 | `/customers/:code/history` |
| (mới) | `/customers/:code/deactivate`, `.../contacts/:id/deactivate` (modal xác nhận) |

---

## 3. Backend / DB (không thuộc spec UI — giao DB agent)

- Schema cột **đã khớp** `CustomerInput` / `ContactInput`.
- Khuyến nghị: CHECK `tax_id`, `phone`; index tìm kiếm `phone`; partial unique `is_primary` (active); cập nhật `SCHEMA.md` province + validation.
