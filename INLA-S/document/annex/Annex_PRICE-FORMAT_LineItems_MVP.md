# Annex — Line items & PRICE-FORMAT (EXECUTOR)

| | |
|--|--|
| **Template** | PRICE-FORMAT v1.0 — `document/templates/PRICE-FORMAT/` |
| **Ngày áp dụng** | 2026-11-06 |
| **Thay thế** | Quyết định cũ “Quotation không có line item trong MVP” (Requirement / Business Rules) |

## 1. Mục đích

- Quotation **bắt buộc có line items** (≥ 1 dòng / `workflow_cycle`).
- Bước **Tổng hợp (EXECUTOR)** nhập **Price theo dòng**; layout UI/export tham chiếu `PRICE-FORMAT.xlsx`.
- **Bỏ hẳn EXC-04** Thời gian sản xuất. **Giữ EXC-05** Điều kiện giao hàng và các EXC còn lại (01→03 RO/nhập, 06, 07, 08→11 system).

## 2. Entity `quotation_line_items`

| Thuộc tính | Giá trị |
|------------|--------|
| Scope | `workflow_cycle_id` + `quotation_id` |
| Ordering | `line_number` int ≥ 1 unique per cycle |
| Submit Sales | Tạo/sửa spec dòng (LIN-01a…LIN-24, BM02) khi Draft — xref `BM02-field-map.md` |
| EXECUTOR consolidation | Sửa **LIN-07** `unit_price`, **LIN-09** `line_remark` (theo quyền task) |

### Field dòng (LIN-*)

| ID | Label | Logic column | Kiểu | Bắt buộc Submit (Sales) | Bắt buộc Complete EXC |
|----|-------|--------------|------|-------------------------|------------------------|
| LIN-01 | Mã dòng | item_code | text | Không | — |
| LIN-02 | Tên sản phẩm | item_name | text | Có | — |
| LIN-03 | Kiểu sóng | flute_type | text | Có | — |
| LIN-04 | Chiều dài (mm) | length_mm | numeric | Có | — |
| LIN-05 | Chiều rộng (mm) | width_mm | numeric | Có | — |
| LIN-06 | Chiều cao (mm) | height_mm | numeric | Có | — |
| LIN-07 | Đơn giá / Price | unit_price | numeric VND | — | Có **mỗi dòng** |
| LIN-08 | Số lượng | quantity | int | Có | — |
| LIN-09 | Remark (EXC) | line_remark | text | Không | Không |
| LIN-09s | Ghi chú Sales | sales_line_note | text | Không | — |
| LIN-01a | FGCODE | fg_code | text | Không | — |
| LIN-01b | SAPCODE | sap_code | text | Không | — |
| LIN-04i…06i | Lọt lòng D/R/C (mm) | inner_length_mm, inner_width_mm, inner_height_mm | numeric | Có * | — |
| LIN-04o…06o | Phủ bì D/R/C (mm) | outer_length_mm, outer_width_mm, outer_height_mm | numeric | Có * | — |
| LIN-10 | Lớp | layer_count | int | Có | — |
| LIN-11 | Trọng lượng (gam) | product_weight_g | int | Không | — |
| LIN-12 | Số màu mực | print_color_count | int | Không | — |
| LIN-14 | Địa điểm giao (dòng) | delivery_location | text | Không | — |
| LIN-20…24 | Bao gói / VC / % mực | packaging fields | mixed | Không | — |

\* Ít nhất một bộ inner hoặc outer hợp lệ. Legacy `length_mm` = inner.

### EXC tổng hợp (header task — giữ)

| ID | Thay đổi |
|----|----------|
| EXC-01 | **Per line** → map LIN-07 (không còn một `unit_price_per_piece` duy nhất trên consolidation) |
| EXC-02, EXC-03 | Giữ RO từ R&D (cycle) |
| **EXC-04** | **Xóa** khỏi spec, DB, API, UI |
| **EXC-05** | **Giữ** `delivery_terms` |
| EXC-06, EXC-07 | Giữ |
| EXC-08…11 | Giữ (task/SLA) |

## 3. Quan hệ `quotation_sales_data`

- **Deprecation (MVP):** Một spec carton đơn trên `quotation_sales_data` **thay bằng** line items.
- Sales form (QUO): **bảng dòng** thay cho block kích thước đơn; field SAL-12…22 chuyển **per line** (xref LIN).
- `sales_note`, `delivery_location`, `desired_delivery_time` có thể giữ **header** quotation hoặc cycle (OQ giữ text).

## 4. UI

- Tab **Yêu cầu Sales:** grid BM02 bảng 1 + bảng 2 (CRUD dòng); header Số YCBG.
- Tab **Tổng hợp:** grid giống PRICE-FORMAT (RO: Customer, chi phí R&D cột; nhập: Price, Remark); **EXC-05** textarea/header; không field thời gian sản xuất.
- Export Excel (COULD): đúng header template.

## 5. Acceptance

- Submit quotation: ≥ 1 line item hợp lệ.
- Complete `executor_consolidation`: mỗi dòng có `unit_price` ≥ 0; EXC-05 có thể tùy chọn theo rule cũ; attachment EXC-07; **không** validate production lead time.
