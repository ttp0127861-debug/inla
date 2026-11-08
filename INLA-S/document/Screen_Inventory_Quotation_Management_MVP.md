# Screen Inventory Quotation Management MVP

> Converted from `Screen_Inventory_Quotation_Management_MVP.docx` (Word baseline). **Source of truth:** this Markdown file.
> Annex/deltas: `annex/`, `spec-deltas/`. Templates: `templates/`.
> **Delta UI 2026-11-08:** `spec-deltas/2026-11-08-customer-ui-mvp.md` (routes Customer MVP).
SCREEN INVENTORY
Hệ thống quản lý quy trình báo giá thùng carton
Phiên bản
Baseline 0.1
Ngày
13/10/2026
Phạm vi
MVP
Nội dung
Danh sách đầy đủ các màn hình cần thiết
Ngôn ngữ UI
Tiếng Việt
Trạng thái
Tài liệu làm việc tạm thời


1. Mục đích và quy ước
Tài liệu liệt kê toàn bộ màn hình, page, tab, modal và trạng thái UI cần thiết cho MVP. Screen Inventory là baseline để lập sitemap, phân công thiết kế Figma, xây route frontend, ước lượng phát triển và xác định phạm vi demo. Một “màn hình” trong tài liệu có thể là full page, tab/section lớn hoặc modal có nghiệp vụ riêng.
MUST là bắt buộc để chạy luồng end-to-end. SHOULD thuộc MVP nhưng có thể hoàn thiện sau các màn hình lõi. OPEN là chi tiết trình bày chưa chốt, không được tự mở rộng nghiệp vụ.

Loại UI
Ý nghĩa
Page
Màn hình có route riêng.
Tab/Section
Vùng lớn trong page, có nội dung và hành vi riêng.
Modal/Drawer
Hộp thoại hoặc panel cho action ngắn.
State
Loading, empty, error, unauthorized hoặc conflict.
Shared Component
Thành phần dùng lại trên nhiều màn hình.

2. Tổng quan số lượng màn hình
Nhóm
Module
Số lượng mục
AUTH
Xác thực và tài khoản
5
DASH
Dashboard
7
QUO
Quotation
17
TASK
Task theo role
7
CUS
Customer Management
9
HIS
History & Versioning
4
RPT
Dashboard/Báo cáo kết quả
4
ADM
Quản trị
8
SHR
Shared Modal/State
17

Tổng cộng: 78 mục màn hình/tab/modal/state. Một số mục dùng chung và không tạo route độc lập. Số lượng route thực tế nhỏ hơn tổng số mục trong inventory.
3. Authentication và Account Screens
Screen ID
Tên màn hình
Loại
Role
Mục đích
Action chính
Ưu tiên
AUTH-01
Đăng nhập
Page
Tất cả
Xác thực người dùng qua Cognito.
Đăng nhập; Quên mật khẩu.
MUST
AUTH-02
Quên mật khẩu
Page/Flow
Tất cả
Khởi tạo reset mật khẩu.
Gửi yêu cầu; quay lại đăng nhập.
MUST
AUTH-03
Đặt lại mật khẩu
Page/Flow
Tất cả
Nhập mật khẩu mới theo cơ chế xác thực.
Lưu mật khẩu mới.
MUST
AUTH-04
Hồ sơ cá nhân
Page/Drawer
Tất cả
Xem họ tên, email, điện thoại và role.
Đăng xuất; tự sửa nếu được chốt.
SHOULD
AUTH-05
Phiên hết hạn
Modal/State
Tất cả
Thông báo token hết hạn.
Đăng nhập lại.
MUST

