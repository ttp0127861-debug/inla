# UI Workflow Quotation Management MVP

> Converted from `UI_Workflow_Quotation_Management_MVP.docx` (Word baseline). **Source of truth:** this Markdown file.
> Annex/deltas: `annex/`, `spec-deltas/`. Templates: `templates/`.
UI WORKFLOW
Hệ thống quản lý quy trình báo giá thùng carton
Phiên bản
Baseline 0.1
Ngày
13/10/2026
Phạm vi
MVP
Nội dung
Luồng thao tác trên giao diện theo từng role
Ngôn ngữ UI
Tiếng Việt
Trạng thái
Tài liệu làm việc tạm thời


1. Mục đích và phạm vi
Tài liệu mô tả luồng thao tác trên giao diện theo từng role, từ điểm vào, màn hình, hành động, validation, phản hồi hệ thống đến bước tiếp theo. Đây là cầu nối giữa nghiệp vụ đã chốt với Screen Inventory, Figma prototype và UI code.
UI chỉ hiển thị action hợp lệ theo role, ownership, workflow status và task status. Backend vẫn phải kiểm tra lại toàn bộ quyền và điều kiện trước khi thực hiện action.

2. Nguyên tắc UI Workflow chung
Desktop-first, toàn bộ label tiếng Việt.
Người dùng đăng nhập được đưa đến Dashboard theo role.
Từ Dashboard có thể mở trực tiếp công việc ưu tiên hoặc danh sách đã lọc.
Workflow Status, Task Status, Business Outcome và Cảnh báo SLA phải hiển thị tách biệt.
Task có thể đi PENDING → IN_PROGRESS → COMPLETED hoặc PENDING → COMPLETED.
Không có Return, Request More Information, Reopen hoặc Pause SLA trong MVP.
Action rủi ro như Hủy, Từ chối, Xóa và Ngừng hoạt động phải có hộp thoại xác nhận.
Màn hình chỉ cho sửa section thuộc role và task active; section khác read-only.
Màu SLA luôn đi cùng badge/text/icon, không chỉ dựa vào màu.
Loading, empty, validation, error và unauthorized state phải được thiết kế.
3. Điều hướng và điểm vào chung
Khu vực
Nội dung
Role
Sidebar
Tổng quan; Báo giá; Khách hàng; Báo cáo; Quản trị tùy role.
Theo role.
Header
Tên người dùng, role, hồ sơ, đăng xuất.
Tất cả.
Dashboard
KPI, công việc chờ xử lý, Cảnh báo SLA, danh sách ưu tiên.
Theo data scope.
Danh sách Báo giá
Tìm kiếm, lọc, phân trang, mở chi tiết.
Theo quotation scope.
Chi tiết Báo giá
Tổng quan, dữ liệu phòng ban, task panel, attachment, lịch sử.
Theo role/status.
Khách hàng
Danh sách, chi tiết, Contact và Sales liên quan.
Theo Customer scope.
Quản trị
Người dùng và cấu hình SLA.
Admin.

4. Landing page theo role
Role
Thông tin ưu tiên
Action nhanh
Sales
Báo giá của tôi; Draft; Approved chưa cập nhật; Won/Lost; alert trong quotation của mình.
Tạo báo giá; Tạo khách hàng; mở Draft; cập nhật outcome.
EXECUTOR
Task tiếp nhận/tổng hợp; warning/overdue; toàn bộ workflow.
Mở công việc ưu tiên; Complete intake/consolidation.
QA
Task QA đang chờ/đang xử lý; warning/overdue.
Mở QA task; nhập dữ liệu; upload; Complete.
R&D
Task R&D đang chờ/đang xử lý; warning/overdue.
Mở R&D task; nhập chi phí/ngày; upload; Complete.
Kế toán
Task Kế toán; warning/overdue.
Mở task; nhập tài chính; Complete.
Giám đốc
Báo giá chờ quyết định; warning/overdue; KPI toàn bộ.
Mở báo giá; Approve/Reject.
Admin
Tổng quan hệ thống read-only; account; SLA config.
Quản lý người dùng; sửa SLA; xem dữ liệu.

