# Data Field Specification Quotation Management MVP

> Converted from `Data_Field_Specification_Quotation_Management_MVP.docx` (Word baseline). **Source of truth:** this Markdown file.
> Annex/deltas: `annex/`, `spec-deltas/`. Templates: `templates/`.
> **Delta BM02 2026-11-08:** `spec-deltas/2026-11-08-BM02-sales-request-form.md` — form YCBG Sales.
DATA FIELD SPECIFICATION
Hệ thống quản lý quy trình báo giá thùng carton
Phiên bản
Baseline 0.1
Ngày
13/10/2026
Phạm vi
MVP
Nội dung
Trường dữ liệu theo Sales, QA, R&D, EXECUTOR, Kế toán và Giám đốc
Ngôn ngữ UI
Tiếng Việt
Trạng thái
Tài liệu làm việc tạm thời


1. Mục đích và quy ước
Tài liệu định nghĩa chi tiết các trường dữ liệu được hiển thị, nhập, sửa hoặc chỉ đọc tại từng bước nghiệp vụ. Đây là đầu vào cho thiết kế Figma, form validation, API contract, database model và test case. Các tên logic là đề xuất kỹ thuật để giữ tính nhất quán, chưa bắt buộc là tên cột database cuối cùng.
Nguyên tắc: dữ liệu do role nào sở hữu thì chỉ role đó được sửa trong task đang active. Các role khác xem read-only theo data scope. Dữ liệu đã khóa hoặc task đã hoàn thành chỉ được xem qua màn hình hiện tại hoặc lịch sử.

Ký hiệu
Ý nghĩa
Có
Bắt buộc khi Submit/Complete tương ứng.
Không
Tùy chọn.
Điều kiện
Bắt buộc theo loại Customer, workflow cycle hoặc action.
RO
Chỉ đọc.
System
Hệ thống tự sinh hoặc tự xác định.
OPEN
Chi tiết chưa chốt; không được tự áp đặt validation mới.

2. Trường hệ thống và metadata chung
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
SYS-01
Mã báo giá
quotationCode
Text/RO
Có
System
System
Format mã còn OPEN; duy nhất.
SYS-02
Sales phụ trách
salesOwner
User/RO
Có
Creator
System
Đúng một Sales Owner; không chuyển owner.
SYS-03
Trạng thái quy trình
workflowStatus
Badge/RO
Có
DRAFT
System
Theo State Machine.
SYS-04
Kết quả kinh doanh
businessOutcome
Badge/Select
Điều kiện
NOT_UPDATED
Sales Owner
Chỉ sau APPROVED.
SYS-05
Loại vòng xử lý
cycleType
Badge/RO
Có
NEW
System
NEW hoặc RE_SUBMIT.
SYS-06
Số vòng xử lý
cycleNumber
Number/RO
Có
System
System
Tăng theo mỗi re-submit.
SYS-07
Ngày tạo
createdAt
DateTime/RO
Có
System
System
Locale Việt Nam.
SYS-08
Người tạo
createdBy
User/RO
Có
System
System
Audit.
SYS-09
Ngày cập nhật
updatedAt
DateTime/RO
Có
System
System
Audit.
SYS-10
Sao chép từ báo giá
clonedFromQuotation
Link/RO
Không
Trống
System
Chỉ có khi Clone.
SYS-11
Mã revision
revisionId
Text/RO
Có
System
System
Hibernate Envers.
SYS-12
Cảnh báo SLA
slaAlert
Badge/RO
Điều kiện
NORMAL
System
NORMAL/WARNING/OVERDUE.
SYS-13
Thời hạn xử lý
slaDeadlineAt
DateTime/RO
Điều kiện
System
System
Theo task active.
SYS-14
Thời gian còn lại/quá hạn
slaRemaining
Duration/RO
Điều kiện
System
System
Tính động từ deadline.

