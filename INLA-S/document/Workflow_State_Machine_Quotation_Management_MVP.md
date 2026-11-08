# Workflow State Machine Quotation Management MVP

> Converted from `Workflow_State_Machine_Quotation_Management_MVP.docx` (Word baseline). **Source of truth:** this Markdown file.
> Annex/deltas: `annex/`, `spec-deltas/`. Templates: `templates/`.
WORKFLOW & STATE MACHINE
Hệ thống quản lý quy trình báo giá thùng carton
Phiên bản
Baseline 0.1
Ngày
13/10/2026
Phạm vi
MVP
Nội dung
Trạng thái, bước xử lý, transition và SLA
Ngôn ngữ UI
Tiếng Việt
Trạng thái tài liệu
Tài liệu làm việc tạm thời


1. Mục đích và phạm vi
Tài liệu định nghĩa workflow chính thức của MVP: các lớp trạng thái, thứ tự xử lý, actor, transition, điều kiện chuyển bước, validation, SLA và Cảnh báo SLA. Đây là contract nghiệp vụ dùng chung cho Figma, frontend, backend, kiểm thử và demo.
Nguyên tắc cốt lõi: workflow tuyến tính; QA và R&D xử lý song song; không trả lại bước trước; task có thể hoàn thành trực tiếp mà không cần Bắt đầu xử lý; mọi transition quan trọng phải được kiểm tra ở backend và lưu audit history.

2. Thuật ngữ và mô hình trạng thái
Thuật ngữ
Định nghĩa
Quotation
Bản ghi báo giá ổn định qua nhiều workflow cycle; có đúng một Sales Owner.
Workflow Cycle
Một lần chạy quy trình nội bộ. Loại NEW cho lần đầu; RE_SUBMIT cho lần chạy lại.
Workflow Status
Trạng thái tổng thể của cycle hiện tại.
Task
Công việc cụ thể giao cho một role tại một công đoạn.
Task Status
PENDING, IN_PROGRESS hoặc COMPLETED.
Business Outcome
Kết quả bên ngoài sau APPROVED: NOT_UPDATED, SENT_TO_CUSTOMER, WON, LOST.
SLA Cycle
Khoảng thời gian SLA của một task, từ lúc task được tạo/chuyển tới role đến khi hoàn thành.
Cảnh báo SLA
Trạng thái hiển thị NORMAL, WARNING (cam) hoặc OVERDUE (đỏ); không phải notification.

2.1 Quan hệ giữa các lớp trạng thái
Quotation
  ├─ Sales Owner: đúng 1 account SALES
  ├─ Current Workflow Cycle: NEW hoặc RE_SUBMIT
  │    ├─ Workflow Status
  │    ├─ Task(s)
  │    │    ├─ Task Status
  │    │    └─ SLA Cycle / SLA Alert
  │    └─ Revision / Audit events
  └─ Business Outcome: chỉ có ý nghĩa sau APPROVED
Workflow Status không được dùng thay cho Business Outcome.
REJECTED là kết quả nội bộ; LOST là kết quả khách hàng không chấp nhận.
Task Status mô tả tiến độ của từng phòng ban, không thay thế Workflow Status.
3. Workflow tổng thể
DRAFT
  → EXECUTOR_INTAKE
  → QA_RND_REVIEW
       ├─ QA task
       └─ R&D task
       [chờ cả hai COMPLETED]
  → EXECUTOR_CONSOLIDATION
  → ACCOUNTING_REVIEW
  → DIRECTOR_REVIEW
       ├─ Approve → APPROVED
       └─ Reject  → REJECTED
3.1 Sau khi APPROVED
APPROVED + NOT_UPDATED
  ├─ Sales cập nhật → SENT_TO_CUSTOMER
  │                    ├─ → WON
  │                    └─ → LOST
  ├─ Sales cập nhật trực tiếp → WON
  └─ Sales cập nhật trực tiếp → LOST
