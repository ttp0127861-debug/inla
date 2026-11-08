# BM03-QT02-LTM — Template

| Thuộc tính | Giá trị |
|------------|---------|
| **Mã tài liệu** | BM03-QT02-LTM |
| **Tên** | Biên bản họp phát triển sản phẩm mới |
| **Version** | 1.0 |
| **Ngày áp dụng** | 2026-11-06 |

## File trong thư mục

- `BM03-QT02-LTM_Bien_ban_hop_PTDSP.xlsx` — mẫu Excel/phòng R&D (layout tham chiếu UI).
- `template-meta.json` — metadata cho traceability.

## Liên kết spec INLA-S

- Field map: [`../../annex/BM03-field-map.md`](../../annex/BM03-field-map.md)
- Annex BM03 (việc B): [`../../annex/Annex_BM03_Development_Minutes_MVP.md`](../../annex/Annex_BM03_Development_Minutes_MVP.md)
- Delta spec: [`../../spec-deltas/2026-11-06-BM03-qa-rnd-split.md`](../../spec-deltas/2026-11-06-BM03-qa-rnd-split.md) → gộp vào `document/*.md`

## Template khác

- EXECUTOR PRICE-FORMAT: [`../PRICE-FORMAT/`](../PRICE-FORMAT/)

## Quy ước

- **Việc A (task workflow):** QA-01…08 + QA-09…15; RND-01, RND-02, **RND-11** (phương án sản xuất), RND-05, RND-06 (+ system RND-07…10).
- **Việc B (biên bản):** payload `development_minutes` theo Annex — **không** lưu trong `quotation_rnd_data`.
- **Đã bỏ:** RND-03, RND-04 (ngày đặt bản in / khuôn) — không có trên task R&D và không chuyển sang BM03 trừ khi spec Annex bổ sung sau.