4. Dashboard Screens
Screen ID
Tên màn hình
Loại
Role
Mục đích
Action chính
Ưu tiên
DASH-01
Dashboard Sales
Page
Sales
KPI và quotation của chính Sales.
Tạo báo giá; mở Draft; cập nhật outcome.
MUST
DASH-02
Dashboard EXECUTOR
Page
EXECUTOR
Task intake/tổng hợp và alert toàn bộ.
Mở task ưu tiên.
MUST
DASH-03
Dashboard QA
Page
QA
Task QA chờ/đang xử lý và SLA.
Mở QA task.
MUST
DASH-04
Dashboard R&D
Page
R&D
Task R&D chờ/đang xử lý và SLA.
Mở R&D task.
MUST
DASH-05
Dashboard Kế toán
Page
Kế toán
Task Kế toán và SLA.
Mở task Kế toán.
MUST
DASH-06
Dashboard Giám đốc
Page
Giám đốc
Báo giá chờ phê duyệt, SLA và KPI toàn bộ.
Mở báo giá chờ quyết định.
MUST
DASH-07
Dashboard Admin
Page
Admin
Tổng quan read-only, account và cấu hình.
Mở quản trị người dùng/SLA.
SHOULD

Có thể triển khai một Dashboard route dùng widget cấu hình theo role thay vì bảy code page độc lập. Tuy nhiên Figma cần thể hiện đủ biến thể nội dung theo từng role.

5. Quotation Screens
Screen ID
Tên màn hình
Loại
Role
Mục đích
Action chính
Ưu tiên
QUO-01
Danh sách báo giá
Page
Theo scope
Tìm kiếm, lọc, phân trang và mở quotation.
Tạo; mở chi tiết; clone theo quyền.
MUST
QUO-02
Tạo báo giá mới
Page
Sales
Tạo DRAFT và nhập yêu cầu carton theo **BM02-QT01-BH** (grid bảng 1 + bảng 2, Số YCBG) — `document/reference/BM02-QT01-BH/`.
Lưu nháp; Gửi xử lý; Hủy.
MUST
QUO-03
Sửa báo giá nháp
Page
Sales Owner
Tiếp tục chỉnh DRAFT.
Lưu; Submit; Hủy.
MUST
QUO-04
Chi tiết báo giá - Tổng quan
Page/Tab
Theo scope
Header, Customer, Owner, workflow, outcome, SLA.
Action bar động.
MUST
QUO-05
Chi tiết - Yêu cầu Sales
Tab/Section
Theo scope
Xem dữ liệu Customer, Contact và carton.
Sales sửa ở Draft; role khác RO.
MUST
QUO-06
Chi tiết - QA
Tab/Section
Theo scope
Kết quả QA, attachment, task và SLA.
QA nhập/Complete khi active.
MUST
QUO-07
Chi tiết - R&D
Tab/Section
Theo scope
Chi phí, ngày dự kiến, attachment và SLA.
R&D nhập/Complete khi active.
MUST
QUO-08
Chi tiết - EXECUTOR Tổng hợp
Tab/Section
Theo scope
Đơn giá, delivery terms, file và similar quotes.
EXECUTOR nhập/Complete.
MUST
QUO-09
Chi tiết - Kế toán
Tab/Section
Theo scope
VAT, điều chỉnh, giá trị cuối cùng, file.
Kế toán nhập/Complete.
MUST
QUO-10
Chi tiết - Phê duyệt
Tab/Section
Theo scope
Decision, approval note hoặc reject reason.
Giám đốc Approve/Reject.
MUST
QUO-11
Chi tiết - Tệp đính kèm
Tab/Section
Theo scope
Nhóm tệp theo cycle và role/task.
Preview/download; upload/xóa theo task.
MUST
QUO-12
Chi tiết - Lịch sử
Tab
Theo scope
Timeline workflow, task, SLA, outcome và revision.
Mở cycle/revision.
MUST
QUO-13
Chuẩn bị Re-submit
Page
Sales Owner
Nhập lý do và chỉnh dữ liệu trước cycle mới.
Lưu nháp; Submit Re-submit.
MUST
QUO-14
Clone báo giá
Page/Modal
Sales Owner
Xác nhận dữ liệu copy và chọn attachment.
Tạo bản sao.
MUST
QUO-15
Báo giá tương tự theo sản phẩm
Carousel/Section
EXECUTOR
Tối đa 5 quotation theo similarity.
Mở quotation read-only.
SHOULD
QUO-16
Báo giá tương tự theo khách hàng
Carousel/Section
EXECUTOR
Tối đa 5 quotation cùng Customer.
Mở quotation read-only.
SHOULD
QUO-17
Quotation read-only snapshot
Page/Mode
Theo scope
Xem revision hoặc quotation lịch sử.
Quay lại history.
SHOULD

