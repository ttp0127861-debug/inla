# BM02 → INLA-S field map (Sales request / line items)

Reference: `document/reference/BM02-QT01-BH/`.  
API naming: **camelCase**. DB: **snake_case** trên `quotation_line_items` trừ khi ghi chú khác.

## Ownership (MVP sau BM02)

| Vùng BM02 | Owner nhập (draft) | Owner chuẩn hóa sau Submit |
|-----------|-------------------|---------------------------|
| Mã SP, tên, kích thước, lớp, sóng, SL, giao, ghi chú dòng | **Sales** | RO |
| Bao gói / vận chuyển / % phủ mực | **Sales** (theo BM02) | RO |
| Độ bục / nén / kết cấu giấy chi tiết | **Sales pre-fill** (optional) | **QA** authoritative (`quotation_line_qa`) |
| Đơn giá | — | **EXECUTOR** (`unit_price`) |

## Header (quotation / cycle)

| BM02 | Spec ID | API / DB | Bắt buộc Submit |
|------|---------|----------|-----------------|
| Tên khách hàng | SAL-01 | `customerId` | Có |
| Người liên hệ | SAL-02 | `contactId` | Điều kiện |
| Số …/YCBG | SAL-07 | `quotation_sales_data.customer_request_no` (text) | Không |
| Ghi chú chung footer | SAL-03 | `sales_note` | Không |
| Mô tả in chung | SAL-19 | `printing_description` (cycle) | Không (khuyến nghị Có nếu có in) |

## Bảng 1 — per `quotation_line_items`

| BM02 | Spec ID | Column / API | Kiểu | Submit |
|------|---------|--------------|------|--------|
| STT | LIN-00 | `line_number` | int | System |
| FGCODE | LIN-01a | `fg_code` | text | Không |
| SAPCODE | LIN-01b | `sap_code` | text | Không |
| TÊN SẢN PHẨM | LIN-02 | `item_name` | text | Có |
| Quy cách lọt lòng D×R×C | LIN-04i…06i | `inner_length_mm`, `inner_width_mm`, `inner_height_mm` | numeric | Có * |
| Quy cách phủ bì D×R×C | LIN-04o…06o | `outer_length_mm`, `outer_width_mm`, `outer_height_mm` | numeric | Có * |
| LỚP | LIN-10 | `layer_count` | int | Có |
| SÓNG | LIN-03 | `flute_type` | text | Có |
| Độ bục có driver | SAL-L11a | `burst_with_driver_note` | text | Không |
| Độ bục không driver | SAL-L11b | `burst_without_driver_note` | text | Không |
| Độ nén | SAL-L12 | `compression_strength_note` | text | Không |
| Trọng lượng (gam) | LIN-11 | `product_weight_g` | int | Không |
| Số màu mực | LIN-12 | `print_color_count` | int | Không |
| Kết cấu giấy (text) | SAL-L13 | `paper_structure_note` | text | Không |
| Số lượng | LIN-08 | `quantity` | int | Có |
| Địa điểm giao hàng | LIN-14 | `delivery_location` | text | Không |
| Ghi chú dòng | LIN-09s | `sales_line_note` | text | Không |

\* Submit: bắt buộc **đủ một bộ** (inner **hoặc** outer đủ 3 cạnh > 0); nếu có cả hai thì validate cả hai. Legacy `length_mm`/`width_mm`/`height_mm` = **inner** khi migrate.

## Bảng 2 — per line (`quotation_line_packaging` hoặc cột mở rộng line)

| BM02 | Spec ID | Column / API | Kiểu | Submit |
|------|---------|--------------|------|--------|
| Số thùng/bó | LIN-20 | `units_per_bundle` | int | Không |
| Số bó/pallet | LIN-21 | `bundles_per_pallet` | int | Không |
| Chất pallet & cột đai | LIN-22a | `pallet_stack_strapped` | bool | Không |
| Chất pallet & không cột đai | LIN-22b | `pallet_stack_unstrapped` | bool | Không |
| Cuốn màng co | LIN-23a | `shrink_wrap` | bool | Không |
| Không cuốn màng co | LIN-23b | `no_shrink_wrap` | bool | Không |
| % phủ mực | LIN-24 | `ink_coverage_band` | enum `le_30`\|`le_50`\|`le_70`\|`le_100` | Không |

Validation: tối đa một trong các cặp mutually exclusive (strapped/unstrapped, shrink/no shrink) được chọn “đúng”.

## Deprecated / giữ tương thích

| Cũ | Mới |
|----|-----|
| `length_mm`, `width_mm`, `height_mm` (inner implicit) | Alias read → `inner_*`; write accepts cả hai |
| `item_code` auto SKU | Giữ; hiển thị FGCODE ưu tiên `fg_code` |
| SAL-10…22 single-row trên `quotation_sales_data` | Per-line + header only `sales_note`, `printing_description`, `customer_request_no` |