5. UI Workflow - Sales
5.1 Tạo Customer trước khi tạo báo giá
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Dashboard/Khách hàng
Chọn “Tạo khách hàng”.
Mở form Customer.
Form tạo mới.
2
Tạo khách hàng
Chọn Doanh nghiệp/Cá nhân, nhập thông tin và Sales liên quan.
Validate inline; cho biết field bắt buộc.
Thêm Contact nếu cần.
3
Người liên hệ
Với Doanh nghiệp, thêm ít nhất một Contact; Cá nhân có thể bỏ qua.
Lưu Contact và đánh dấu liên hệ chính nếu chọn.
Quay lại form Customer.
4
Tạo khách hàng
Chọn “Lưu”.
Backend validate, tạo Customer/relation và audit.
Chi tiết khách hàng.
5
Chi tiết khách hàng
Xem tổng quan, Contact, Sales liên quan và quotation được phép xem.
Chỉ hiển thị quotation của Sales hiện tại.
Có thể Tạo báo giá.

5.2 Tạo và Submit báo giá mới
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Dashboard/Danh sách báo giá
Chọn “Tạo báo giá”.
Mở DRAFT mới; Sales hiện tại là Owner.
Form báo giá.
2
Thông tin chung
Chọn Customer và Người liên hệ.
Chỉ trả Customer active có relation; Contact theo Customer Type.
Thông tin carton.
3
Thông tin carton
Nhập loại thùng, D/R/C, vật liệu, tải trọng, in, số lượng, giao hàng và thời gian.
Validate định dạng; chưa bắt buộc đầy đủ khi Lưu nháp.
Attachment/Ghi chú.
4
Attachment
Upload tối đa 10 tệp tùy chọn.
Validate extension, MIME, size và count.
Lưu nháp/Submit.
5
Form báo giá
Chọn “Lưu nháp”.
Lưu DRAFT; toast thành công.
Giữ form hoặc về chi tiết.
6
Form báo giá
Chọn “Gửi xử lý”.
Validate toàn bộ; hiển thị lỗi inline nếu thiếu.
Confirmation dialog.
7
Xác nhận
Xác nhận Submit.
Tạo cycle NEW, task EXECUTOR_INTAKE và SLA; khóa dữ liệu Sales.
Chi tiết read-only ở EXECUTOR_INTAKE.

5.3 Quản lý Draft và Hủy
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Danh sách báo giá
Lọc “Bản nháp” và mở báo giá.
Hiển thị action Sửa/Hủy nếu Owner.
Form Draft.
2
Form Draft
Sửa và Lưu nháp.
Lưu revision và cập nhật thời gian.
DRAFT.
3
Form/Chi tiết
Chọn “Hủy báo giá”.
Hiển thị cảnh báo không thể tiếp tục workflow.
Confirm.
4
Confirmation
Xác nhận Hủy.
Backend kiểm tra DRAFT, chuyển CANCELLED và audit.
Chi tiết read-only.

5.4 Clone báo giá
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Chi tiết báo giá của tôi
Chọn “Sao chép báo giá”.
Mở bước chọn dữ liệu/attachment.
Clone dialog/page.
2
Chọn attachment
Chọn từng file Sales muốn dùng lại; mặc định không chọn.
Hiển thị chỉ file được phép copy.
Xác nhận clone.
3
Xác nhận
Chọn “Tạo bản sao”.
Tạo quotation mới DRAFT; copy Customer/Contact/carton; không copy output/history/outcome.
Form Draft mới.
4
Form Draft mới
Chỉnh dữ liệu và tiếp tục Lưu/Submit.
Hiển thị “Sao chép từ báo giá …”.
Workflow New khi Submit.