6. Task Processing Screens
Screen ID
Tên màn hình
Loại
Role
Mục đích
Action chính
Ưu tiên
TASK-01
Task EXECUTOR Tiếp nhận
Panel/Page
EXECUTOR
Xem yêu cầu và hoàn thành intake.
Bắt đầu xử lý; Hoàn thành.
MUST
TASK-02
Task QA
Panel/Page
QA
Nhập hai trường chất lượng và file bắt buộc.
Start; Upload; Complete.
MUST
TASK-03
Task R&D
Panel/Page
R&D
Nhập hai chi phí, hai ngày và file bắt buộc.
Start; Upload; Complete.
MUST
TASK-04
Task EXECUTOR Tổng hợp
Panel/Page
EXECUTOR
Nhập đơn giá và dữ liệu tổng hợp.
Start; Upload; Complete.
MUST
TASK-05
Task Kế toán
Panel/Page
Kế toán
Nhập tài chính và giá trị cuối cùng.
Start; Complete.
MUST
TASK-06
Task Giám đốc
Panel/Page
Giám đốc
Xem toàn bộ và quyết định.
Phê duyệt; Từ chối.
MUST
TASK-07
Danh sách công việc ưu tiên SLA
Page/Widget
Theo role
Hiển thị PENDING/IN_PROGRESS, warning/overdue.
Mở task; lọc alert.
MUST

TASK-01 đến TASK-06 có thể được triển khai như task panel trong QUO-04 thay vì route riêng. Inventory tách riêng để bảo đảm Figma và acceptance criteria không bỏ sót trải nghiệm của từng role.

7. Customer Management Screens
Screen ID
Tên màn hình
Loại
Role
Mục đích
Action chính
Ưu tiên
CUS-01
Danh sách khách hàng
Page
Theo scope
Tìm kiếm, lọc, phân trang Customer.
Tạo; Xem; Sửa; Ngừng hoạt động.
MUST
CUS-02
Tạo khách hàng
Page
Role có CRUD
Tạo Doanh nghiệp/Cá nhân và Sales relation.
Lưu; Hủy; thêm Contact.
MUST
CUS-03
Sửa khách hàng
Page
Role có CRUD
Cập nhật Customer trong data scope.
Lưu; Ngừng hoạt động.
MUST
CUS-04
Chi tiết khách hàng - Tổng quan
Page/Tab
Theo scope
Thông tin Customer và metadata.
Sửa; tạo báo giá nếu Sales.
MUST
CUS-05
Chi tiết - Người liên hệ
Tab
Theo scope
Danh sách Contact, primary và trạng thái.
Thêm; Sửa; Inactive.
MUST
CUS-06
Tạo/Sửa người liên hệ
Modal/Page
Role có CRUD
Quản lý Contact.
Lưu; đặt liên hệ chính.
MUST
CUS-07
Chi tiết - Sales liên quan
Tab
Theo quyền OPEN
Xem/quản lý quan hệ N-N.
Thêm/Gỡ relation theo quyền.
SHOULD
CUS-08
Chi tiết - Báo giá
Tab
Theo quotation scope
Quotation của Customer mà user được xem.
Mở chi tiết.
MUST
CUS-09
Chi tiết - Lịch sử thay đổi
Tab
Theo scope
Audit Customer, Contact và relation.
Xem read-only.
SHOULD

**Routes triển khai (2026-11):** `CUS-01` `/customers`; `CUS-02` `/customers/new`; `CUS-03` `/customers/:code/edit`; `CUS-04`–`CUS-09` dưới `/customers/:code` (tabs contacts, sales, quotes, history); modal contact `.../contacts/new`, `.../contacts/:contactId/edit`; xác nhận Ngừng hoạt động `.../deactivate`, `.../contacts/:contactId/deactivate`. Chi tiết: `spec-deltas/2026-11-08-customer-ui-mvp.md`.

