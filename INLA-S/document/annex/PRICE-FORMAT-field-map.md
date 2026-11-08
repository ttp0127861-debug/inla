# PRICE-FORMAT — Field map (Excel → INLA-S)

**Template:** `document/templates/PRICE-FORMAT/PRICE-FORMAT.xlsx` v1.0 (2026-11-06)

| Cột Excel | Field ID | Storage | Owner | Ghi chú |
|-----------|----------|---------|-------|---------|
| Item code | LIN-01 | `quotation_line_items.item_code` | Sales (draft) / System | Có thể = mã dòng hoặc tham chiếu nội bộ |
| Item name | LIN-02 | `item_name` | Sales | Tên sản phẩm / quy cách ngắn |
| Customer | — | RO | Snapshot quotation | Không lưu lặp trên dòng |
| Flute | LIN-03 | `flute_type` | Sales | |
| Length | LIN-04 | `length_mm` | Sales | |
| Width | LIN-05 | `width_mm` | Sales | |
| Height | LIN-06 | `height_mm` | Sales | |
| **Price** | **LIN-07 / EXC-01** | `unit_price` | **EXECUTOR** | Đơn giá 1 thùng **theo dòng** |
| Die cut mold cost | EXC-03 | RO | R&D → hiển thị | Cycle-level `quotation_rnd_data.die_cost`; export có thể lặp cột |
| Printing plate cost | EXC-02 | RO | R&D | Cycle-level `printing_plate_cost` |
| Qty | LIN-08 | `quantity` | Sales | |
| Remark | LIN-09 | `line_remark` | EXECUTOR (hoặc Sales) | Ưu tiên EXECUTOR tại tổng hợp |

**Cấp quotation / cycle (không phải cột từng dòng):**

| Spec | Field | Ghi chú |
|------|-------|---------|
| **EXC-05** | `delivery_terms` | `quotation_executor_consolidation` — **giữ** |
| EXC-06 | `consolidation_note` | Ghi chú chung tổng hợp |
| EXC-07 | attachments | Task tổng hợp |
| ~~EXC-04~~ | ~~production_lead_time~~ | **Removed** 2026-11-06 |