3.2 Re-submit
REJECTED hoặc LOST
  → Sales khởi tạo re-submit
  → Chuẩn bị dữ liệu trong DRAFT của cycle RE_SUBMIT
  → Sales nhập lý do và submit
  → EXECUTOR_INTAKE
  → chạy lại toàn bộ workflow với SLA RE_SUBMIT
4. Workflow Status chính thức
Code
Label UI
Entry condition
Được sửa bởi
Exit
DRAFT
Bản nháp
Quotation mới hoặc cycle re-submit đang được Sales chuẩn bị.
Sales Owner
Submit hoặc Hủy.
EXECUTOR_INTAKE
Trưởng phòng Kế hoạch tiếp nhận
Sales submit hợp lệ.
EXECUTOR: phạm vi task
Complete → QA_RND_REVIEW.
QA_RND_REVIEW
QA và R&D đang xử lý
EXECUTOR intake hoàn thành; tạo 2 task song song.
QA/R&D: phần của role
Cả hai Complete → EXECUTOR_CONSOLIDATION.
EXECUTOR_CONSOLIDATION
Trưởng phòng Kế hoạch tổng hợp
QA và R&D đều hoàn thành.
EXECUTOR: phạm vi task
Complete → ACCOUNTING_REVIEW.
ACCOUNTING_REVIEW
Kế toán đang xử lý
EXECUTOR tổng hợp hoàn thành.
ACCOUNTING: phạm vi task
Complete → DIRECTOR_REVIEW.
DIRECTOR_REVIEW
Chờ Giám đốc phê duyệt
Kế toán hoàn thành.
DIRECTOR: ghi chú/quyết định
Approve → APPROVED; Reject → REJECTED.
APPROVED
Đã phê duyệt
Giám đốc phê duyệt.
Sales Owner: outcome
Workflow nội bộ kết thúc.
REJECTED
Đã từ chối
Giám đốc từ chối với lý do.
Sales Owner: khởi tạo re-submit
Cycle kết thúc; có thể re-submit.
CANCELLED
Đã hủy
Sales hủy khi DRAFT.
Không
Trạng thái kết thúc.

Quy tắc re-submit để giữ mô hình đơn giản: khi Sales chọn Re-submit, hệ thống tạo workflow cycle mới loại RE_SUBMIT ở DRAFT. Cycle cũ vẫn APPROVED/REJECTED trong lịch sử; quotation identity không thay đổi.

5. Task Status và hành động chung
Task Status
Label UI
Ý nghĩa
PENDING
Chờ xử lý
Task đã được giao và SLA đã chạy; người dùng chưa bấm Bắt đầu xử lý.
IN_PROGRESS
Đang xử lý
Người dùng đã bấm Bắt đầu xử lý; SLA vẫn tiếp tục.
COMPLETED
Đã hoàn thành
Task đã qua validation; SLA cycle kết thúc; task không được sửa lại trực tiếp.

5.1 Transition task hợp lệ
Từ
Action
Đến
Điều kiện
PENDING
Bắt đầu xử lý
IN_PROGRESS
Actor đúng role; task đang active.
PENDING
Hoàn thành
COMPLETED
Actor đúng role; pass toàn bộ validation.
IN_PROGRESS
Hoàn thành
COMPLETED
Actor đúng role; pass toàn bộ validation.