3. Dữ liệu Sales nhập
3.1 Thông tin chung của báo giá
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
SAL-01
Khách hàng
customerId
Search Select
Có
Trống
Sales Owner
Chỉ Customer hoạt động có quan hệ với Sales.
SAL-02
Người liên hệ
contactId
Search Select
Điều kiện
Liên hệ chính
Sales Owner
Doanh nghiệp bắt buộc; Cá nhân có thể dùng chính Customer.
SAL-03
Ghi chú yêu cầu
salesNote
Textarea
Không
Trống
Sales Owner
Trim; độ dài tối đa sẽ chốt ở API spec.
SAL-04
Lý do gửi lại
resubmitReason
Textarea
Điều kiện
Trống
Sales Owner
Bắt buộc với cycle RE_SUBMIT; không chỉ whitespace.
SAL-05
Tệp đính kèm
salesAttachments
Upload
Không
0 tệp
Sales Owner
Tối đa 10 tệp; theo attachment rule.
SAL-06
Loại vòng xử lý
cycleType
Badge/RO
Có
System
System
Sales không tự chọn NEW/RE_SUBMIT.
SAL-07
Số phiếu YCBG (khách)
customerRequestNo
Text
Không
Trống
Sales Owner
Map BM02 “Số …/YCBG”; lưu `quotation_sales_data.customer_request_no`.

3.2 Thông tin sản phẩm thùng carton (per line — BM02)
**Source of truth chi tiết cột:** `document/annex/BM02-field-map.md` và `document/reference/BM02-QT01-BH/`.

Các ID SAL-10…22 **mức quotation đơn** được **thay bằng line item** (LIN-*) khi tạo báo giá. Chỉ giữ header cycle: SAL-19 `printingDescription`, SAL-23/24 có thể lặp lại mức cycle **hoặc** per line `delivery_location` (LIN-14) — MVP: **per line** theo BM02.

Bảng dòng bắt buộc Submit (tối thiểu): `itemName`, `fluteType`, `layerCount`, `quantity`, và **inner** hoặc **outer** (3 kích thước mm > 0).

**Pre-fill QA (optional Sales, không thay QA task):** `burstWithDriverNote`, `burstWithoutDriverNote`, `compressionStrengthNote`, `paperStructureNote` — text per line.

3.2 Legacy (deprecated UI — chỉ migrate)
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
SAL-10
Loại thùng
boxType
Select/Text
Có
Trống
Sales Owner
Danh mục chuẩn còn OPEN; mẫu: Thùng carton đối khẩu.
SAL-11
Chiều dài
lengthMm
Number + mm
Có
Trống
Sales Owner
Số > 0.
SAL-12
Chiều rộng
widthMm
Number + mm
Có
Trống
Sales Owner
Số > 0.
SAL-13
Chiều cao
heightMm
Number + mm
Có
Trống
Sales Owner
Số > 0.
SAL-14
Loại kích thước
dimensionType
Radio/Select
Có
Lọt lòng
Sales Owner
Lọt lòng hoặc Phủ bì.
SAL-15
Chất liệu carton
material
Select/Text
Có
Trống
Sales Owner
Ví dụ: Carton 5 lớp BC; danh mục còn OPEN.
SAL-16
Số lớp carton
layerCount
Number/Select
Có
Trống
Sales Owner
Số nguyên > 0; có thể suy ra từ material nhưng vẫn lưu rõ.
SAL-17
Kiểu sóng
fluteType
Select/Text
Có
Trống
Sales Owner
Ví dụ: BC; danh mục còn OPEN.
SAL-18
Tải trọng sản phẩm
productLoadKg
Decimal + kg/thùng
Có
Trống
Sales Owner
Số > 0.
SAL-19
Nội dung in ấn
printingDescription
Textarea
Có
Trống
Sales Owner
Ví dụ: Logo 1 màu đen, 2 mặt.
SAL-20
Số màu in
printColorCount
Number
Có
Trống
Sales Owner
Số nguyên >= 0.
SAL-21
Số mặt in
printSideCount
Number
Có
Trống
Sales Owner
Số nguyên >= 0.
SAL-22
Số lượng thùng
quantityPieces
Integer + piece
Có
Trống
Sales Owner
Số nguyên > 0; 1 piece = 1 thùng.
SAL-23
Địa điểm giao hàng
deliveryLocation
Text/Textarea
Có
Trống
Sales Owner
Không chỉ whitespace.
SAL-24
Thời gian mong muốn
desiredDeliveryTime
Date/Month/Text
Có
Trống
Sales Owner
Mẫu: Trong tháng 11/2026; widget cuối sẽ chốt ở UI spec.
SAL-25
Yêu cầu khác
additionalRequirements
Textarea
Không
Trống
Sales Owner
Thông tin bổ sung.