5.5 Cập nhật outcome sau APPROVED
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Dashboard/Danh sách
Mở quotation APPROVED của mình.
Hiển thị outcome panel; action theo outcome hiện tại.
Chi tiết.
2
Outcome = Chưa cập nhật
Chọn Đã gửi khách hàng, Thành công hoặc Thất bại.
Hiển thị confirmation phù hợp.
Cập nhật outcome.
3
Outcome = Đã gửi khách hàng
Chọn Thành công hoặc Thất bại.
Backend kiểm tra Owner và transition.
WON hoặc LOST.
4
Outcome = WON
Xem read-only.
Không hiển thị re-submit.
Kết thúc.
5
Outcome = LOST
Xem lý do/chi tiết và action Re-submit.
Cho phép tạo cycle mới.
Re-submit flow.

5.6 Re-submit từ REJECTED hoặc LOST
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Chi tiết quotation
Chọn “Gửi lại báo giá”.
Kiểm tra Owner và trạng thái hợp lệ.
Dialog lý do.
2
Lý do gửi lại
Nhập lý do bắt buộc.
Validate không rỗng.
Tạo cycle DRAFT RE_SUBMIT.
3
Form Re-submit
Chỉnh dữ liệu Sales; xem history cycle cũ read-only.
Giữ quotation identity; hiển thị badge Re-submit.
Lưu nháp/Submit.
4
Submit Re-submit
Chọn “Gửi xử lý”.
Validate, tạo task EXECUTOR_INTAKE với SLA Re-submit; khóa dữ liệu.
Chi tiết workflow mới.

6. UI Workflow - EXECUTOR
6.1 Tiếp nhận yêu cầu
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Dashboard
Xem “Công việc chờ tôi xử lý” và alert SLA.
Sắp overdue trước, warning sau.
Mở task intake.
2
Chi tiết báo giá
Xem Customer, Contact, dữ liệu carton, attachment Sales và SLA.
Dữ liệu Sales read-only; task panel active.
Chọn action.
3
Task panel
Tùy chọn “Bắt đầu xử lý”.
Task → IN_PROGRESS; SLA không đổi.
Tiếp tục xem.
4
Task panel
Chọn “Hoàn thành” trực tiếp hoặc sau Start.
Xác nhận; không có field chuyên môn bắt buộc.
QA/R&D tasks.
5
Sau Complete
Không thao tác thêm intake.
Tạo đồng thời QA và R&D task/SLA; workflow QA_RND_REVIEW.
Chi tiết read-only/chờ.

6.2 Tổng hợp sau QA và R&D
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Dashboard
Mở task “Tổng hợp báo giá”.
Chỉ xuất hiện khi QA và R&D đều Complete.
Form tổng hợp.
2
Chi tiết
Xem kết quả QA, R&D và attachment read-only.
Hiển thị chi phí bản in/khuôn từ R&D read-only.
Nhập tổng hợp.
3
Form tổng hợp
Nhập đơn giá bắt buộc; thời gian sản xuất, điều kiện giao hàng, ghi chú tùy chọn.
Validate VNĐ và field.
Attachment.
4
Attachment
Upload ít nhất 1 tệp của task tổng hợp.
Không tính file Intake/QA/R&D.
Báo giá tương tự.
5
Cuối form
Xem 2 carousel tương tự theo sản phẩm và Customer, tối đa 5 mỗi nhóm.
Empty text nếu không có; mở quotation lịch sử read-only.
Quay lại form.
6
Task panel
Bắt đầu xử lý tùy chọn hoặc chọn Hoàn thành.
Validate đơn giá + attachment; confirmation.
ACCOUNTING_REVIEW.

