# BM02-QT01-BH — Danh mục cột (từ biểu mẫu khách)

## Header

| # | Nhãn BM02 | Ghi chú |
|---|-----------|---------|
| H1 | Mã tài liệu: BM02-QT01-BH | Meta form |
| H2 | Số: ……/20…./YCBG | Số phiếu yêu cầu báo giá (khách) |
| H3 | Gửi: Phòng Kế hoạch | Luồng nội bộ; map workflow Submit |
| H4 | Tên khách hàng | Chọn Customer trên hệ thống |

## Bảng 1 — Thông tin sản phẩm / quy cách

| STT cột | Tên cột BM02 | Ý nghĩa |
|---------|--------------|---------|
| 1 | STT | Thứ tự dòng |
| 2 | FGCODE | Mã thành phẩm (Finished Good) |
| 3 | SAPCODE | Mã SAP |
| 4 | TÊN SẢN PHẨM | Tên SP |
| 5 | QUY CÁCH (lọt lòng) | Kích thước **lọt lòng** (mm) — D×R×C |
| 6 | QUY CÁCH PHỦ BÌ (mm) DÀI RỘNG CAO | Kích thước **phủ bì** (mm) |
| 7 | LỚP | Số lớp carton |
| 8 | SÓNG | Kiểu sóng |
| 9 | ĐỘ BỤC (kgf/cm²) — CÓ DRIVER | Tiêu chuẩn bục (có driver) |
| 10 | ĐỘ BỤC — KO DRIVER | Tiêu chuẩn bục (không driver) |
| 11 | ĐỘ NÉN (kgf/cm²) | Tiêu chuẩn nén |
| 12 | TRỌNG LƯỢNG (gam) | Trọng lượng / tải (gam) |
| 13 | SỐ MÀU MỰC | Số màu in |
| 14 | KẾT CẤU GIẤY | Cấu trúc giấy (free text hoặc 7 lớp) |
| 15 | SỐ LƯỢNG (dự kiến) | Số lượng thùng |
| 16 | ĐỊA ĐIỂM GIAO HÀNG | Địa điểm giao (theo dòng trên BM02) |
| 17 | GHI CHÚ | Ghi chú dòng |

## Bảng 2 — Bao gói / vận chuyển / phủ mực

| STT cột | Tên cột BM02 | Ý nghĩa |
|---------|--------------|---------|
| 1–4 | STT, FGCODE, SAPCODE, TÊN SẢN PHẨM | Khóa dòng |
| 5 | QUY CÁCH BAO GÓI — Số lượng thùng/bó | Đóng gói |
| 6 | QUY CÁCH VẬN CHUYỂN — Số lượng bó/pallet | Logistics |
| 7 | Chất pallet & cột đai | Checkbox |
| 8 | Chất pallet & không cột đai | Checkbox |
| 9 | Cuốn màng co | Checkbox |
| 10 | Không cuốn màng co | Checkbox |
| 11–14 | DIỆN TÍCH PHỦ MỰC IN/THÙNG — ≤30%, ≤50%, ≤70%, ≤100% | Chọn một băng % |

## Footer

| Nhãn | Ghi chú |
|------|---------|
| Ghi chú chung | Text |
| Ngày … tháng … năm … | Ngày lập phiếu |
| PHÒNG KẾ HOẠCH / PHỤ TRÁCH BỘ PHẬN / PHÒNG KINH DOANH | Chữ ký (ngoài MVP digitize) |
