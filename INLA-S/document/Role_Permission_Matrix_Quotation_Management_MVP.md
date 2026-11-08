# Role Permission Matrix Quotation Management MVP

> Converted from `Role_Permission_Matrix_Quotation_Management_MVP.docx` (Word baseline). **Source of truth:** this Markdown file.
> Annex/deltas: `annex/`, `spec-deltas/`. Templates: `templates/`.
ROLE & PERMISSION MATRIX
Hệ thống quản lý quy trình báo giá thùng carton
Phiên bản
Baseline 0.1
Ngày
13/10/2026
Phạm vi
MVP
Nội dung
Quyền chức năng và phạm vi dữ liệu theo role
Ngôn ngữ UI
Tiếng Việt
Trạng thái tài liệu
Tài liệu làm việc tạm thời


1. Mục đích và nguyên tắc
Tài liệu định nghĩa ai được xem dữ liệu nào, thực hiện hành động nào và sửa phần dữ liệu nào trong MVP. Ma trận này là đầu vào cho thiết kế UI, route guard, API authorization, kiểm thử bảo mật và cấu hình Amazon Cognito group.
Quy tắc quan trọng: quyền trên giao diện chỉ hỗ trợ trải nghiệm. Backend phải kiểm tra lại role, data scope, ownership, workflow status và task status trước mọi thao tác ghi dữ liệu.

1.1 Ký hiệu sử dụng
Ký hiệu
Ý nghĩa
V
Được xem trong phạm vi dữ liệu được cấp.
C
Được tạo.
E
Được sửa.
A
Được thực hiện action nghiệp vụ.
M
Được quản trị.
RO
Chỉ đọc.
-
Không có quyền.
Owner
Chỉ khi user là Sales Owner của quotation.
Task
Chỉ khi task hiện tại thuộc role và đang active.

2. Danh sách role và phạm vi trách nhiệm
Code role
Label UI
Số account
Trách nhiệm
Phạm vi xem quotation
SALES
Nhân viên Sales
Nhiều
Customer liên quan; tạo/submit/clone/re-submit quotation; cập nhật outcome.
Chỉ quotation do chính account sở hữu.
EXECUTOR
Trưởng phòng Kế hoạch
Chính xác 1
Tiếp nhận, điều phối QA/R&D, tổng hợp đơn giá.
Toàn bộ.
QA
QA
Theo cấu hình vận hành
Đánh giá chất lượng và yêu cầu chất lượng.
Toàn bộ.
RND
R&D
Theo cấu hình vận hành
Cung cấp chi phí bản in/khuôn và ngày dự kiến.
Toàn bộ.
ACCOUNTING
Kế toán
Theo cấu hình vận hành
Nhập thông tin tài chính và giá trị cuối cùng.
Toàn bộ.
DIRECTOR
Giám đốc
Theo cấu hình vận hành
Phê duyệt hoặc từ chối.
Toàn bộ.
ADMIN
Quản trị hệ thống
Theo cấu hình vận hành
Quản lý account, SLA; xem dữ liệu để hỗ trợ vận hành.
Toàn bộ, nhưng không xử lý nghiệp vụ thay role.

Mỗi account thuộc đúng một business role/Cognito group.
Không có permission editor động trong MVP.
EXECUTOR là thuật ngữ thực tế đã chốt; không đổi thành PLANNING.
Admin không mặc nhiên có quyền Complete, Approve, Reject hoặc cập nhật outcome.
3. Data Scope Matrix
Đối tượng dữ liệu
SALES
EXECUTOR
QA
R&D
Kế toán
Giám đốc
ADMIN
Quotation
Chỉ Owner
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ RO
Customer
Có quan hệ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Người liên hệ
Theo Customer
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Task hiện tại
Task của quotation Owner nếu có action Sales
Theo role
Theo role
Theo role
Theo role
Theo role
RO
Workflow history
Quotation Owner
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Attachment
Quotation Owner
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Dashboard
Dữ liệu của mình
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Reporting
Dữ liệu của mình
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
Toàn bộ
User account
Hồ sơ mình
Hồ sơ mình
Hồ sơ mình
Hồ sơ mình
Hồ sơ mình
Hồ sơ mình
Toàn bộ
SLA config
RO nếu hiển thị
RO
RO
RO
RO
RO
M

