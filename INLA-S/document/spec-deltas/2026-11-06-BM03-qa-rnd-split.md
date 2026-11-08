# Spec delta — BM03 + tách QA/R&D task

| | |
|--|--|
| **Ngày** | 2026-11-06 |
| **BM03 template** | v1.0 — `document/templates/BM03-QT02-LTM/` |
| **Annex** | `document/annex/Annex_BM03_Development_Minutes_MVP.md` |
| **Field map** | `document/annex/BM03-field-map.md` |
| **Cập nhật** | 2026-11-06 — thêm **RND-11 Phương án sản xuất** (task R&D, yêu cầu khách) |

Áp dung vào các file **`.md` baseline** tương ứng trong `document/`. Sau khi gộp xong, cập nhật dòng version trong header file md (Baseline 0.2).

---

## 1. Data_Field_Specification_Quotation_Management_MVP.md

### §4 Dữ liệu QA nhập — **THÊM**

| ID | Label UI | Tên logic | Kiểu/UI | Bắt buộc Complete | Quyền |
|----|----------|-----------|---------|-------------------|-------|
| QA-09 | Tiêu chuẩn — Bục | burstStandard | Text | Có | QA |
| QA-10 | Tiêu chuẩn — Nén | compressionStandard | Text | Có | QA |
| QA-11 | Tiêu chuẩn — TL | weightLimitStandard | Text | Có | QA |
| QA-12 | Tiêu chuẩn — KCG | kcgStandard | Text | Có | QA |
| QA-13 | KCG QA+SX đề xuất — dòng 1 | kcgQaSxProposal1 | Textarea | Có | QA |
| QA-14 | KCG QA+SX đề xuất — dòng 2 | kcgQaSxProposal2 | Textarea | Không | QA |
| QA-15 | KCG QA+SX đề xuất — dòng 3 | kcgQaSxProposal3 | Textarea | Không | QA |

**Ghi chú §4:** QA-02 (Yêu cầu chất lượng) giữ; có thể tóm tắt hoặc tham chiếu QA-09…12. QA không nhập in ấn P1–P7, chi phí R&D.

### §5 Dữ liệu R&D nhập — **SỬA / XÓA**

- **XÓA** RND-03 (Thời gian đặt bản in dự kiến / `expectedPlateOrderDate`).
- **XÓA** RND-04 (Thời gian đặt khuôn bế dự kiến / `expectedDieOrderDate`).
- **GIỮ** RND-01, RND-02, RND-05, RND-06; **system** RND-07…10 (task/SLA).
- **THÊM** (task R&D — việc A, `quotation_rnd_data`):

| ID | Label UI | Tên logic | Kiểu/UI | Bắt buộc Complete | Quyền | Ghi chú |
|----|----------|-----------|---------|-------------------|-------|---------|
| RND-11 | Phương án sản xuất | productionPlan | Textarea | Có | R&D | Chuỗi bước công đoạn, phân tách bằng `>` (vd. `in cuộn > sóng > bế > xếp thành phẩm > đóng pallet`). Không chỉ whitespace. **Không** lưu trên BM03. |

- **THÊM đoạn:** *Payload task R&D không chứa nội dung biên bản BM03 (việc B). Biên bản thuộc Annex BM03-QT02-LTM. Phương án sản xuất (RND-11) thuộc task R&D, không thay thế các ô Bế/Dán/Ghim trên BM03.*

### § mới — Tham chiếu Annex

- Thêm mục: **“Annex BM03 — Development Minutes”** → trỏ `document/annex/Annex_BM03_Development_Minutes_MVP.md`.

---

## 2. Business_Rules_Quotation_Management_MVP.md

- **Complete QA:** bắt buộc QA-01, QA-02, QA-04, QA-09…13; QA-14/15 tùy chọn.
- **Complete R&D:** bắt buộc RND-01, RND-02, **RND-11**, RND-06 (attachment); RND-05 tùy chọn; **không** validate ngày đặt.
- **BM03:** Lưu biên bản độc lập; Complete R&D/QA **không** yêu cầu BM03 đầy đủ (MVP).
- Sales fields trên BM03: read-only; chỉ sửa qua Sales / re-submit cycle.

---

## 3. Role_Permission_Matrix_Quotation_Management_MVP.md

- **Thêm module/hàng:** Development minutes (BM03) — V/C/E theo quotation scope; R&D C/E section R&D; QA C/E QA-09…15 (tab QA); Admin V RO.
- **R&D task:** RND-01, 02, 05, 06, **11** — gỡ mention ngày đặt.

---

## 4. Screen_Inventory_Quotation_Management_MVP.md

- **QUO detail — R&D:** tách **TASK-RND-A** (Chi phí, **Phương án sản xuất**, ghi chú, file) và tab **Biên bản PTDSP** (BM03 việc B).
- **TASK-RND-A:** field **Phương án sản xuất** (RND-11) — textarea; placeholder/hint theo ví dụ khách (Tiger / Omachi).
- **QUO detail — QA:** form có bảng QA-09…15 + QA-01, QA-03 + upload.
- Gỡ wireframe/ mô tả 2 field date trên màn R&D cũ.

---

## 5. UI_Workflow_Quotation_Management_MVP.md

- Luồng QA/R&D song song: mỗi role **Lưu task** và (R&D) **Lưu biên bản** trên tab riêng.
- Mirror: sau Lưu QA, section tiêu chuẩn trên tab BM03 cập nhật read-only.

---

## 6. Workflow_State_Machine_Quotation_Management_MVP.md

- Gỡ mọi ràng buộc liên quan RND-03/04 nếu có.
- Không thêm state cho BM03.

---

## 7. MVP_Feature_List_Quotation_Management.md

- **M03x (SHOULD):** Biên bản PTDSP số hóa (BM03-QT02-LTM).
- **M03y (SHOULD):** QA tiêu chuẩn có cấu trúc (QA-09…15).
- **Cập nhật mô tả R&D task:** chi phí + **phương án sản xuất** + file, không ngày đặt.

---

## 8. Requirement_Summary_Quotation_Management_MVP.md

- Thêm đoạn ngắn: R&D hai lớp (task: chi phí + **phương án sản xuất** vs biên bản BM03); QA bổ sung tiêu chuẩn theo BM03; template `document/templates/BM03-QT02-LTM/`.

---

## 9. Open_Questions_Assumptions_Quotation_Management_MVP.md

- **Deferred (không block MVP):** PDF export BM03; chữ ký điện tử; bắt buộc upload scan biên bản ký.

---

## 10. Không đổi (trừ khi có câu trùng RND date)

- Customer_Management_Specification
- SLA_Alert_Specification

---

## Checklist gộp vào Markdown

- [ ] Data Field — §4, §5, xref Annex
- [ ] Business Rules
- [ ] Role Matrix
- [ ] Screen Inventory + UI Workflow
- [ ] State Machine (cleanup)
- [ ] MVP Feature List + Requirement Summary
- [ ] Open Questions (deferred only)