7. UI Workflow - QA
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Dashboard
Mở task QA ưu tiên theo SLA.
Hiển thị warning/overdue và deadline.
Chi tiết QA.
2
Chi tiết báo giá
Xem dữ liệu Sales; tiến độ QA/R&D; attachment liên quan.
Chỉ section QA editable.
Form QA.
3
Task panel
Tùy chọn “Bắt đầu xử lý”.
Task IN_PROGRESS; SLA không reset.
Nhập dữ liệu.
4
Form QA
Nhập Kết quả đánh giá chất lượng và Yêu cầu chất lượng; ghi chú tùy chọn.
Validation inline.
Upload.
5
Attachment QA
Upload ít nhất 1 tệp, tối đa 10.
Chỉ file QA hiện tại tính validation.
Complete.
6
Task panel
Chọn “Hoàn thành”.
Validate field + file; lỗi inline nếu thiếu.
QA task COMPLETED.
7
Sau Complete
Xem read-only.
Nếu R&D chưa xong, workflow vẫn QA_RND_REVIEW; nếu đã xong, tạo task tổng hợp.
Kết thúc QA.

8. UI Workflow - R&D
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Dashboard
Mở task R&D ưu tiên theo SLA.
Hiển thị deadline và alert.
Chi tiết R&D.
2
Chi tiết báo giá
Xem yêu cầu carton và attachment Sales.
Chỉ section R&D editable.
Form R&D.
3
Task panel
Tùy chọn “Bắt đầu xử lý”.
Task IN_PROGRESS; SLA không đổi.
Nhập dữ liệu.
4
Form R&D
Nhập chi phí bản in/khuôn; ngày đặt bản in/khuôn; ghi chú tùy chọn.
Cost mặc định 0; ngày mặc định hôm nay; validate >=0.
Upload.
5
Attachment R&D
Upload ít nhất 1 tệp, tối đa 10.
Chỉ file R&D hiện tại tính validation.
Complete.
6
Task panel
Chọn “Hoàn thành”.
Validate field/ngày/file.
R&D task COMPLETED.
7
Sau Complete
Xem read-only.
Nếu QA chưa xong, chờ; nếu đã xong, tạo task tổng hợp.
Kết thúc R&D.

9. UI Workflow - Kế toán
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Dashboard
Mở task Kế toán theo SLA.
Danh sách ưu tiên đúng data scope.
Chi tiết Kế toán.
2
Chi tiết báo giá
Xem Sales, QA, R&D, EXECUTOR và attachment read-only.
Hiển thị đơn giá và chi phí tham khảo nhưng không tự tính.
Form Kế toán.
3
Task panel
Tùy chọn “Bắt đầu xử lý”.
Task IN_PROGRESS; SLA không đổi.
Nhập dữ liệu.
4
Form Kế toán
Nhập điều kiện thanh toán, VAT mặc định 10%, điều chỉnh, giá trị cuối cùng bắt buộc và ghi chú.
Không áp công thức tự động; validate giá trị cuối cùng.
Attachment tùy chọn.
5
Task panel
Chọn “Hoàn thành”.
Validate giá trị cuối cùng; confirmation.
DIRECTOR_REVIEW.

10. UI Workflow - Giám đốc
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Dashboard
Mở báo giá chờ phê duyệt theo SLA.
Overdue/warning được ưu tiên.
Màn hình quyết định.
2
Chi tiết
Xem toàn bộ dữ liệu, attachment và lịch sử read-only.
Không field giá nào editable.
Approve/Reject.
3A
Action Phê duyệt
Nhập ghi chú tùy chọn và chọn Phê duyệt.
Confirmation; backend validate active task.
APPROVED + outcome NOT_UPDATED.
3B
Action Từ chối
Chọn Từ chối, nhập lý do bắt buộc.
Validate lý do; confirmation.
REJECTED.
4
Sau quyết định
Xem read-only.
Kết thúc SLA và workflow cycle; Sales thấy action outcome/re-submit phù hợp.
Kết thúc.