Customer access không suy ra Quotation access. Hai Sales có thể cùng xem một Customer nếu cùng được liên kết, nhưng Sales A không được xem quotation của Sales B.

3.1 Quy tắc Sales Owner
Mỗi quotation có đúng một Sales Owner là account Sales tạo quotation.
Chỉ đúng Sales Owner được xem và thao tác quotation đó.
Không có chức năng chuyển quotation từ Sales A sang Sales B.
Admin không được đổi Sales Owner trên ứng dụng.
Các role phòng ban xem toàn bộ quotation nhưng chỉ sửa phần dữ liệu của task thuộc role.
3.2 Quy tắc Customer–Sales
Customer và Sales có quan hệ nhiều-nhiều.
Sales chỉ xem Customer có quan hệ với account Sales đó.
Các role khác và Admin xem toàn bộ Customer.
Mọi role được tạo và sửa Customer trong phạm vi xem của mình, theo quyết định baseline.
Customer ngừng hoạt động vẫn được xem trong lịch sử nhưng không được chọn cho quotation mới.
4. Quyền truy cập module và màn hình
Module/Màn hình
SALES
EXECUTOR
QA
R&D
Kế toán
Giám đốc
ADMIN
Đăng nhập / Hồ sơ cá nhân
V
V
V
V
V
V
V
Dashboard
V scope mình
V toàn bộ
V toàn bộ
V toàn bộ
V toàn bộ
V toàn bộ
V toàn bộ
Danh sách quotation
V Owner
V
V
V
V
V
V RO
Tạo quotation
C
-
-
-
-
-
-
Chi tiết quotation
V Owner
V
V
V
V
V
V RO
Customer list/detail
V scope
V
V
V
V
V
V
Tạo/sửa Customer/Contact
C/E scope
C/E
C/E
C/E
C/E
C/E
C/E
Workflow task panel
V Owner
V/A task
V/A task
V/A task
V/A task
V/A task
V RO
History/Revision
V Owner
V
V
V
V
V
V
Báo giá tương tự
-
V tại tổng hợp
-
-
-
-
V RO
Reporting
V scope mình
V
V
V
V
V
V
User Management
-
-
-
-
-
-
M
SLA Configuration
-
-
-
-
-
-
M

5. Customer & Người liên hệ Permission Matrix
Action
SALES
EXECUTOR
QA
R&D
Kế toán
Giám đốc
ADMIN
Điều kiện
Xem danh sách/chi tiết
V scope
V
V
V
V
V
V
Data scope áp dụng.
Tạo Customer
C
C
C
C
C
C
C
Field bắt buộc hợp lệ.
Sửa Customer
E scope
E
E
E
E
E
E
Trong data scope.
Thêm Người liên hệ
C scope
C
C
C
C
C
C
Doanh nghiệp phải có >=1 contact.
Sửa Người liên hệ
E scope
E
E
E
E
E
E
Trong Customer scope.
Đặt liên hệ chính
E scope
E
E
E
E
E
E
Theo Customer.
Liên kết Customer–Sales
Theo flow UI
Theo flow UI
Theo flow UI
Theo flow UI
Theo flow UI
Theo flow UI
M
Chi tiết UX còn mở; không vượt data scope.
Ngừng hoạt động
A scope
A
A
A
A
A
A
Không xóa lịch sử.
Xóa Customer chưa dùng
A scope
A
A
A
A
A
A
Chỉ khi chưa có quotation; xác nhận rủi ro.
Xóa Customer đã dùng
-
-
-
-
-
-
-
Tuyệt đối không hard delete.