IN_PROGRESS là tùy chọn.
Bắt đầu xử lý không reset, pause hoặc gia hạn SLA.
Task COMPLETED không mở lại trong cùng cycle.
MVP không có Return, Reject ở cấp task, Reopen hoặc Request More Information.
6. Transition Matrix của Workflow
ID
Từ trạng thái
Action/Event
Actor
Điều kiện chính
Đến trạng thái
TR-01
Không có
Tạo quotation
SALES
Customer/Contact hợp lệ trong data scope.
DRAFT
TR-02
DRAFT
Lưu nháp
Sales Owner
Không yêu cầu form hoàn chỉnh.
DRAFT
TR-03
DRAFT
Hủy
Sales Owner
Quotation chưa từng submit trong cycle hiện tại.
CANCELLED
TR-04
DRAFT
Submit
Sales Owner
Pass field validation; nếu RE_SUBMIT phải có lý do.
EXECUTOR_INTAKE
TR-05
EXECUTOR_INTAKE
Bắt đầu xử lý
EXECUTOR
Task PENDING.
Workflow giữ nguyên; task IN_PROGRESS
TR-06
EXECUTOR_INTAKE
Hoàn thành
EXECUTOR
Task active; không có field chuyên môn bắt buộc.
QA_RND_REVIEW
TR-07
QA_RND_REVIEW
QA hoàn thành
QA
QA fields + >=1 attachment riêng.
Giữ QA_RND_REVIEW nếu R&D chưa xong
TR-08
QA_RND_REVIEW
R&D hoàn thành
R&D
R&D fields + >=1 attachment riêng.
Giữ QA_RND_REVIEW nếu QA chưa xong
TR-09
QA_RND_REVIEW
Parallel join
Hệ thống
QA=COMPLETED và R&D=COMPLETED.
EXECUTOR_CONSOLIDATION
TR-10
EXECUTOR_CONSOLIDATION
Hoàn thành
EXECUTOR
Đơn giá hợp lệ + >=1 attachment riêng.
ACCOUNTING_REVIEW
TR-11
ACCOUNTING_REVIEW
Hoàn thành
ACCOUNTING
Giá trị cuối cùng hợp lệ.
DIRECTOR_REVIEW
TR-12
DIRECTOR_REVIEW
Phê duyệt
DIRECTOR
Ghi chú tùy chọn.
APPROVED
TR-13
DIRECTOR_REVIEW
Từ chối
DIRECTOR
Lý do từ chối bắt buộc.
REJECTED
TR-14
APPROVED
Đã gửi khách hàng
Sales Owner
Outcome hiện tại NOT_UPDATED.
APPROVED + SENT_TO_CUSTOMER
TR-15
APPROVED
Thành công
Sales Owner
Outcome NOT_UPDATED hoặc SENT_TO_CUSTOMER.
APPROVED + WON
TR-16
APPROVED
Thất bại
Sales Owner
Outcome NOT_UPDATED hoặc SENT_TO_CUSTOMER.
APPROVED + LOST
TR-17
REJECTED
Khởi tạo Re-submit
Sales Owner
Quotation thuộc Sales; nhập/sẽ nhập lý do trước Submit.
Cycle mới DRAFT/RE_SUBMIT
TR-18
APPROVED + LOST
Khởi tạo Re-submit
Sales Owner
Outcome hiện tại LOST.
Cycle mới DRAFT/RE_SUBMIT

7. Điều kiện và validation theo bước
7.1 Sales Submit
Chỉ Sales Owner.
Quotation/current cycle phải ở DRAFT.
Customer đang hoạt động và có quan hệ với Sales.
Contact hợp lệ: Doanh nghiệp bắt buộc có Người liên hệ; Cá nhân có thể dùng chính Customer nếu không có Contact.
Các trường carton bắt buộc phải hợp lệ.
Cycle RE_SUBMIT bắt buộc có lý do re-submit.
Backend tái kiểm tra toàn bộ điều kiện và chống submit lặp.
7.2 EXECUTOR tiếp nhận
Có thể PENDING→IN_PROGRESS hoặc PENDING→COMPLETED.
Không có field chuyên môn bắt buộc ở MVP.
Khi Complete, hệ thống tạo đồng thời task QA và R&D, mỗi task có SLA cycle riêng bắt đầu cùng thời điểm logic.
7.3 QA Complete
Validation
Quy tắc
Kết quả đánh giá chất lượng
Bắt buộc, không để trống.
Yêu cầu chất lượng
Bắt buộc, không để trống.
Ghi chú
Tùy chọn.
Attachment
Ít nhất 1 file do QA upload trong đúng task/cycle; file role trước không được tính.