Sales được lưu Draft khi form chưa hoàn chỉnh. Toàn bộ trường bắt buộc chỉ được enforce đầy đủ khi Submit. Sau Submit, các trường Sales chuyển read-only cho tới khi một cycle Re-submit mới được chuẩn bị.

4. Dữ liệu QA nhập
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
QA-01
Kết quả đánh giá chất lượng
qualityAssessmentResult
Textarea
Có
Trống
QA
Bắt buộc khi Hoàn thành; không chỉ whitespace.
QA-02
Yêu cầu chất lượng
qualityRequirements
Textarea
Có
Trống
QA
Bắt buộc khi Hoàn thành; không chỉ whitespace.
QA-03
Ghi chú
qaNote
Textarea
Không
Trống
QA
Tùy chọn.
QA-04
Tệp đính kèm QA
qaAttachments
Upload
Có
0 tệp
QA
Ít nhất 1, tối đa 10 tệp do QA upload trong đúng task/cycle.
QA-05
Trạng thái task
qaTaskStatus
Badge/RO
Có
PENDING
System
PENDING/IN_PROGRESS/COMPLETED.
QA-06
Bắt đầu xử lý lúc
qaStartedAt
DateTime/RO
Không
Trống
System
Có khi QA bấm Bắt đầu xử lý.
QA-07
Hoàn thành lúc
qaCompletedAt
DateTime/RO
Điều kiện
Trống
System
Ghi khi Complete thành công.
QA-08
Thời hạn QA
qaDeadlineAt
DateTime/RO
Có
System
System
NEW 4h; RE_SUBMIT 2h theo config snapshot.

QA không có bất kỳ trường chi phí hoặc giá trị tiền nào.
QA có thể Hoàn thành trực tiếp từ PENDING nếu các field và attachment hợp lệ.
Sau Complete, toàn bộ field QA và attachment chuyển read-only.
5. Dữ liệu R&D nhập
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
RND-01
Chi phí bản in
printingPlateCost
Currency VND
Có
0 VNĐ
R&D
Số >= 0; bắt buộc khi Complete.
RND-02
Chi phí khuôn
dieCost
Currency VND
Có
0 VNĐ
R&D
Số >= 0; bắt buộc khi Complete.
RND-03
Thời gian đặt bản in dự kiến
expectedPlateOrderDate
Date
Có
Hôm nay
R&D
Giá trị mặc định phải được lưu rõ.
RND-04
Thời gian đặt khuôn bế dự kiến
expectedDieOrderDate
Date
Có
Hôm nay
R&D
Giá trị mặc định phải được lưu rõ.
RND-05
Ghi chú
rndNote
Textarea
Không
Trống
R&D
Tùy chọn.
RND-06
Tệp đính kèm R&D
rndAttachments
Upload
Có
0 tệp
R&D
Ít nhất 1, tối đa 10 tệp do R&D upload trong đúng task/cycle.
RND-07
Trạng thái task
rndTaskStatus
Badge/RO
Có
PENDING
System
PENDING/IN_PROGRESS/COMPLETED.
RND-08
Bắt đầu xử lý lúc
rndStartedAt
DateTime/RO
Không
Trống
System
Có khi bấm Bắt đầu xử lý.
RND-09
Hoàn thành lúc
rndCompletedAt
DateTime/RO
Điều kiện
Trống
System
Ghi khi Complete.
RND-10
Thời hạn R&D
rndDeadlineAt
DateTime/RO
Có
System
System
NEW 4h; RE_SUBMIT 2h theo config snapshot.