Baseline đã chốt là tất cả business role có quyền xem/tạo/sửa Customer trong phạm vi dữ liệu. Đây là quyền rộng và cần được backend audit đầy đủ; tài liệu không tự thu hẹp quyền này.

6. Quotation Lifecycle Permission Matrix
Action
SALES
EXECUTOR
QA
R&D
Kế toán
Giám đốc
ADMIN
Điều kiện
Tạo quotation
C
-
-
-
-
-
-
Sales tự trở thành Owner.
Sửa Draft
E Owner
-
-
-
-
-
-
Current cycle DRAFT.
Lưu Draft
A Owner
-
-
-
-
-
-
Cho phép form chưa hoàn chỉnh.
Submit New
A Owner
-
-
-
-
-
-
Pass validation.
Hủy Draft
A Owner
-
-
-
-
-
-
Chỉ trước Submit.
Clone quotation
A Owner
-
-
-
-
-
-
Tạo Draft độc lập.
Xem quotation
V Owner
V
V
V
V
V
V RO
Data scope.
Sửa dữ liệu Sales sau Submit
-
-
-
-
-
-
-
Bị khóa trong workflow.
Cập nhật Sent
A Owner
-
-
-
-
-
-
Workflow APPROVED; outcome NOT_UPDATED.
Cập nhật Won
A Owner
-
-
-
-
-
-
APPROVED + NOT_UPDATED/SENT.
Cập nhật Lost
A Owner
-
-
-
-
-
-
APPROVED + NOT_UPDATED/SENT.
Khởi tạo Re-submit
A Owner
-
-
-
-
-
-
REJECTED hoặc LOST.
Sửa dữ liệu Re-submit Draft
E Owner
-
-
-
-
-
-
Trước submit cycle mới.
Chuyển Sales Owner
-
-
-
-
-
-
-
Không tồn tại chức năng.

7. Workflow Task Permission Matrix
Task/Action
SALES
EXECUTOR
QA
R&D
Kế toán
Giám đốc
ADMIN
EXECUTOR Intake - Start/Complete
-
A Task
-
-
-
-
-
QA Review - Start/Complete
-
-
A Task
-
-
-
-
R&D Review - Start/Complete
-
-
-
A Task
-
-
-
EXECUTOR Consolidation - Start/Complete
-
A Task
-
-
-
-
-
Accounting Review - Start/Complete
-
-
-
-
A Task
-
-
Director Review - Approve/Reject
-
-
-
-
-
A Task
-
Xem task phòng ban khác
V Owner RO
V RO
V RO
V RO
V RO
V RO
V RO
Return/Request Info/Reopen
-
-
-
-
-
-
-
Pause/Extend SLA
-
-
-
-
-
-
-

Task role có thể PENDING→IN_PROGRESS→COMPLETED hoặc PENDING→COMPLETED.
Chỉ active task của đúng role mới được sửa/hoàn thành.
Task COMPLETED chuyển chỉ đọc; không role nào mở lại trong MVP.
Admin không được thao tác workflow dù xem toàn bộ.
8. Field Ownership Matrix
Nhóm dữ liệu
Owner được nhập/sửa
Role khác
Thời điểm khóa
Customer/Contact
Các role theo Customer scope
Xem/sửa theo baseline CRUD rộng
Theo trạng thái Customer; audit mọi thay đổi.
Thông tin yêu cầu carton
Sales Owner
RO
Khi Submit; mở lại khi chuẩn bị Re-submit.
Lý do Re-submit
Sales Owner
RO
Khi submit cycle Re-submit.
QA result/quality requirement/note
QA
RO
Khi QA Complete.
R&D printing/die cost & dates/note
R&D
RO
Khi R&D Complete.
EXECUTOR unit price/production/delivery/note
EXECUTOR
RO
Khi consolidation Complete.
R&D cost trên form EXECUTOR
R&D là nguồn
EXECUTOR RO
Không được EXECUTOR sửa.
Accounting payment/VAT/adjustment/final value
Kế toán
RO
Khi Accounting Complete.
Approval note/reject reason
Giám đốc
RO
Khi Approve/Reject.
Business Outcome
Sales Owner
RO
Theo outcome transitions.
Audit/Revision/SLA history
Hệ thống
Tất cả RO theo scope
Bất biến theo event/revision.