11. UI Workflow - Admin
11.1 Quản lý người dùng
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Sidebar Quản trị
Mở “Người dùng”.
Danh sách account, role, trạng thái.
User list.
2
Danh sách
Tạo Sales hoặc mở account.
Không cho gán nhiều role.
Form user.
3
Form user
Sửa họ tên, email, điện thoại; khóa/mở khóa; reset mật khẩu.
Validate; gọi cơ chế Cognito phù hợp.
Lưu/audit.
4
Tạo EXECUTOR
Nếu đã có account EXECUTOR, action bị chặn.
Hiển thị ràng buộc một account.
Không tạo trùng.
5
Xem quotation
Mở dữ liệu toàn bộ ở read-only.
Không hiển thị Complete/Approve/Reject/Outcome.
Chi tiết read-only.

11.2 Cấu hình SLA
Bước
Màn hình/Điểm vào
Thao tác người dùng
Phản hồi hệ thống
Điểm kết thúc/tiếp theo
1
Sidebar Quản trị
Mở “Cấu hình SLA”.
Hiển thị 6 công đoạn, New và Re-submit.
Config list/form.
2
Form cấu hình
Sửa số giờ > 0; warning threshold 50% cố định hoặc editable nếu chốt.
Validate giá trị và completeness.
Review.
3
Lưu
Xác nhận cấu hình mới không hồi tố task đang chạy.
Lưu config + audit + effective time.
Danh sách cấu hình.
4
Lịch sử cấu hình
Xem giá trị trước/sau, người sửa, thời điểm.
Read-only.
Kết thúc.

12. UI Workflow dùng chung - Customer Management
Luồng
Actor
Điểm chính
Danh sách Customer
Tất cả role theo scope
Search, filter, paging; Sales chỉ Customer có relation.
Tạo/Sửa Customer
Tất cả role theo scope
Doanh nghiệp/Cá nhân; MST và liên hệ bắt buộc.
Quản lý Contact
Tất cả role theo scope
Thêm/sửa/primary/inactive; Doanh nghiệp cần Contact.
Ngừng hoạt động
Tất cả role theo scope
Confirmation; không chọn cho quotation mới.
Xóa Customer chưa dùng
Tất cả role theo scope
Reference check backend; Customer đã dùng chỉ deactivate.
Tab Báo giá
Theo quotation scope
Sales chỉ quotation của mình; role khác/Admin toàn bộ.
Sales liên quan
Theo quyền còn OPEN
Quan hệ N-N; mọi thay đổi audit.

13. Cấu trúc UI Chi tiết Báo giá
Khu vực/Tab
Nội dung
Khả năng chỉnh sửa
Header Summary
Mã, Customer, Sales Owner, cycle type, workflow status, outcome, SLA.
RO; action bar theo role/status.
Yêu cầu báo giá
Thông tin Sales và carton.
Sales sửa ở Draft; còn lại RO.
QA
Kết quả, yêu cầu chất lượng, note, file, task/SLA.
QA sửa task active; còn lại RO.
R&D
Chi phí, ngày dự kiến, note, file, task/SLA.
R&D sửa task active; còn lại RO.
Tổng hợp
Đơn giá, chi phí R&D RO, thời gian sản xuất, giao hàng, file, similar quotes.
EXECUTOR sửa task active.
Kế toán
Thanh toán, VAT, điều chỉnh, giá trị cuối cùng, file.
Kế toán sửa task active.
Phê duyệt
Decision, approval note/reject reason.
Giám đốc tại task active.
Attachment
Nhóm file theo role/task/cycle.
Upload/xóa chỉ phần active của role.
Lịch sử
Timeline, cycle, task, SLA, revision, outcome.
RO.
Action Bar
Start, Complete, Approve, Reject, Outcome, Re-submit, Clone, Cancel.
Tính động theo quyền/state.