R&D không nhập Đặc tính kỹ thuật đề xuất, Vật liệu/cấu trúc đề xuất, Chi phí kỹ thuật/sản xuất hoặc Thời gian sản xuất dự kiến.
Chi phí 0 VNĐ vẫn là giá trị hợp lệ.
Sau Complete, field R&D chuyển read-only; EXECUTOR chỉ xem chi phí này.
6. Dữ liệu EXECUTOR nhập
6.1 Bước Tiếp nhận
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
EXI-01
Trạng thái task tiếp nhận
intakeTaskStatus
Badge/RO
Có
PENDING
System
PENDING/IN_PROGRESS/COMPLETED.
EXI-02
Bắt đầu xử lý lúc
intakeStartedAt
DateTime/RO
Không
Trống
System
Có khi bấm Bắt đầu xử lý.
EXI-03
Hoàn thành tiếp nhận lúc
intakeCompletedAt
DateTime/RO
Điều kiện
Trống
System
Khi Complete; tạo đồng thời QA/R&D task.
EXI-04
Thời hạn tiếp nhận
intakeDeadlineAt
DateTime/RO
Có
System
System
NEW 2h; RE_SUBMIT 1h.
EXI-05
Ghi chú tiếp nhận
intakeNote
Textarea
Không
Trống
EXECUTOR
Không phải field bắt buộc; thêm để ghi chú nội bộ ở MVP nếu UI cần.
EXI-06
Tệp đính kèm tiếp nhận
intakeAttachments
Upload
Không
0 tệp
EXECUTOR
Nếu hỗ trợ; không được tính cho attachment bắt buộc của bước tổng hợp.

Baseline không yêu cầu field chuyên môn bắt buộc tại bước Tiếp nhận. EXI-05 và EXI-06 là field hỗ trợ tùy chọn; nếu cần giữ MVP tối giản, UI có thể không hiển thị hai field này mà không làm thay đổi workflow.

6.2 Bước Tổng hợp
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
EXC-01
Đơn giá cho 1 thùng
unitPricePerPiece
Currency VND
Có
Trống
EXECUTOR
Số >= 0; EXECUTOR tự tính và nhập; không có công thức tự động.
EXC-02
Chi phí bản in
printingPlateCost
Currency VND/RO
Có
Từ R&D
R&D
EXECUTOR chỉ xem.
EXC-03
Chi phí khuôn
dieCost
Currency VND/RO
Có
Từ R&D
R&D
EXECUTOR chỉ xem.
EXC-04
Thời gian sản xuất
productionLeadTime
Text/Duration
Không
Trống
EXECUTOR
Kiểu dữ liệu cuối còn chốt ở UI spec.
EXC-05
Điều kiện giao hàng
deliveryTerms
Textarea
Không
Trống
EXECUTOR
Tùy chọn.
EXC-06
Ghi chú tổng hợp
consolidationNote
Textarea
Không
Trống
EXECUTOR
Tùy chọn.
EXC-07
Tệp đính kèm tổng hợp
consolidationAttachments
Upload
Có
0 tệp
EXECUTOR
Ít nhất 1, tối đa 10 tệp do EXECUTOR upload trong task tổng hợp.
EXC-08
Trạng thái task tổng hợp
consolidationTaskStatus
Badge/RO
Có
PENDING
System
PENDING/IN_PROGRESS/COMPLETED.
EXC-09
Bắt đầu xử lý lúc
consolidationStartedAt
DateTime/RO
Không
Trống
System
Có khi bấm Bắt đầu xử lý.
EXC-10
Hoàn thành lúc
consolidationCompletedAt
DateTime/RO
Điều kiện
Trống
System
Khi Complete.
EXC-11
Thời hạn tổng hợp
consolidationDeadlineAt
DateTime/RO
Có
System
System
NEW 4h; RE_SUBMIT 2h.