9. Attachment Permission Matrix
Action
Sales
EXECUTOR
QA
R&D
Kế toán
Giám đốc
Admin
Quy tắc
Upload trong phần của mình
A Owner
A Task
A Task
A Task
A Task
-
-
Tối đa 10 tệp mỗi role/task.
Xem attachment
V Owner
V
V
V
V
V
V
Theo quotation data scope.
Download/Preview
V Owner
V
V
V
V
V
V
Theo loại file được hỗ trợ.
Xóa file trước Complete
A Owner/Draft
A Task
A Task
A Task
A Task
-
-
Chỉ file do mình upload, task còn mở.
Xóa file sau Complete
-
-
-
-
-
-
-
Không cho sửa lịch sử.
Dùng file task trước để pass validation
-
-
-
-
-
-
-
Bị cấm.
Chọn file khi Clone
A Owner
-
-
-
-
-
-
Không copy mặc định.

QA, R&D và EXECUTOR tổng hợp bắt buộc có ít nhất một attachment do chính role/task cung cấp trước Complete.
Kế toán và Sales attachment tùy chọn; EXECUTOR intake chưa có yêu cầu attachment bắt buộc.
Frontend và backend cùng validate; backend là lớp kiểm soát cuối.
10. History, Dashboard và Reporting Permissions
Chức năng
SALES
Các phòng ban
Giám đốc
ADMIN
Quy tắc
Timeline quotation
V Owner
V toàn bộ
V toàn bộ
V toàn bộ
Read-only.
Xem revision
V Owner
V toàn bộ
V toàn bộ
V toàn bộ
Read-only; không diff song song MVP.
Task/SLA history
V Owner
V toàn bộ
V toàn bộ
V toàn bộ
Theo data scope.
Dashboard vận hành
Dữ liệu Owner
Toàn bộ
Toàn bộ
Toàn bộ
Role UI có thể ưu tiên task tương ứng.
Dashboard outcome
Dữ liệu Owner
Toàn bộ
Toàn bộ
Toàn bộ
Sent/Won/Lost và giá trị.
Reporting
Dữ liệu Owner
Toàn bộ
Toàn bộ
Toàn bộ
Bộ lọc không được vượt data scope.
Export report
Chưa chốt
Chưa chốt
Chưa chốt
Chưa chốt
COULD; chưa thuộc baseline bắt buộc.

11. Admin Permission Matrix
Chức năng Admin
Quyền
Ràng buộc
Xem danh sách account
M
Xem role, trạng thái và thông tin liên hệ.
Tạo Sales account
M
Theo nhu cầu vận hành.
Quản lý account QA/R&D/Kế toán/Giám đốc
M
Theo quy tắc account cố định của khách hàng.
Tạo EXECUTOR account
M có ràng buộc
Chỉ khi chưa tồn tại; hệ thống chặn account EXECUTOR thứ hai.
Sửa họ tên/email/số điện thoại
M
Audit người và thời điểm thay đổi.
Khóa/Mở khóa account
M
Không xóa lịch sử.
Reset mật khẩu
M
Theo cơ chế Cognito.
Thay account cũ khi nghỉ việc
M
Không đồng nghĩa chuyển quotation Sales.
Xem toàn bộ quotation/Customer/history
V
Chế độ đọc cho quotation workflow.
Complete task/Approve/Reject/Outcome
-
Tuyệt đối không có quyền mặc định.
Xem/Sửa SLA configuration
M
Cấu hình mới không hồi tố task đang chạy.
Permission editor động
-
Không thuộc MVP.