8. History & Versioning Screens
Screen ID
Tên màn hình
Loại
Role
Mục đích
Action chính
Ưu tiên
HIS-01
Timeline báo giá
Tab/Page
Theo scope
Sự kiện theo thời gian và cycle.
Lọc cycle; mở event.
MUST
HIS-02
Danh sách revision
Page/Drawer
Theo scope
Revision Envers của quotation.
Mở revision.
SHOULD
HIS-03
Chi tiết revision
Page/Mode
Theo scope
Dữ liệu tại revision read-only.
Quay về revision list.
SHOULD
HIS-04
Lịch sử SLA theo task
Tab/Drawer
Theo scope
Start, deadline, complete, actual duration, late/on-time.
Lọc cycle/task.
MUST

9. Reporting Screens
Screen ID
Tên màn hình
Loại
Role
Mục đích
Action chính
Ưu tiên
RPT-01
Báo cáo vận hành
Page
Theo scope
Workflow status, New/Re-submit, task và SLA.
Lọc thời gian/status/role.
SHOULD
RPT-02
Báo cáo kết quả kinh doanh
Page
Theo scope
Sent, Won, Lost, tỷ lệ và tổng giá trị Won.
Lọc thời gian/Sales nếu có quyền.
SHOULD
RPT-03
Báo cáo hiệu suất phòng ban
Page
Phòng ban/GĐ/Admin
Thời gian trung bình và số task quá hạn.
Lọc phòng ban/thời gian.
SHOULD
RPT-04
Báo cáo Re-submit
Page
Theo scope
Tỷ lệ và số lần re-submit trung bình.
Lọc thời gian/cycle.
SHOULD

10. Administration Screens
Screen ID
Tên màn hình
Loại
Role
Mục đích
Action chính
Ưu tiên
ADM-01
Danh sách người dùng
Page
Admin
Tìm, lọc account theo role/status.
Tạo; mở chi tiết; khóa/mở.
MUST
ADM-02
Tạo người dùng
Page/Modal
Admin
Tạo account và đúng một role.
Lưu; Hủy.
MUST
ADM-03
Chi tiết/Sửa người dùng
Page
Admin
Sửa hồ sơ và trạng thái account.
Lưu; khóa/mở; reset password.
MUST
ADM-04
Reset mật khẩu
Modal/Flow
Admin
Khởi tạo reset password.
Xác nhận.
MUST
ADM-05
Thay account cũ
Page/Modal
Admin
Hỗ trợ thay account khi nhân sự nghỉ việc.
Tạo/thay active account; không chuyển quotation.
SHOULD
ADM-06
Danh sách cấu hình SLA
Page
Admin
Xem 6 công đoạn với New/Re-submit.
Sửa cấu hình.
MUST
ADM-07
Sửa cấu hình SLA
Page/Modal
Admin
Cập nhật duration > 0 và effective time.
Lưu; Hủy.
MUST
ADM-08
Lịch sử cấu hình SLA
Page/Drawer
Admin
Xem before/after, actor và timestamp.
Mở chi tiết thay đổi.
SHOULD