6.3 Dữ liệu báo giá tương tự hiển thị cho EXECUTOR
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
SIM-01
Báo giá tương tự theo sản phẩm
similarByProduct
Carousel/RO
Không
System
System
Tối đa 5; similarityScore DESC, createdAt DESC.
SIM-02
Báo giá tương tự theo khách hàng
similarByCustomer
Carousel/RO
Không
System
System
Cùng customerId; tối đa 5; mới nhất trước.
SIM-03
Mức độ tương đồng
similarityScore
Score/RO
Không
System
System
Trọng số/ngưỡng còn OPEN.
SIM-04
Empty state
similarQuotationEmptyText
Text/RO
Điều kiện
System
System
“Không có báo giá tương tự trước đây.”

7. Dữ liệu Kế toán nhập
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
ACC-01
Điều kiện thanh toán
paymentTerms
Textarea
Không
Trống
Kế toán
Tùy chọn.
ACC-02
Thuế VAT
vatRate
Percentage
Không
10%
Kế toán
Có thể chỉnh sửa; không tự tính giá trị cuối cùng.
ACC-03
Chi phí hoặc điều chỉnh tài chính
financialAdjustment
Currency/Text
Không
Trống
Kế toán
Kiểu field cuối cần chốt; không có công thức tự động.
ACC-04
Giá trị cuối cùng
finalQuotationValue
Currency VND
Có
Trống
Kế toán
Tự tính và nhập; số >= 0.
ACC-05
Ghi chú
accountingNote
Textarea
Không
Trống
Kế toán
Tùy chọn.
ACC-06
Tệp đính kèm Kế toán
accountingAttachments
Upload
Không
0 tệp
Kế toán
Tối đa 10 tệp.
ACC-07
Trạng thái task
accountingTaskStatus
Badge/RO
Có
PENDING
System
PENDING/IN_PROGRESS/COMPLETED.
ACC-08
Bắt đầu xử lý lúc
accountingStartedAt
DateTime/RO
Không
Trống
System
Có khi bấm Bắt đầu xử lý.
ACC-09
Hoàn thành lúc
accountingCompletedAt
DateTime/RO
Điều kiện
Trống
System
Khi Complete.
ACC-10
Thời hạn Kế toán
accountingDeadlineAt
DateTime/RO
Có
System
System
NEW 4h; RE_SUBMIT 2h.

Không áp dụng công thức “Đơn giá × Số lượng + chi phí”. Giá trị cuối cùng là field bắt buộc do Kế toán tự tính và tự nhập.

8. Dữ liệu Giám đốc nhập
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
DIR-01
Quyết định
directorDecision
Action
Có
Trống
Giám đốc
Phê duyệt hoặc Từ chối; không lưu lựa chọn trung gian.
DIR-02
Ghi chú phê duyệt
approvalNote
Textarea
Không
Trống
Giám đốc
Tùy chọn khi Approve.
DIR-03
Lý do từ chối
rejectionReason
Textarea
Điều kiện
Trống
Giám đốc
Bắt buộc khi Reject; không chỉ whitespace.
DIR-04
Trạng thái task
directorTaskStatus
Badge/RO
Có
PENDING
System
PENDING/IN_PROGRESS/COMPLETED; Complete qua quyết định.
DIR-05
Bắt đầu xử lý lúc
directorStartedAt
DateTime/RO
Không
Trống
System
Nếu UI hỗ trợ Bắt đầu xử lý cho Director.
DIR-06
Quyết định lúc
decisionAt
DateTime/RO
Điều kiện
Trống
System
Khi Approve hoặc Reject.
DIR-07
Thời hạn Giám đốc
directorDeadlineAt
DateTime/RO
Có
System
System
NEW 4h; RE_SUBMIT 2h.

