# BM03-QT02-LTM — Field map (Excel → INLA-S)

**Mã mẫu:** BM03-QT02-LTM v1.0 (2026-11-06)  
**Template:** `document/templates/BM03-QT02-LTM/BM03-QT02-LTM_Bien_ban_hop_PTDSP.xlsx`

| Ô / nhóm trên BM03 | Field ID | Storage | Owner nhập | Ghi chú |
|--------------------|----------|---------|------------|---------|
| Mã tài liệu (header) | — | RO | System | Hiển thị cố định BM03-QT02-LTM |
| Địa điểm, ngày họp | BM03-M01, BM03-M02 | `development_minutes` | R&D | |
| I. Thành phần tham dự (bảng) | BM03-P01… | `participants[]` | R&D | seq, fullName, department, jobTitle |
| Khách hàng | — | RO | Sales/Customer | Snapshot quotation |
| Sản phẩm | — | RO | Sales | `quotation_sales_data` |
| Quy cách (mm) | — | RO | Sales | D/R/C |
| Số lớp/sóng | — | RO | Sales | layer, flute |
| Thiết kế | BM03-R01 | minutes | R&D | |
| Tiêu chuẩn: Bục | QA-09 | `quotation_qa_data` | QA | Tab QA + mirror BM03 |
| Tiêu chuẩn: Nén | QA-10 | `quotation_qa_data` | QA | |
| Tiêu chuẩn: TL | QA-11 | `quotation_qa_data` | QA | |
| Tiêu chuẩn: KCG | QA-12 | `quotation_qa_data` | QA | |
| KCG QA+SX đề xuất 1/2/3 | QA-13, QA-14, QA-15 | `quotation_qa_data` | QA | 3 dòng text |
| Thùng mẫu | BM03-R02 | minutes | R&D | |
| In ấn P1–P7 (Hệ màu / Trame / Anilox) | BM03-R10… | `printPlates[]` | R&D | plateNo 1–7 |
| Loại thùng: Bế / Dán / Ghim | BM03-R20… | minutes | R&D | |
| Tạo bóng (UV) | BM03-R23 | minutes | R&D | |
| Đóng gói / bảo quản / vận chuyển | BM03-R24… | minutes | R&D | |
| Khác | BM03-R27 | minutes | R&D | |
| Kết thúc cuộc họp | BM03-R28 | minutes | R&D | |
| Chữ ký SX / R&D / QA / BGĐ | — | Ngoài app MVP | — | In giấy hoặc upload scan (optional) |
| Chi phí bản in | RND-01 | `quotation_rnd_data` | R&D | **Task R&D (việc A)** |
| Chi phí khuôn bế | RND-02 | `quotation_rnd_data` | R&D | **Task R&D (việc A)** |
| **Phương án sản xuất** (chuỗi bước `>`) | **RND-11** | `quotation_rnd_data` | R&D | Yêu cầu khách; **không** trên BM03 |
| Ghi chú task R&D | RND-05 | `quotation_rnd_data` | R&D | Không gộp “Kết thúc họp” |
| Tệp đính kèm R&D | RND-06 | attachments | R&D | Section rnd |
| ~~Ngày đặt bản in / khuôn~~ | ~~RND-03/04~~ | — | **Removed** | Bỏ khỏi spec 2026-11-06 |

**Việc A vs B:** Cột Storage `quotation_qa_data` / `quotation_rnd_data` = task workflow; `development_minutes` = Annex BM03 (việc B).