14. Action Visibility Matrix
Action
Hiển thị khi
Role
Tạo báo giá
Luôn trong module Báo giá.
Sales
Lưu nháp
Current cycle DRAFT.
Sales Owner
Gửi xử lý
DRAFT; form có thể validate.
Sales Owner
Hủy báo giá
DRAFT.
Sales Owner
Sao chép báo giá
Quotation trong data scope.
Sales Owner
Bắt đầu xử lý
Task active PENDING.
EXECUTOR/QA/R&D/Kế toán; Director nếu chốt UI
Hoàn thành
Task active PENDING/IN_PROGRESS.
EXECUTOR/QA/R&D/Kế toán
Phê duyệt
DIRECTOR_REVIEW task active.
Giám đốc
Từ chối
DIRECTOR_REVIEW task active.
Giám đốc
Đã gửi khách hàng
APPROVED + NOT_UPDATED.
Sales Owner
Thành công
APPROVED + NOT_UPDATED/SENT.
Sales Owner
Thất bại
APPROVED + NOT_UPDATED/SENT.
Sales Owner
Gửi lại báo giá
REJECTED hoặc LOST.
Sales Owner
Quản lý người dùng/SLA
Module Admin.
Admin

15. UI States và Validation
State
Yêu cầu UI
Loading
Skeleton/spinner; disable action tránh submit lặp.
Empty list
Thông báo rõ và action hợp lệ, ví dụ “Chưa có báo giá”.
No similar quote
“Không có báo giá tương tự trước đây.” theo từng nhóm.
Validation error
Hiển thị gần field; focus/scroll tới lỗi đầu tiên.
Upload error
Nêu rõ định dạng, dung lượng hoặc vượt 10 tệp.
Unauthorized
Thông báo không có quyền; không lộ nội dung.
Stale state/conflict
Thông báo dữ liệu đã thay đổi và yêu cầu tải lại.
System error
Thông báo chung + khả năng thử lại; không đổi state cục bộ sai.
Action success
Toast ngắn; cập nhật UI theo state trả về từ backend.
Completed task
Form read-only; hiển thị người/thời gian hoàn thành.

16. Confirmation Dialog Specification
Action
Nội dung cần xác nhận
Input bổ sung
Submit
Báo giá sẽ được gửi sang Trưởng phòng Kế hoạch và không thể sửa trong khi xử lý.
Không.
Hủy Draft
Báo giá sẽ chuyển sang Đã hủy và không thể tiếp tục workflow.
Không.
Hoàn thành Task
Dữ liệu của phòng ban sẽ bị khóa sau khi hoàn thành.
Không.
Phê duyệt
Xác nhận phê duyệt báo giá.
Ghi chú tùy chọn.
Từ chối
Xác nhận từ chối; Sales có thể re-submit.
Lý do bắt buộc.
Cập nhật Won/Lost
Xác nhận kết quả kinh doanh.
Không; lý do Lost chưa được yêu cầu.
Re-submit
Tạo vòng xử lý mới với SLA Re-submit.
Lý do bắt buộc.
Ngừng hoạt động Customer
Customer không dùng cho báo giá mới.
Không.
Xóa dữ liệu chưa dùng
Hành động xóa có rủi ro và chỉ thực hiện khi chưa có tham chiếu.
Không.
Sửa SLA
Chỉ task tạo sau khi lưu dùng cấu hình mới.
Không.