Giám đốc không nhập hoặc sửa bất kỳ trường giá/chi phí nào.
Giám đốc xem read-only toàn bộ dữ liệu Sales, QA, R&D, EXECUTOR và Kế toán trước khi quyết định.
Reject thiếu lý do phải bị chặn ở frontend và backend.
9. Trường dữ liệu Customer và Người liên hệ liên quan form Sales
9.1 Customer
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
CUS-01
Loại khách hàng
customerType
Radio/Select
Có
Doanh nghiệp
Role có CRUD
Doanh nghiệp hoặc Cá nhân.
CUS-02
Tên khách hàng
customerName
Text
Có
Trống
Role có CRUD
Không chỉ whitespace.
CUS-03
Tên viết tắt
shortName
Text
Không
Trống
Role có CRUD
Tùy chọn.
CUS-04
Mã số thuế
taxCode
Text
Có
Trống
Role có CRUD
Bắt buộc cả hai loại; uniqueness OPEN.
CUS-05
Số điện thoại
phone
Text
Có
Trống
Role có CRUD
Thông tin liên lạc bắt buộc.
CUS-06
Email
email
Email
Có
Trống
Role có CRUD
Email hợp lệ.
CUS-07
Địa chỉ
address
Textarea
Có
Trống
Role có CRUD
Không chỉ whitespace.
CUS-08
Tỉnh/Thành phố
provinceCity
Select/Text
Có
Trống
Role có CRUD
Danh mục địa lý có thể dùng master data.
CUS-09
Website
website
URL
Không
Trống
Role có CRUD
URL hợp lệ nếu nhập.
CUS-10
Ghi chú
customerNote
Textarea
Không
Trống
Role có CRUD
Tùy chọn.
CUS-11
Trạng thái
customerStatus
Select
Có
Hoạt động
Role có CRUD
Hoạt động/Ngừng hoạt động.
CUS-12
Sales liên quan
relatedSalesIds
Multi-select Users
Có
Creator Sales nếu phù hợp
Theo quyền UI
Quan hệ N-N; actor cụ thể còn OPEN.

9.2 Người liên hệ
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
CON-01
Họ và tên
fullName
Text
Có
Trống
Role có CRUD
Không chỉ whitespace.
CON-02
Chức vụ
jobTitle
Text
Không
Trống
Role có CRUD
Tùy chọn.
CON-03
Phòng ban
department
Text
Không
Trống
Role có CRUD
Tùy chọn.
CON-04
Email
email
Email
Có
Trống
Role có CRUD
Email hợp lệ.
CON-05
Số điện thoại
phone
Text
Có
Trống
Role có CRUD
Thông tin liên lạc.
CON-06
Ghi chú
contactNote
Textarea
Không
Trống
Role có CRUD
Tùy chọn.
CON-07
Liên hệ chính
isPrimary
Checkbox
Không
False
Role có CRUD
Nên chỉ có một liên hệ chính/Customer.
CON-08
Trạng thái
contactStatus
Select
Có
Hoạt động
Role có CRUD
Ngừng hoạt động không chọn cho quotation mới.

10. Metadata Attachment
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
ATT-01
Tên tệp
fileName
Text/RO
Có
System
System
Tên gốc đã sanitize.
ATT-02
Định dạng
fileExtension
Text/RO
Có
System
System
Trong whitelist.
ATT-03
Loại MIME
mimeType
Text/RO
Có
System
System
Phải khớp nội dung/extension.
ATT-04
Dung lượng
fileSizeBytes
Number/RO
Có
System
System
Theo giới hạn loại file.
ATT-05
Người tải lên
uploadedBy
User/RO
Có
JWT user
System
Không lấy từ payload.
ATT-06
Role tải lên
uploadedByRole
Role/RO
Có
JWT role
System
Audit.
ATT-07
Thời điểm tải lên
uploadedAt
DateTime/RO
Có
System
System
Audit.
ATT-08
Workflow cycle
workflowCycleId
Reference/RO
Có
Current cycle
System
Phân biệt New/Re-submit.
ATT-09
Task/Section
taskId/sectionType
Reference/RO
Có
Current context
System
Để validate ownership.
ATT-10
Nguồn clone
sourceAttachmentId
Reference/RO
Không
Trống
System
Có khi Sales chọn copy file lúc Clone.