12. Quy tắc kiểm tra quyền tại Backend
Lớp kiểm tra
Câu hỏi bắt buộc
Ví dụ
Authentication
Token có hợp lệ và chưa hết hạn?
JWT từ Cognito.
Role
Account thuộc đúng group được phép gọi action?
Chỉ DIRECTOR gọi approve/reject.
Data scope
User có quyền xem object?
Sales chỉ quotation Owner; Customer phải có quan hệ.
Ownership
Action có yêu cầu Sales Owner?
Submit, clone, outcome, re-submit.
Workflow status
Action có hợp lệ ở trạng thái hiện tại?
Cancel chỉ DRAFT; outcome chỉ APPROVED.
Task assignment
Task có active và thuộc role?
QA chỉ complete QA task hiện tại.
Field ownership
Payload có sửa field của role khác?
EXECUTOR không sửa chi phí R&D.
Validation
Field/attachment bắt buộc đã đủ?
QA cần >=1 attachment riêng.
Concurrency
Resource version còn mới?
Optimistic locking.
Audit
Transition và thay đổi đã được ghi nhận?
Actor, role, timestamp, before/after.

Không tin dữ liệu role, ownerId hoặc taskId do frontend gửi. Backend lấy identity từ JWT và xác minh quan hệ trực tiếp trong dữ liệu.

13. Cognito Group Mapping đề xuất cho MVP
Cognito Group
Business Role
Ghi chú
SALES
SALES
Nhiều account; data scope theo Sales Owner và Customer relation.
EXECUTOR
EXECUTOR
Chính xác một account active.
QA
QA
Một role/account; không kiêm role khác.
RND
RND
Một role/account; không kiêm role khác.
ACCOUNTING
ACCOUNTING
Một role/account; không kiêm role khác.
DIRECTOR
DIRECTOR
Có quyền quyết định nội bộ.
ADMIN
ADMIN
Quản trị, không được workflow action.

Giữ mapping một group tương ứng một business role.
Không cần scope chi tiết cho từng button trong token; backend kiểm tra role + state + ownership.
Không gán ADMIN đồng thời với business role trong MVP.
Các route/action frontend được derive từ role, nhưng backend là nguồn quyết định cuối.
14. Action/Command Authorization Map
Command nghiệp vụ
Role cho phép
Data scope/Guard
CreateCustomer
Tất cả business role + Admin
Customer được tạo phải liên kết ít nhất với Sales phù hợp theo UX được chốt.
UpdateCustomer
Tất cả business role + Admin
Sales phải có Customer relation; role khác toàn bộ.
DeactivateCustomer
Tất cả business role + Admin
Theo data scope; không hard delete lịch sử.
CreateQuotation
SALES
Customer có quan hệ; creator trở thành Owner.
UpdateDraftQuotation
SALES
Owner + DRAFT.
SubmitQuotation
SALES
Owner + DRAFT + validation.
CancelQuotation
SALES
Owner + DRAFT.
CloneQuotation
SALES
Source quotation thuộc Owner.
StartTask
EXECUTOR/QA/RND/ACCOUNTING
Active task của đúng role.
CompleteTask
EXECUTOR/QA/RND/ACCOUNTING
Active task + field/attachment validation.
ApproveQuotation
DIRECTOR
Active DIRECTOR_REVIEW task.
RejectQuotation
DIRECTOR
Active task + lý do bắt buộc.
UpdateOutcome
SALES
Owner + APPROVED + transition hợp lệ.
PrepareResubmit
SALES
Owner + REJECTED hoặc LOST.
SubmitResubmit
SALES
Owner + RE_SUBMIT DRAFT + lý do/validation.
ViewQuotationHistory
Theo quotation scope
Sales Owner; role khác/Admin toàn bộ.
ManageUsers
ADMIN
Không cấp workflow action.
ManageSlaConfig
ADMIN
Không hồi tố active task.

