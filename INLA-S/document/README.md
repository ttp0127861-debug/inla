# INLA-S — Tài liệu nghiệp vụ (Markdown)

**Source of truth:** các file `*.md` ở thư mục gốc `document/` (đã chuyển từ Word, 2026-11-06).

## Baseline spec

| File | Mô tả |
|------|--------|
| [Requirement_Summary_Quotation_Management_MVP.md](Requirement_Summary_Quotation_Management_MVP.md) | Tóm tắt MVP |
| [MVP_Feature_List_Quotation_Management.md](MVP_Feature_List_Quotation_Management.md) | Feature list |
| [Data_Field_Specification_Quotation_Management_MVP.md](Data_Field_Specification_Quotation_Management_MVP.md) | Field SAL/QA/RND/EXC/… |
| [Business_Rules_Quotation_Management_MVP.md](Business_Rules_Quotation_Management_MVP.md) | Business rules |
| [Workflow_State_Machine_Quotation_Management_MVP.md](Workflow_State_Machine_Quotation_Management_MVP.md) | State machine |
| [Role_Permission_Matrix_Quotation_Management_MVP.md](Role_Permission_Matrix_Quotation_Management_MVP.md) | Phân quyền |
| [Screen_Inventory_Quotation_Management_MVP.md](Screen_Inventory_Quotation_Management_MVP.md) | Màn hình |
| [UI_Workflow_Quotation_Management_MVP.md](UI_Workflow_Quotation_Management_MVP.md) | UI workflow |
| [SLA_Alert_Specification_Quotation_Management_MVP.md](SLA_Alert_Specification_Quotation_Management_MVP.md) | SLA |
| [Customer_Management_Specification_Quotation_Management_MVP.md](Customer_Management_Specification_Quotation_Management_MVP.md) | Customer |
| [Open_Questions_Assumptions_Quotation_Management_MVP.md](Open_Questions_Assumptions_Quotation_Management_MVP.md) | OQ / assumptions |

## Cập nhật chưa gộp vào baseline (apply thủ công hoặc PR riêng)

| Delta / Annex | Nội dung |
|---------------|----------|
| [spec-deltas/2026-11-06-BM03-qa-rnd-split.md](spec-deltas/2026-11-06-BM03-qa-rnd-split.md) | BM03, QA-09…15, RND-11, bỏ RND-03/04 |
| [spec-deltas/2026-11-06-PRICE-FORMAT-line-items.md](spec-deltas/2026-11-06-PRICE-FORMAT-line-items.md) | Line items, bỏ EXC-04, PRICE-FORMAT |
| [spec-deltas/2026-11-08-BM02-sales-request-form.md](spec-deltas/2026-11-08-BM02-sales-request-form.md) | Form Sales theo BM02-QT01-BH |
| [annex/](annex/) | BM03, PRICE-FORMAT, **BM02-field-map** |
| [reference/BM02-QT01-BH/](reference/BM02-QT01-BH/) | Ảnh + catalog biểu mẫu khách YCBG |

Sau khi gộp delta vào file baseline tương ứng, có thể xóa hoặc archive mục trong `spec-deltas/`.

## Template khách hàng

[index templates/README.md](templates/README.md)

- [BM03-QT02-LTM](templates/BM03-QT02-LTM/) — R&D biên bản  
- [PRICE-FORMAT](templates/PRICE-FORMAT/) — EXECUTOR báo giá  

## Mô hình dữ liệu (tóm tắt sau BM03 + line items)

```text
quotation_line_items        → Sales + EXC price per dòng
quotation_qa_data           → QA task (+ QA-09…15 khi gộp delta)
quotation_rnd_data          → R&D task (RND-01, 02, 11, 05, 06)
quotation_development_minutes → BM03 việc B
quotation_executor_consolidation → EXC-05, note, task (không EXC-04)
```

## Traceability code

- DB: [backend/db/repo/document-index.md](../backend/db/repo/document-index.md)