Loại file
Định dạng
Dung lượng tối đa
Số lượng
Hình ảnh
JPG, JPEG, PNG, WEBP
10 MB/tệp
Tối đa 10 tệp mỗi role/task
Video
MP4, MOV, WEBM
100 MB/tệp
Tối đa 10 tệp mỗi role/task
Tài liệu
PDF, DOC, DOCX, XLS, XLSX
20 MB/tệp
Tối đa 10 tệp mỗi role/task

11. Workflow, SLA và History Fields
ID
Label UI
Tên logic
Kiểu/UI
Bắt buộc
Mặc định
Quyền nhập/sửa
Validation / Ghi chú
HIS-01
Mã vòng xử lý
workflowCycleId
Reference/RO
Có
System
System
Liên kết NEW/RE_SUBMIT.
HIS-02
Loại vòng xử lý
cycleType
Enum/RO
Có
NEW
System
NEW hoặc RE_SUBMIT.
HIS-03
Lý do gửi lại
resubmitReason
Text/RO
Điều kiện
Trống
Sales Owner
Bắt buộc RE_SUBMIT.
HIS-04
Trạng thái trước
fromStatus
Enum/RO
Không
System
System
Transition history.
HIS-05
Trạng thái sau
toStatus
Enum/RO
Có
System
System
Transition history.
HIS-06
Hành động
actionType
Enum/RO
Có
System
System
Submit/Complete/Approve/Reject/Outcome...
HIS-07
Người thực hiện
actorUserId
User/RO
Có
JWT user
System
Audit.
HIS-08
Role thực hiện
actorRole
Role/RO
Có
JWT role
System
Audit.
HIS-09
Thời điểm
actionAt
DateTime/RO
Có
System
System
Audit.
HIS-10
Ghi chú/Lý do
actionNote
Text/RO
Không
Trống
Actor/System
Approve note, reject reason, resubmit reason.
SLA-01
SLA bắt đầu
slaStartedAt
DateTime/RO
Có
Task created
System
24/7.
SLA-02
SLA deadline
slaDeadlineAt
DateTime/RO
Có
System
System
Snapshot cấu hình.
SLA-03
SLA hoàn thành
slaCompletedAt
DateTime/RO
Điều kiện
Trống
System
Khi task hoàn thành.
SLA-04
Thời lượng cấu hình
slaDurationHours
Decimal/RO
Có
Config snapshot
System
Không đổi khi Admin sửa config.
SLA-05
Thời gian thực tế
actualDuration
Duration/RO
Điều kiện
System
System
Tính khi Complete.
SLA-06
Trạng thái cảnh báo
slaAlertState
Enum/RO
Có
NORMAL
System
NORMAL/WARNING/OVERDUE.

12. Ma trận khả năng chỉnh sửa theo giai đoạn
Nhóm dữ liệu
Draft New/Re-submit
Task role đang active
Sau task Complete
Sau cycle kết thúc
Sales input
Sales Owner sửa
RO
RO
RO; mở lại trong Re-submit Draft nếu hợp lệ
QA fields
Chưa có/RO
QA sửa task QA
RO
RO
R&D fields
Chưa có/RO
R&D sửa task R&D
RO
RO
EXECUTOR intake
Chưa có
EXECUTOR thao tác
RO
RO
EXECUTOR consolidation
Chưa có/RO
EXECUTOR sửa task tổng hợp
RO
RO
Accounting fields
Chưa có/RO
Kế toán sửa task
RO
RO
Director decision
Chưa có/RO
Giám đốc nhập quyết định
RO
RO
Business Outcome
Không áp dụng
Không áp dụng
Không áp dụng
Sales Owner cập nhật nếu APPROVED
History/Revision
RO
RO
RO
RO