11. Shared Modals, Drawers và System States
Screen ID
Tên màn hình
Loại
Role
Mục đích
Action chính
Ưu tiên
SHR-01
Xác nhận Submit
Modal
Sales
Cảnh báo khóa dữ liệu sau Submit.
Xác nhận/Hủy.
MUST
SHR-02
Xác nhận Hủy Draft
Modal
Sales
Xác nhận chuyển CANCELLED.
Hủy báo giá/Quay lại.
MUST
SHR-03
Xác nhận Hoàn thành Task
Modal
Task role
Cảnh báo section bị khóa.
Hoàn thành/Quay lại.
MUST
SHR-04
Phê duyệt báo giá
Modal
Giám đốc
Ghi chú tùy chọn và xác nhận.
Phê duyệt/Hủy.
MUST
SHR-05
Từ chối báo giá
Modal
Giám đốc
Nhập lý do bắt buộc.
Từ chối/Hủy.
MUST
SHR-06
Cập nhật Outcome
Modal
Sales Owner
Xác nhận Sent/Won/Lost.
Lưu/Hủy.
MUST
SHR-07
Nhập lý do Re-submit
Modal
Sales Owner
Nhập lý do bắt buộc.
Tiếp tục/Hủy.
MUST
SHR-08
Xác nhận Ngừng hoạt động Customer
Modal
Role có CRUD
Cảnh báo không dùng cho quotation mới.
Xác nhận/Hủy.
MUST
SHR-09
Xác nhận xóa dữ liệu chưa dùng
Modal
Role có CRUD
Xác nhận action rủi ro.
Xóa/Hủy.
SHOULD
SHR-10
Upload tệp
Shared Component
Theo role
Chọn/drop file và hiển thị tiến độ/lỗi.
Upload; xóa file khi còn mở.
MUST
SHR-11
Preview/Download tệp
Modal/Drawer
Theo scope
Xem metadata, preview loại hỗ trợ hoặc tải.
Đóng/Tải xuống.
SHOULD
SHR-12
Loading State
State
Tất cả
Ngăn double action khi tải/xử lý.
Không.
MUST
SHR-13
Empty State
State
Tất cả
Giải thích không có dữ liệu và action phù hợp.
Tạo mới/đổi filter.
MUST
SHR-14
Validation State
State
Tất cả
Hiển thị lỗi gần field và summary nếu cần.
Sửa dữ liệu.
MUST
SHR-15
Unauthorized/Forbidden
Page/State
Tất cả
Thông báo không có quyền, không lộ dữ liệu.
Về Dashboard.
MUST
SHR-16
Not Found
Page/State
Tất cả
Object không tồn tại hoặc không thể truy cập.
Về danh sách.
MUST
SHR-17
Conflict/Stale Data
Modal/State
Tất cả
Dữ liệu đã thay đổi hoặc action đã xử lý.
Tải lại.
MUST

12. Sitemap đề xuất
Menu cấp 1
Menu/Route con
Role
Tổng quan
/dashboard
Tất cả
Báo giá
/quotations; /quotations/new; /quotations/{id}; /quotations/{id}/resubmit
Theo scope; create/resubmit Sales
Công việc
/tasks hoặc widget/list từ dashboard
EXECUTOR, QA, R&D, Kế toán, Giám đốc
Khách hàng
/customers; /customers/new; /customers/{id}; /customers/{id}/edit
Theo Customer scope
Báo cáo
/reports/operations; /reports/business; /reports/performance; /reports/resubmit
Theo scope
Quản trị
/admin/users; /admin/sla-config
Admin
Tài khoản
/profile
Tất cả

Route names chỉ là đề xuất cho frontend. Screen Inventory chốt phạm vi UI, không bắt buộc URL cuối cùng.

13. Coverage Matrix theo role
Nhóm màn hình
Sales
EXECUTOR
QA
R&D
Kế toán
Giám đốc
Admin
Authentication
Có
Có
Có
Có
Có
Có
Có
Dashboard biến thể
Sales
EXECUTOR
QA
R&D
Kế toán
Giám đốc
Admin
Quotation list/detail
Owner only
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ RO
Create/Edit Draft
Có
-
-
-
-
-
-
Task processing
Outcome only
Intake/Consolidation
QA
R&D
Accounting
Decision
-
Customer
Scope relation
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Reporting
Scope mình
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
User/SLA Admin
-
-
-
-
-
-
Có

14. Cấu trúc file Figma đề xuất
Figma Page
Nội dung
00 - Cover & Notes
Baseline, legend, open details.
01 - Foundations
Color, typography, spacing, grid, icon, status badges.
02 - Shared Components
Header, sidebar, table, form, upload, modal, toast, empty/error states.
03 - Authentication
AUTH screens.
04 - Dashboard
7 role variants.
05 - Quotations
List, create/edit, detail tabs, clone, re-submit, outcome.
06 - Tasks
Role-specific task panels/flows.
07 - Customers
List, create/edit/detail, contacts, Sales relations.
08 - History & Reports
Timeline, revision, SLA history, reports.
09 - Administration
Users and SLA configuration.
10 - Prototype Flows
End-to-end demo connections.
11 - Edge States
Loading, empty, validation, forbidden, conflict.