7.4 R&D Complete
Validation
Quy tắc
Chi phí bản in
Bắt buộc; số >= 0; mặc định 0 VNĐ.
Chi phí khuôn
Bắt buộc; số >= 0; mặc định 0 VNĐ.
Ngày đặt bản in dự kiến
Bắt buộc; mặc định ngày hiện tại.
Ngày đặt khuôn bế dự kiến
Bắt buộc; mặc định ngày hiện tại.
Attachment
Ít nhất 1 file do R&D upload trong đúng task/cycle.

7.5 EXECUTOR tổng hợp Complete
Validation
Quy tắc
Đơn giá cho 1 thùng
Bắt buộc; VNĐ; giá trị hợp lệ. Hệ thống không tự tính.
Chi phí bản in/khuôn
Read-only, lấy từ R&D.
Thời gian sản xuất
Tùy chọn.
Điều kiện giao hàng
Tùy chọn.
Ghi chú tổng hợp
Tùy chọn.
Attachment
Ít nhất 1 file do EXECUTOR upload trong task tổng hợp hiện tại.

7.6 Kế toán Complete
Validation
Quy tắc
Điều kiện thanh toán
Tùy chọn.
VAT
Tùy chọn; mặc định 10%; Kế toán được chỉnh.
Chi phí/điều chỉnh tài chính
Tùy chọn; không có công thức tự động.
Giá trị cuối cùng
Bắt buộc; Kế toán tự tính và nhập; VNĐ.
Ghi chú/Attachment
Tùy chọn.

7.7 Giám đốc
Approve: ghi chú tùy chọn; hoàn thành workflow cycle ở APPROVED.
Reject: lý do bắt buộc; hoàn thành workflow cycle ở REJECTED.
Không có quyền điều chỉnh giá trong MVP.
Approve/Reject phải idempotent: một task đã xử lý không được quyết định lần hai.
8. Business Outcome State Machine
Current Outcome
Action
Actor
Next Outcome
Cho phép re-submit
NOT_UPDATED
Đã gửi khách hàng
Sales Owner
SENT_TO_CUSTOMER
Không
NOT_UPDATED
Thành công
Sales Owner
WON
Không
NOT_UPDATED
Thất bại
Sales Owner
LOST
Có
SENT_TO_CUSTOMER
Thành công
Sales Owner
WON
Không
SENT_TO_CUSTOMER
Thất bại
Sales Owner
LOST
Có
WON
Không có transition MVP
-
WON
Không
LOST
Khởi tạo Re-submit
Sales Owner
Cycle mới; outcome cycle mới NOT_UPDATED
Có

Chỉ áp dụng khi workflow nội bộ đã APPROVED.
Sales có đường tắt từ NOT_UPDATED sang WON hoặc LOST.
Khi re-submit từ LOST, outcome LOST của cycle cũ vẫn giữ trong history; cycle mới bắt đầu với NOT_UPDATED sau khi được submit.
MVP không cho sửa ngược WON thành LOST hoặc LOST thành WON. Nếu cần sửa sai, phải là yêu cầu mới có audit rõ ràng.
9. Workflow Cycle và Re-submit
Thuộc tính
NEW
RE_SUBMIT
Điều kiện tạo
Quotation mới được Sales submit lần đầu.
Quotation REJECTED hoặc outcome LOST.
Lý do
Không bắt buộc.
Bắt buộc.
Điểm bắt đầu xử lý
EXECUTOR_INTAKE.
EXECUTOR_INTAKE.
Workflow
Đầy đủ toàn bộ bước.
Đầy đủ toàn bộ bước.
SLA
Cấu hình New.
Cấu hình Re-submit.
Quotation identity
Tạo mới.
Giữ nguyên.
Task/SLA cũ
Không có.
Không kế thừa; giữ trong history.
Revision
Tạo lịch sử bình thường.
Tạo revision/cycle mới; dữ liệu cũ không bị ghi đè.