13. Validation Messages đề xuất trên UI
Tình huống
Thông báo tiếng Việt đề xuất
Thiếu Customer
Vui lòng chọn khách hàng.
Doanh nghiệp thiếu Contact
Vui lòng chọn người liên hệ của khách hàng.
Thiếu field carton
Vui lòng nhập đầy đủ thông tin bắt buộc của sản phẩm.
Thiếu lý do re-submit
Vui lòng nhập lý do gửi lại báo giá.
QA thiếu attachment
QA phải tải lên ít nhất một tệp trước khi hoàn thành.
R&D thiếu attachment
R&D phải tải lên ít nhất một tệp trước khi hoàn thành.
EXECUTOR thiếu attachment
Trưởng phòng Kế hoạch phải tải lên ít nhất một tệp trước khi hoàn thành tổng hợp.
R&D thiếu chi phí/ngày
Vui lòng nhập đầy đủ chi phí và thời gian dự kiến.
Thiếu đơn giá
Vui lòng nhập đơn giá cho một thùng.
Thiếu giá trị cuối cùng
Vui lòng nhập giá trị cuối cùng của báo giá.
Reject thiếu lý do
Vui lòng nhập lý do từ chối.
Sai định dạng file
Định dạng tệp không được hỗ trợ.
File vượt dung lượng
Tệp vượt quá dung lượng cho phép.
Quá 10 file
Mỗi phần xử lý chỉ được tải lên tối đa 10 tệp.
Task đã hoàn thành
Công việc đã hoàn thành và không thể chỉnh sửa.
Không có quyền
Bạn không có quyền thực hiện thao tác này.

14. Chi tiết còn mở cần chốt sau
Open ID
Nội dung
Ảnh hưởng
DF-OPEN-01
Danh mục chuẩn cho Loại thùng, Chất liệu, Số lớp và Kiểu sóng.
Select/master data.
DF-OPEN-02
Kiểu nhập Thời gian mong muốn: date, month picker hay text có cấu trúc.
Sales form/UI/API.
DF-OPEN-03
Kiểu dữ liệu Thời gian sản xuất: số ngày hay mô tả text.
EXECUTOR form.
DF-OPEN-04
Chi phí/điều chỉnh tài chính là số tiền hay textarea mô tả.
Accounting/API.
DF-OPEN-05
Quy tắc unique và format Mã số thuế.
Customer validation/database.
DF-OPEN-06
Giới hạn ký tự cho các field text/textarea.
Frontend/backend validation.
DF-OPEN-07
Có hiển thị Ghi chú/Tệp ở EXECUTOR Intake hay bỏ để tối giản.
UI scope nhỏ; không đổi workflow.
DF-OPEN-08
Format mã báo giá, cycle và revision trên UI.
Identifier display.
DF-OPEN-09
Actor cụ thể được chỉnh quan hệ Customer–Sales.
Customer form/permission.
DF-OPEN-10
Director có cần nút Bắt đầu xử lý hay chỉ Approve/Reject trực tiếp.
Task UI; SLA không thay đổi.

15. Baseline Summary
Sales nhập Customer, Contact và dữ liệu yêu cầu carton; được lưu Draft chưa hoàn chỉnh nhưng phải đủ dữ liệu khi Submit.
QA nhập hai nội dung chất lượng và ít nhất một attachment riêng.
R&D nhập hai chi phí, hai ngày dự kiến và ít nhất một attachment riêng.
EXECUTOR tiếp nhận không có field bắt buộc; ở bước tổng hợp nhập đơn giá và attachment riêng, chỉ xem chi phí R&D.
Kế toán tự nhập giá trị cuối cùng; VAT mặc định 10% nhưng chỉnh được; không có công thức tự động.
Giám đốc Approve/Reject, lý do Reject bắt buộc, không sửa giá.
Mọi field bị khóa theo task/status và dữ liệu lịch sử chỉ đọc.