15. Các trường hợp bắt buộc từ chối
Sales truy cập quotation không thuộc mình, kể cả cùng Customer.
Sales truy cập Customer không có quan hệ.
Role phòng ban sửa dữ liệu Sales hoặc dữ liệu phòng ban khác.
Admin Complete/Approve/Reject hoặc cập nhật outcome.
QA/R&D/Kế toán/EXECUTOR Reject quotation.
Sales sửa/cancel sau Submit.
Role task Complete task đã hoàn thành hoặc task không active.
Sales re-submit quotation không ở REJECTED hoặc LOST.
Cập nhật Sent/Won/Lost trước APPROVED hoặc bởi Sales không phải Owner.
Xóa Customer đã có quotation.
Tạo EXECUTOR account thứ hai.
Gán nhiều business role cho một account.
16. Quy tắc UI theo quyền
Loại kiểm soát
Quy tắc UI
Menu/Route
Ẩn module không thuộc role; truy cập URL trực tiếp vẫn phải bị backend chặn.
Button
Chỉ hiển thị action hợp lệ theo role + ownership + state + task.
Field
Field của role khác ở read-only; không chỉ disable bằng CSS mà không có backend check.
Quotation list
Sales không có filter Sales Owner để khám phá Sales khác; dữ liệu API đã scope trước.
Customer list
Sales chỉ nhận Customer có relation; các role khác nhận toàn bộ.
Admin view
Hiển thị rõ read-only đối với workflow action.
Unauthorized
Hiển thị thông báo tiếng Việt phù hợp, không lộ dữ liệu nhạy cảm.
Audit
Các action rủi ro có confirmation và được lưu lịch sử.

17. Kịch bản kiểm thử Permission tối thiểu
ID
Kịch bản
Kết quả mong đợi
PM-01
Sales A mở quotation Sales B
Bị từ chối; không lộ thông tin.
PM-02
Sales A và B cùng liên quan Customer X
Cả hai xem Customer X; chỉ xem quotation của chính mình.
PM-03
QA sửa field R&D
Bị chặn ở UI và backend.
PM-04
EXECUTOR sửa chi phí bản in/khuôn
Bị chặn; field read-only từ R&D.
PM-05
Admin gọi approve API
Bị từ chối dù xem được quotation.
PM-06
Sales Owner cập nhật Won trực tiếp từ Approved
Được phép.
PM-07
Sales khác cập nhật outcome
Bị từ chối.
PM-08
QA Complete thiếu file của QA
Bị từ chối dù có file Sales.
PM-09
Business role tạo/sửa Customer trong scope
Được phép và audit.
PM-10
Xóa Customer đã có quotation
Bị chặn; chỉ Ngừng hoạt động.
PM-11
Tạo EXECUTOR thứ hai
Bị chặn.
PM-12
Gán account vào hai Cognito groups
Bị chặn/không chấp nhận cấu hình.
PM-13
Direct URL vào Admin page bởi non-Admin
Bị chặn frontend và backend.
PM-14
Role phòng ban xem toàn bộ quotation
Được xem nhưng chỉ sửa task của mình.

18. Baseline và chi tiết còn mở
18.1 Quyết định đã chốt
Sales quotation scope theo Owner; không chuyển Owner.
Customer nhiều-nhiều với Sales; Sales xem Customer liên quan.
Các phòng ban và Admin xem toàn bộ quotation/Customer.
Mỗi role chỉ sửa phần task của mình; Admin không thao tác nghiệp vụ.
Tất cả business role có CRUD Customer trong data scope.
Một account một role; EXECUTOR chính xác một account; không permission editor động.
18.2 Chi tiết cần làm rõ sau, không thay đổi matrix cốt lõi
UX và actor cụ thể được phép thêm/xóa quan hệ Customer–Sales khi Customer đã tồn tại.
Quy tắc xử lý account Sales nghỉ việc khi không cho chuyển quotation.
Chính sách API trả 403 hay 404 cho object ngoài data scope.
Permission cho export report nếu chức năng được đưa vào MVP.
Khả năng user tự sửa hồ sơ cá nhân ngoài Admin.