9.1 Chuỗi re-submit
Sales chọn Re-submit từ REJECTED hoặc LOST.
Hệ thống tạo cycle mới loại RE_SUBMIT ở DRAFT và liên kết cycle trước.
Sales nhập lý do bắt buộc và có thể sửa dữ liệu đầu vào.
Sales submit; backend validate và khóa dữ liệu Sales trong khi workflow chạy.
Hệ thống tạo EXECUTOR_INTAKE task và SLA theo cấu hình Re-submit.
Toàn bộ workflow chạy lại; lịch sử hiển thị theo cycle.
10. SLA Specification
Công đoạn/Task
NEW
RE_SUBMIT
Bắt đầu
Kết thúc
EXECUTOR_INTAKE
2 giờ
1 giờ
Sales submit và task được tạo.
EXECUTOR Complete.
QA_REVIEW
4 giờ
2 giờ
EXECUTOR intake Complete.
QA Complete.
RND_REVIEW
4 giờ
2 giờ
EXECUTOR intake Complete.
R&D Complete.
EXECUTOR_CONSOLIDATION
4 giờ
2 giờ
QA và R&D đều Complete; task được tạo.
EXECUTOR Complete.
ACCOUNTING_REVIEW
4 giờ
2 giờ
EXECUTOR tổng hợp Complete.
Kế toán Complete.
DIRECTOR_REVIEW
4 giờ
2 giờ
Kế toán Complete.
Giám đốc Approve hoặc Reject.

10.1 Công thức thời gian
deadlineAt = startedAt + configuredDurationHours
elapsed = now - startedAt
progressRatio = elapsed / configuredDuration
Alert state
Điều kiện
Label UI
Màu
NORMAL
progressRatio <= 0.5 hoặc task đã COMPLETED
Trong hạn
Mặc định
WARNING
0.5 < progressRatio < 1 và task chưa COMPLETED
Gần đến hạn
Cam
OVERDUE
progressRatio >= 1 và task chưa COMPLETED
Quá hạn
Đỏ

Tính theo thời gian liên tục 24/7, gồm ngoài giờ và cuối tuần.
Không có SLA tổng thể của quotation.
Bắt đầu xử lý không ảnh hưởng startedAt hoặc deadlineAt.
Khi task Complete, lưu completedAt và actualDuration; alert không tiếp tục tăng.
Thay đổi cấu hình SLA không hồi tố task đang chạy.
10.2 Hiển thị Cảnh báo SLA
Mã báo giá; badge SLA; deadline; thời gian còn lại/quá hạn.
Nền nhạt ở hàng danh sách và thanh/viền trạng thái ở trang chi tiết.
Không đổi toàn bộ text thành cam/đỏ.
Màu phải đi kèm text/badge/icon để đáp ứng accessibility.
Dashboard chỉ hiển thị số cam/đỏ nếu count lớn hơn 0.
11. Quy tắc tạo task và parallel join
Event
Task được tạo
Task active song song
Workflow Status
Sales Submit
EXECUTOR_INTAKE
Không
EXECUTOR_INTAKE
EXECUTOR intake Complete
QA_REVIEW và RND_REVIEW
Có, 2 task
QA_RND_REVIEW
QA Complete, R&D chưa Complete
Không tạo task mới
R&D còn active
QA_RND_REVIEW
R&D Complete, QA chưa Complete
Không tạo task mới
QA còn active
QA_RND_REVIEW
QA và R&D đều Complete
EXECUTOR_CONSOLIDATION
Không
EXECUTOR_CONSOLIDATION
EXECUTOR consolidation Complete
ACCOUNTING_REVIEW
Không
ACCOUNTING_REVIEW
ACCOUNTING Complete
DIRECTOR_REVIEW
Không
DIRECTOR_REVIEW
DIRECTOR Approve/Reject
Không
Không
APPROVED/REJECTED

Parallel join phải được xử lý atomic ở backend để tránh việc QA và R&D hoàn thành gần như cùng lúc tạo trùng task EXECUTOR_CONSOLIDATION.