15. Bắt buộc thiết kế các trạng thái/biến thể
Component/Screen
Biến thể cần có
Quotation row
Normal, WARNING, OVERDUE, selected, loading.
Task panel
PENDING, IN_PROGRESS, COMPLETED, WARNING, OVERDUE, read-only.
Action bar
Theo role/status/outcome; disabled/loading.
Form field
Default, focused, filled, required error, disabled/read-only.
File upload
Empty, uploading, success, invalid type, oversize, 10-file limit.
Similar carousel
Có kết quả; không có kết quả; loading; lỗi.
Customer
Active, inactive, business, individual, no contact warning.
Dashboard KPI
Count > 0; count = 0 không hiển thị số; loading/error.
History
Một cycle, nhiều cycle, re-submit, empty revision.
Modal
Default, validation error, submitting, success/conflict.

16. Thứ tự thiết kế và triển khai màn hình
Giai đoạn
Màn hình ưu tiên
Mục tiêu
1. Foundation
AUTH-01, layout, sidebar, shared table/form/modal/state.
Có shell ứng dụng và component nền.
2. Customer Core
CUS-01 đến CUS-06.
Tạo Customer/Contact cho quotation.
3. Quotation Sales
QUO-01 đến QUO-05, SHR-01/02/10.
Tạo Draft và Submit.
4. Workflow Tasks
TASK-01 đến TASK-06, QUO-06 đến QUO-10.
Chạy workflow end-to-end.
5. SLA/Dashboard
DASH role variants, TASK-07, alert variants.
Theo dõi và ưu tiên công việc.
6. Outcome/Re-submit/Clone
QUO-13/14 và SHR-06/07.
Hoàn thiện vòng đời Sales.
7. History/Attachments
QUO-11/12, HIS-01 đến HIS-04.
Audit và versioning.
8. Reports/Admin
RPT-* và ADM-*.
Hoàn thiện MVP quản trị/demo.

17. Acceptance Criteria của Screen Inventory
Mọi feature MUST trong MVP Feature List có ít nhất một màn hình hoặc action UI tương ứng.
Mọi role có landing experience và đường dẫn tới công việc chính.
Quotation detail thể hiện đủ dữ liệu Sales, QA, R&D, EXECUTOR, Kế toán, Giám đốc, attachment và history.
Sales có đủ UI cho New, Draft, Submit, Cancel, Clone, Outcome và Re-submit.
Customer có đủ list/create/edit/detail/contact/relation/quotation access.
SLA có đủ normal, warning, overdue và history representation.
Admin có user management và SLA configuration nhưng không có workflow action.
Loading, empty, validation, forbidden, not found và conflict không bị bỏ sót.
18. Chi tiết còn mở
Open ID
Nội dung
Ảnh hưởng
SCR-O01
Dashboard dùng một page adaptive hay nhiều page/route riêng.
Implementation; không đổi nội dung.
SCR-O02
Task processing là panel trong quotation detail hay route riêng.
Navigation/Figma.
SCR-O03
Director có Start action hay chỉ Approve/Reject.
TASK-06 variant.
SCR-O04
EXECUTOR Intake có note/file tùy chọn hay không hiển thị.
TASK-01 scope.
SCR-O05
Quản lý Sales relation là tab editable cho role nào.
CUS-07.
SCR-O06
Preview file hay download-only cho từng format.
SHR-11.
SCR-O07
Export reporting có vào MVP không.
RPT screens.
SCR-O08
Responsive ngoài desktop cần tới mức nào.
Figma variants.
SCR-O09
Layout History dùng tab, drawer hay route.
HIS screens.
SCR-O10
Có cần màn hình riêng cho audit Customer hay gộp tab.
CUS-09.
