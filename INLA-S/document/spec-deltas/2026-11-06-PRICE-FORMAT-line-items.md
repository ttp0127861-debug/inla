# Spec delta — Line items + PRICE-FORMAT (EXECUTOR)

| | |
|--|--|
| **Ngày** | 2026-11-06 |
| **Template** | `document/templates/PRICE-FORMAT/` v1.0 |
| **Annex** | `document/annex/Annex_PRICE-FORMAT_LineItems_MVP.md` |

Áp dung vào file **`.md` baseline** (Baseline 0.2+). **Ghi đè** các câu “không line item trong MVP”.

---

## 1. Data_Field_Specification_Quotation_Management_MVP.md

### §3 Sales / QUO — **THAY ĐỔI LỚN**

- **Bắt buộc line items:** ≥ 1 dòng / cycle; field SAL kích thước/sóng/số lượng **theo dòng** (LIN-01…08, xref annex).
- Deprecate mô hình **một** bộ SAL-11…22 duy nhất trên `quotation_sales_data` → chuyển sang `quotation_line_items` (Annex).

### §6.2 EXECUTOR Tổng hợp — **SỬA**

| Hành động | ID | Chi tiết |
|-----------|-----|----------|
| **XÓA** | **EXC-04** | Thời gian sản xuất / `productionLeadTime` — bỏ label, logic, validation |
| **GIỮ** | EXC-05 | Điều kiện giao hàng / `deliveryTerms` |
| **ĐỔI** | EXC-01 | Đơn giá **theo line item** (`unit_price` trên `quotation_line_items`), không còn single `unitPricePerPiece` trên consolidation |
| **GIỮ** | EXC-02, EXC-03 | RO chi phí R&D (cycle) |
| **GIỮ** | EXC-06, EXC-07, EXC-08…11 | |

### § mới — Tham chiếu Annex PRICE-FORMAT

- Trỏ `document/annex/Annex_PRICE-FORMAT_LineItems_MVP.md`.

---

## 2. Business_Rules_Quotation_Management_MVP.md

- Submit quotation: validate **≥ 1 line item**; mỗi dòng đủ LIN bắt buộc Sales.
- Complete executor consolidation: **mỗi dòng** `unit_price` ≥ 0; **không** rule production lead time; giữ attachment + EXC-05 optional như baseline cũ.
- Gỡ rule/messaging liên quan EXC-04.

---

## 3. Requirement_Summary / MVP_Feature_List

- **Sửa:** “Quotation không line item” → **Có line items** (PRICE-FORMAT).
- Feature: grid Sales + grid EXECUTOR tổng hợp; template PRICE-FORMAT.

---

## 4. Screen_Inventory / UI_Workflow

- QUO Sales: **Line items grid** (QUO-008).
- QUO Consolidation: layout cột theo PRICE-FORMAT; field **Điều kiện giao hàng** (EXC-05); **xóa** màn/field thời gian sản xuất.

---

## 5. Workflow_State_Machine / Role_Permission

- Không đổi state; EXC quyền giữ; line items Sales C/E, EXC sửa price/remark dòng.

---

## 6. Open_Questions

- Đóng hoặc sửa OQ-QUO-06 (production lead time) → **Cancelled / removed with EXC-04**.

---

## 7. DB / Backend / Frontend (trace only — implement sau)

- Bảng `quotation_line_items`; drop `production_lead_time` từ consolidation; migration sales payload — xem `backend/db/repo/document-index.md`.

---

## Checklist gộp vào Markdown

- [ ] Data Field — LIN + EXC changes
- [ ] Business Rules — submit/complete line items
- [ ] Requirement + MVP — line items yes
- [ ] Screen Inventory + UI Workflow — grids
- [ ] Gỡ EXC-04 mọi nơi
