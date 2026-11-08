# Spec delta — BM02 Yêu cầu báo giá (Sales form)

| | |
|--|--|
| **Ngày** | 2026-11-08 |
| **Reference** | `document/reference/BM02-QT01-BH/` |
| **Field map** | `document/annex/BM02-field-map.md` |

Áp dụng vào: Data Field §3, Annex PRICE-FORMAT, Screen Inventory QUO-02, Business Rules Submit Sales.

---

## 1. Data_Field_Specification — THÊM / ĐỔI

### §3.1 Header
- **SAL-07** `customerRequestNo` — Số …/YCBG (text, optional).

### §3.2 Line items (thay block SAL-10…22 đơn)
- Chuyển **toàn bộ** spec carton theo **dòng** (LIN-01a … LIN-24); xref `BM02-field-map.md`.
- **Submit:** ≥1 dòng; mỗi dòng: `item_name`, `flute_type`, `layer_count`, `quantity`; kích thước **inner hoặc outer** đủ 3 cạnh.
- **SAL-19** `printing_description` giữ **mức cycle** (mô tả in chung).

### §3.3 QA overlap (không duplicate nhập)
- Sales có thể pre-fill `burst_with_driver_note`, `burst_without_driver_note`, `compression_strength_note`, `paper_structure_note` trên line.
- Task QA vẫn là nguồn chính thức (`quotation_line_qa`); nếu Sales đã nhập, QA mở form với giá trị copy (app rule).

---

## 2. Business Rules
- Submit Sales: validate grid BM02 bảng 1 + 2 theo bảng “Submit” trong field map.
- Không yêu cầu QA fields đầy đủ tại Submit Sales.

---

## 3. Screen Inventory
- **QUO-02** Tạo/Sửa nháp: layout 2 section grid (Bảng 1 + Bảng 2) theo BM02; header SAL-07.

---

## 4. Traceability
- DB: migration mở rộng `quotation_line_items` + enum `ink_coverage_band`.
- API: `CreateQuotationBody` / `LineItem` camelCase mới.
- UI: `LineItemsEditor` → `Bm02LineItemsEditor` (hoặc mở rộng).
