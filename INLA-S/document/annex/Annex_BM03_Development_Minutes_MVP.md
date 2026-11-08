# Annex — Biên bản họp PTDSP (BM03-QT02-LTM)

| | |
|--|--|
| **Mã mẫu khách hàng** | BM03-QT02-LTM |
| **Version annex** | 1.0 |
| **Ngày áp dụng** | 2026-11-06 |
| **Phạm vi** | MVP — 1 biên bản / `workflow_cycle` / quotation |
| **Template** | `document/templates/BM03-QT02-LTM/` |

## 1. Mục đích

Số hóa **biên bản họp phát triển sản phẩm mới** (việc B), tách khỏi **task R&D chi phí** (việc A). Layout UI tham chiếu file Excel trong thư mục template.

## 2. Nguyên tắc

- Dữ liệu Sales/Customer trên biên bản: **read-only** (prefill từ snapshot + `quotation_sales_data`).
- Tiêu chuẩn Bục/Nén/TL/KCG và KCG QA+SX 1–3: **single source** tại `quotation_qa_data` (QA-09…15); màn BM03 **mirror** (không nhập trùng).
- Task R&D (`quotation_rnd_data`): RND-01, RND-02, **RND-11** (phương án sản xuất), RND-05, RND-06 (+ system RND-07…10).
- **RND-11 không nằm trên biên bản BM03** — nhập tại tab task R&D (việc A).
- **Không** lưu ngày đặt bản in / khuôn (RND-03/04 deprecated).

## 3. Field — Meta & thành phần (R&D)

| ID | Label UI | Logic | Kiểu | Bắt buộc (Lưu biên bản) | Ghi chú |
|----|----------|-------|------|---------------------------|---------|
| BM03-M01 | Địa điểm họp | meetingPlace | text | Không | |
| BM03-M02 | Ngày họp | meetingDate | date | Không | |
| BM03-P01 | STT | participants[].seq | int | Có (≥1 dòng nếu có participant) | |
| BM03-P02 | Họ và tên | participants[].fullName | text | Có | |
| BM03-P03 | Bộ phận | participants[].department | text | Có | |
| BM03-P04 | Chức vụ | participants[].jobTitle | text | Không | |

## 4. Field — Nội dung họp (R&D, việc B)

| ID | Label UI (BM03) | Logic | Kiểu | Bắt buộc Complete R&D task |
|----|-----------------|-------|------|----------------------------|
| BM03-R01 | Thiết kế | designNotes | textarea | Không (MVP) |
| BM03-R02 | Thùng mẫu | sampleBoxNotes | textarea | Không |
| BM03-R10 | Hệ màu P{n} | printPlates[].colorSystem | text | Không | n = 1…7 |
| BM03-R11 | Trame P{n} | printPlates[].trame | text | Không | |
| BM03-R12 | Anilox P{n} | printPlates[].anilox | text | Không | |
| BM03-R20 | Bế | finishDieCut | text | Không | |
| BM03-R21 | Dán | finishGlue | text | Không | |
| BM03-R22 | Ghim | finishStaple | text | Không | |
| BM03-R23 | Tạo bóng (UV) | uvCoating | text | Không | |
| BM03-R24 | Cách bó cột | bundlingMethod | textarea | Không | |
| BM03-R25 | Đóng pallet | palletNotes | textarea | Không | |
| BM03-R26 | Vận chuyển/giao hàng | shippingNotes | textarea | Không | |
| BM03-R27 | Khác | otherNotes | textarea | Không | |
| BM03-R28 | Kết thúc cuộc họp | meetingConclusion | textarea | Không | |

Complete task R&D **không** phụ thuộc hoàn thành form BM03 trong MVP (có thể siết rule sau).

## 5. Field — Tiêu chuẩn chất lượng (QA, việc A — hiển thị trên BM03)

Xem **Data Field Spec §4** QA-09…15. Không duplicate trong JSON `development_minutes`.

## 6. API / persistence (tham chiếu triển khai)

- Bảng đề xuất: `quotation_development_minutes` (PK `workflow_cycle_id`), payload JSON hoặc cột flatten theo bảng trên.
- `GET/PUT /quotations/{code}/development-minutes` — role R&D write; các role quotation read theo matrix.

## 7. Acceptance (Annex)

- UI tab **Biên bản PTDSP** layout nhóm section giống template Excel.
- QA section trên BM03 = dữ liệu tab QA (mirror).
- R&D tab chi phí không chứa field BM03-R*.