12. Quyền transition theo role
Action
SALES
EXECUTOR
QA
R&D
Kế toán
Giám đốc
Admin
Create/Edit/Cancel Draft
Owner
Không
Không
Không
Không
Không
Không
Submit/Re-submit
Owner
Không
Không
Không
Không
Không
Không
Start/Complete intake
Không
Có
Không
Không
Không
Không
Không
Start/Complete QA
Không
Không
Có
Không
Không
Không
Không
Start/Complete R&D
Không
Không
Không
Có
Không
Không
Không
Start/Complete consolidation
Không
Có
Không
Không
Không
Không
Không
Start/Complete Accounting
Không
Không
Không
Không
Có
Không
Không
Approve/Reject
Không
Không
Không
Không
Không
Có
Không
Sent/Won/Lost
Owner
Không
Không
Không
Không
Không
Không
Xem toàn bộ quotation
Không
Có
Có
Có
Có
Có
Có

Admin có quyền xem và quản trị cấu hình/account, nhưng không mặc nhiên thực hiện transition nghiệp vụ thay role khác.
13. Transition không hợp lệ cần chặn
Tình huống
Kết quả mong đợi
Sales khác mở quotation không thuộc mình
Trả về không có quyền/không tìm thấy theo chính sách API; không lộ dữ liệu.
Sales sửa quotation sau Submit
Chặn ở UI và backend.
Sales Cancel sau Submit
Chặn.
QA hoặc R&D Reject
Chặn; chỉ Giám đốc được Reject.
QA Complete thiếu attachment riêng
Chặn và trả lỗi validation rõ ràng.
R&D Complete thiếu field/ngày/attachment
Chặn.
EXECUTOR tổng hợp Complete thiếu đơn giá/attachment
Chặn.
Kế toán Complete thiếu giá trị cuối cùng
Chặn.
Giám đốc Reject thiếu lý do
Chặn.
Complete task đã COMPLETED
Không thực hiện lần hai; trả kết quả idempotent hoặc conflict.
Re-submit từ APPROVED+NOT_UPDATED/SENT/WON
Chặn; chỉ REJECTED hoặc LOST.
Cập nhật outcome trước APPROVED
Chặn.
Outcome WON/LOST bị đổi ngược trong MVP
Chặn.
Admin gọi API Complete/Approve/Reject
Chặn dù Admin xem được dữ liệu.
Cấu hình SLA sửa deadline task đang chạy
Không hồi tố; task giữ snapshot SLA ban đầu.

14. Audit và dữ liệu lịch sử bắt buộc
Mỗi transition lưu quotationId, workflowCycleId, taskId nếu có, fromStatus, toStatus, action, actorUserId, actorRole, timestamp và ghi chú/lý do.
Mỗi task lưu createdAt, startedAt nếu có, completedAt, assignedRole và người thực hiện.
Mỗi SLA cycle lưu duration snapshot, startedAt, deadlineAt, completedAt, actualDuration và trạng thái overdue tại thời điểm hoàn thành.
Approve lưu ghi chú tùy chọn; Reject lưu lý do bắt buộc.
Outcome update và re-submit reason được lưu riêng.
Hibernate Envers quản lý revision dữ liệu; workflow/task/SLA events vẫn cần mô hình lịch sử đủ để truy vấn nghiệp vụ.
15. Hành vi UI theo trạng thái
Workflow Status
Action chính hiển thị
View mặc định
DRAFT
Lưu nháp, Submit, Hủy; nếu clone/re-submit hiển thị nguồn/lý do.
Form Sales có thể sửa.
EXECUTOR_INTAKE
Bắt đầu xử lý, Hoàn thành cho EXECUTOR.
Dữ liệu Sales read-only + task panel.
QA_RND_REVIEW
Action riêng cho QA hoặc R&D; hiển thị tiến độ cả hai task.
Hai section/tabs; role chỉ sửa section của mình.
EXECUTOR_CONSOLIDATION
Bắt đầu xử lý, Hoàn thành; carousel tương tự.
Kết quả QA/R&D read-only + form tổng hợp.
ACCOUNTING_REVIEW
Bắt đầu xử lý, Hoàn thành.
Dữ liệu trước read-only + form Kế toán.
DIRECTOR_REVIEW
Phê duyệt, Từ chối.
Tổng hợp toàn bộ thông tin; dialog lý do khi Reject.
APPROVED
Sales: Đã gửi KH, Thành công, Thất bại tùy outcome.
Bản đã phê duyệt + outcome panel.
REJECTED
Sales: Re-submit.
Lý do từ chối + lịch sử cycle.
CANCELLED
Không có action nghiệp vụ.
Read-only.