17. Luồng demo end-to-end
Đăng nhập Sales, tạo Customer doanh nghiệp và Người liên hệ.
Sales tạo Draft, nhập dữ liệu carton, upload file tùy chọn và Submit.
Đăng nhập EXECUTOR, hoàn thành Intake trực tiếp.
Đăng nhập QA, nhập dữ liệu, upload file và Complete.
Đăng nhập R&D, nhập chi phí/ngày, upload file và Complete.
Đăng nhập EXECUTOR, xem hai nhóm báo giá tương tự, nhập đơn giá, upload file và Complete.
Đăng nhập Kế toán, nhập VAT/giá trị cuối cùng và Complete.
Đăng nhập Giám đốc, Approve hoặc Reject.
Nếu Approve, Sales cập nhật trực tiếp Won hoặc Sent rồi Won/Lost.
Nếu Reject/Lost, Sales nhập lý do và Re-submit; workflow chạy lại với SLA Re-submit.
Trong quá trình demo, cho thấy alert cam/đỏ và data scope giữa hai Sales.
Mở History để xem cycle, task, SLA, outcome và revision.
18. Kịch bản kiểm thử UI Workflow tối thiểu
ID
Kịch bản
Kết quả UI mong đợi
UI-T01
Sales A đăng nhập
Chỉ thấy quotation của A và Customer relation với A.
UI-T02
Sales Submit thiếu field
Không submit; lỗi inline.
UI-T03
EXECUTOR Complete Intake trực tiếp
Không bắt buộc Start; tạo QA/R&D.
UI-T04
QA Complete thiếu file QA
Bị chặn dù có file Sales.
UI-T05
R&D cost = 0
Cho phép nếu đủ ngày/file.
UI-T06
QA xong trước R&D
UI hiển thị QA xong, R&D đang chờ; chưa có task tổng hợp.
UI-T07
EXECUTOR tổng hợp
Chi phí R&D read-only; similar carousel đúng empty/result state.
UI-T08
Kế toán
Không hiển thị công thức tự tính; final value bắt buộc.
UI-T09
Giám đốc Reject
Dialog bắt buộc lý do.
UI-T10
Sales APPROVED
Hiển thị Sent/Won/Lost; cho đi tắt Won/Lost.
UI-T11
Sales LOST
Hiển thị Re-submit; lý do bắt buộc.
UI-T12
Alert boundary
UI chuyển cam/đỏ và luôn có badge/text.
UI-T13
Admin xem quotation
Read-only, không có action workflow.
UI-T14
Direct URL không quyền
Unauthorized, không lộ dữ liệu.
UI-T15
Conflict/double click
Disable loading và xử lý response idempotent/conflict.
UI-T16
Customer detail Sales
Tab báo giá chỉ hiển thị quotation của Sales đó.

19. Chi tiết UI còn mở
Open ID
Nội dung
Ảnh hưởng
UI-O01
Menu cuối cùng và tên nhóm menu chính xác.
Navigation/Figma.
UI-O02
Director có nút Bắt đầu xử lý hay chỉ Approve/Reject.
Task panel; SLA không đổi.
UI-O03
EXI intake có Ghi chú/Attachment tùy chọn hay bỏ hoàn toàn.
Form scope nhỏ.
UI-O04
Widget cho Thời gian mong muốn và Thời gian sản xuất.
Form controls.
UI-O05
Actor/UX thêm gỡ Sales relation.
Customer screens.
UI-O06
Ngưỡng SLA 50% editable hay fixed.
Admin config UI.
UI-O07
Realtime countdown dùng polling hay cơ chế khác.
Frontend technical design.
UI-O08
Layout timeline revision và workflow cycle.
History screen.
UI-O09
Preview file theo loại hay chỉ download.
Attachment component.
UI-O10
Mức độ responsive ngoài desktop.
Ngoài ưu tiên desktop-first.

20. Acceptance Criteria
Mỗi role đăng nhập nhìn thấy Dashboard và action đúng data scope.
Sales hoàn thành được các luồng Customer, quotation New, clone, outcome và re-submit.
EXECUTOR, QA, R&D, Kế toán và Giám đốc hoàn thành đúng phần việc mà không sửa dữ liệu role khác.
Task hỗ trợ Start tùy chọn và Complete trực tiếp.
Validation attachment, field, role và state hiển thị rõ trên UI và được backend enforce.
SLA cam/đỏ hiển thị đúng, không dùng màu đơn độc và không hiển thị count 0.
Admin quản lý user/SLA nhưng không có action nghiệp vụ.
Luồng end-to-end có thể demo từ Draft đến Approved/Rejected, Won/Lost và Re-submit.