16. Quy tắc backend và tính nhất quán
Backend là nguồn quyết định state transition; frontend chỉ hỗ trợ trải nghiệm và validation sớm.
Mỗi command phải kiểm tra current status, role và data scope tại thời điểm xử lý.
Dùng optimistic locking/version để chặn cập nhật đồng thời trên quotation/task.
Complete/Approve/Reject cần idempotency hoặc kiểm tra trạng thái để tránh tạo task tiếp theo hai lần.
Parallel join QA/R&D phải atomic và chỉ tạo một task EXECUTOR tổng hợp.
SLA duration được snapshot khi task tạo để lịch sử không đổi khi Admin sửa cấu hình.
Mọi lỗi transition trả mã lỗi nghiệp vụ và message tiếng Việt đủ rõ cho UI.
17. Kịch bản kiểm thử State Machine tối thiểu
ID
Kịch bản
Kết quả cần xác nhận
SM-01
Luồng New thành công
DRAFT→...→APPROVED→SENT_TO_CUSTOMER→WON.
SM-02
Approve rồi Won trực tiếp
APPROVED+NOT_UPDATED→WON.
SM-03
Reject và re-submit
DIRECTOR_REVIEW→REJECTED→cycle RE_SUBMIT DRAFT→full workflow.
SM-04
Lost và re-submit
APPROVED→LOST→cycle RE_SUBMIT DRAFT→full workflow.
SM-05
QA xong trước R&D
Workflow giữ QA_RND_REVIEW đến khi R&D Complete.
SM-06
R&D xong trước QA
Workflow giữ QA_RND_REVIEW đến khi QA Complete.
SM-07
Complete trực tiếp
PENDING→COMPLETED hợp lệ mà không qua IN_PROGRESS.
SM-08
Thiếu attachment
QA/R&D/EXECUTOR tổng hợp bị chặn Complete.
SM-09
SLA warning/overdue
Task chuyển NORMAL→WARNING→OVERDUE theo thời gian.
SM-10
Race QA/R&D
Hai Complete gần đồng thời chỉ tạo một task tổng hợp.
SM-11
Sai role/data scope
Action bị chặn ở backend.
SM-12
Double submit/double approve
Không tạo cycle/task hoặc quyết định trùng.
SM-13
Sửa SLA Admin
Task đang chạy giữ deadline cũ; task mới dùng cấu hình mới.
SM-14
Sales khác truy cập
Không xem hoặc thao tác quotation của Sales Owner khác.

18. Baseline và chi tiết còn mở
18.1 Đã chốt
Workflow tuyến tính và parallel join QA/R&D.
Status, actor, action, validation, outcome và điều kiện re-submit.
SLA từng công đoạn cho New/Re-submit; 24/7; alert cam/đỏ.
Không Return/Reopen/Pause; Complete trực tiếp được phép.
Sales Owner 1-1 với quotation; Admin không thao tác nghiệp vụ thay role.
18.2 Còn mở nhưng không đổi state machine
Format mã quotation/cycle/revision.
Mã lỗi nghiệp vụ/API cụ thể.
Ngưỡng và trọng số similar quotation.
Cơ chế lưu file vật lý và preview.
UI chi tiết của timeline và audit revision.
