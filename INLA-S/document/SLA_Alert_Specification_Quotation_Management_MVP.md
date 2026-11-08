# SLA Alert Specification Quotation Management MVP

> Converted from `SLA_Alert_Specification_Quotation_Management_MVP.docx` (Word baseline). **Source of truth:** this Markdown file.
> Annex/deltas: `annex/`, `spec-deltas/`. Templates: `templates/`.
SLA & ALERT SPECIFICATION
Hệ thống quản lý quy trình báo giá thùng carton
Phiên bản
Baseline 0.1
Ngày
13/10/2026
Phạm vi
MVP
Nội dung
Cấu hình SLA, cảnh báo màu cam/đỏ và validation
Ngôn ngữ UI
Tiếng Việt
Trạng thái
Tài liệu làm việc tạm thời


1. Mục đích và phạm vi
Tài liệu định nghĩa cách cấu hình, khởi tạo, tính toán, hiển thị và lưu lịch sử SLA cho từng task trong workflow. Tài liệu cũng xác định chính xác thuật ngữ Cảnh báo SLA, quy tắc màu cam/đỏ, dashboard alert, validation frontend/backend và các điều kiện biên cần kiểm thử.
Không có SLA tổng thể 24 giờ/12 giờ trong MVP. SLA chỉ áp dụng độc lập cho từng công đoạn. Thuật ngữ chính thức là “Cảnh báo SLA”, không phải Notification.

2. Thuật ngữ
Thuật ngữ
Định nghĩa
SLA Configuration
Thời lượng xử lý được cấu hình theo task type và workflow cycle type.
SLA Cycle
Một lần theo dõi SLA của một task cụ thể.
SLA Start
Thời điểm task được tạo/chuyển tới role xử lý.
SLA Deadline
SLA Start cộng thời lượng cấu hình đã snapshot.
SLA Complete
Thời điểm task được hoàn thành hoặc Giám đốc quyết định.
NORMAL
Task chưa dùng quá 50% SLA hoặc task đã hoàn thành.
WARNING
Task chưa hoàn thành và đã dùng trên 50% nhưng chưa hết SLA.
OVERDUE
Task chưa hoàn thành và đã đạt hoặc vượt 100% SLA.
Cảnh báo SLA
Cách hiển thị WARNING/OVERDUE trên dashboard và các màn hình liên quan; không gửi email.

3. Cấu hình SLA mặc định cho MVP
Task/Công đoạn
Code đề xuất
Báo giá mới
Re-submit
Actor
Trưởng phòng Kế hoạch tiếp nhận
EXECUTOR_INTAKE
2 giờ
1 giờ
EXECUTOR
QA xử lý
QA_REVIEW
4 giờ
2 giờ
QA
R&D xử lý
RND_REVIEW
4 giờ
2 giờ
R&D
Trưởng phòng Kế hoạch tổng hợp
EXECUTOR_CONSOLIDATION
4 giờ
2 giờ
EXECUTOR
Kế toán xử lý
ACCOUNTING_REVIEW
4 giờ
2 giờ
Kế toán
Giám đốc xử lý
DIRECTOR_REVIEW
4 giờ
2 giờ
Giám đốc

ID
Quy tắc/Yêu cầu
Mức độ
Validation/Ghi chú
CFG-001
SLA được cấu hình riêng cho từng task type và cycle type NEW/RE_SUBMIT.
MUST
Không dùng một giá trị chung.
CFG-002
Thời lượng cấu hình phải lớn hơn 0.
MUST
Giờ thực tế.
CFG-003
Mọi task type phải có đủ cấu hình New và Re-submit trước khi kích hoạt hệ thống.
MUST
Không cho thiếu cấu hình.
CFG-004
Ngưỡng WARNING mặc định là 50% thời lượng SLA.
MUST
MVP có thể cố định ở 50%.
CFG-005
Không có SLA tổng thể cho quotation.
MUST
Không cộng các task thành 24h/12h.
CFG-006
Không cấu hình giờ làm việc, cuối tuần hoặc ngày nghỉ trong MVP.
MUST
Tính 24/7.

4. Vòng đời SLA theo task
Task
SLA bắt đầu
SLA kết thúc
EXECUTOR_INTAKE
Sales Submit thành công và task được tạo.
EXECUTOR bấm Hoàn thành.
QA_REVIEW
EXECUTOR Intake hoàn thành và QA task được tạo.
QA bấm Hoàn thành.
RND_REVIEW
EXECUTOR Intake hoàn thành và R&D task được tạo.
R&D bấm Hoàn thành.
EXECUTOR_CONSOLIDATION
Cả QA và R&D hoàn thành; task tổng hợp được tạo.
EXECUTOR bấm Hoàn thành.
ACCOUNTING_REVIEW
EXECUTOR tổng hợp hoàn thành; task Kế toán được tạo.
Kế toán bấm Hoàn thành.
DIRECTOR_REVIEW
Kế toán hoàn thành; task Giám đốc được tạo.
Giám đốc Phê duyệt hoặc Từ chối.

ID
Quy tắc/Yêu cầu
Mức độ
Validation/Ghi chú
LIFE-001
SLA bắt đầu ngay khi task được tạo/chuyển đến role, không chờ người dùng mở màn hình.
MUST
startedAt = task.createdAt logic.
LIFE-002
Bắt đầu xử lý không thay đổi SLA Start hoặc Deadline.
MUST
Không reset/pause.
LIFE-003
Người dùng được Hoàn thành trực tiếp từ PENDING nếu validation hợp lệ.
MUST
SLA kết thúc tại completedAt.
LIFE-004
Task đã hoàn thành không tiếp tục tích lũy thời gian quá hạn.
MUST
Giữ actual duration.
LIFE-005
Task không được mở lại trong cùng workflow cycle.
MUST
Re-submit tạo task/SLA cycle mới.
LIFE-006
Mỗi task lưu snapshot thời lượng cấu hình tại thời điểm tạo.
MUST
Không phụ thuộc config hiện tại.
LIFE-007
Thay đổi cấu hình SLA không hồi tố active/completed task.
MUST
Chỉ task tạo sau hiệu lực.
LIFE-008
QA và R&D có SLA cycle độc lập nhưng bắt đầu cùng thời điểm logic.
MUST
Hai task song song.

5. Quy tắc tính thời gian và trạng thái alert
deadlineAt = slaStartedAt + slaDurationHours
elapsed = currentTime - slaStartedAt
progressRatio = elapsed / configuredDuration
remaining = deadlineAt - currentTime
Alert State
Điều kiện chính xác
Label UI
Màu hiển thị
NORMAL
Task COMPLETED hoặc progressRatio <= 0.50.
Trong hạn
Mặc định/trung tính
WARNING
Task chưa COMPLETED và 0.50 < progressRatio < 1.00.
Gần đến hạn
Cam
OVERDUE
Task chưa COMPLETED và progressRatio >= 1.00.
Quá hạn
Đỏ

Theo baseline đã chốt, màu cam xuất hiện sau khi đã dùng quá nửa thời gian. Tại đúng 50%, trạng thái vẫn NORMAL; ngay sau 50% chuyển WARNING. Tại đúng 100%, chuyển OVERDUE.

ID
Quy tắc/Yêu cầu
Mức độ
Validation/Ghi chú
CAL-001
Đơn vị tính là giờ thực tế liên tục.
MUST
Bao gồm ngoài giờ và cuối tuần.
CAL-002
Sử dụng timestamp có timezone rõ ràng ở backend.
MUST
UI hiển thị theo timezone ứng dụng/người dùng.
CAL-003
Không làm tròn sớm khi tính progressRatio.
MUST
Tránh chuyển màu sai ở boundary.
CAL-004
Thời gian hiển thị có thể làm tròn cho UX nhưng trạng thái phải dựa trên timestamp chính xác.
MUST
Ví dụ còn 1 giờ 12 phút.
CAL-005
Task completed sau deadline vẫn lưu là đã hoàn thành trễ.
MUST
Alert active kết thúc nhưng lịch sử giữ overdue.
CAL-006
SLA alert hiện tại được tính từ task active; quotation không có alert tổng hợp độc lập.
MUST
Danh sách có thể lấy alert nghiêm trọng nhất của task active.

6. Quy tắc hiển thị Cảnh báo SLA
ID
Quy tắc/Yêu cầu
Mức độ
Validation/Ghi chú
UI-001
Không đổi toàn bộ text của màn hình sang cam/đỏ.
MUST
Tránh khó đọc.
UI-002
Mã báo giá được nhấn màu theo alert của task active.
MUST
Kèm badge/text.
UI-003
Hiển thị badge “Gần đến hạn” hoặc “Quá hạn”.
MUST
Không chỉ dựa vào màu.
UI-004
Hiển thị Deadline và thời gian còn lại/quá hạn.
MUST
DateTime + duration.
UI-005
Hàng bảng có nền cam/đỏ ở mức nhạt.
MUST
Đảm bảo contrast.
UI-006
Màn hình chi tiết có viền/thanh trạng thái theo alert.
MUST
Không phủ toàn bộ nội dung.
UI-007
Màu phải đi kèm icon hoặc text để hỗ trợ accessibility.
MUST
Không dùng màu đơn độc.
UI-008
Task đã hoàn thành hiển thị trạng thái hoàn thành và thời gian thực tế; không tiếp tục màu realtime.
MUST
Có thể ghi nhận “Hoàn thành trễ” ở history.
UI-009
Danh sách ưu tiên sắp OVERDUE trước WARNING, sau đó deadline gần nhất.
SHOULD
Dashboard/work queue.
UI-010
Nếu không có alert thì không hiển thị badge/count giả.
MUST
Không hiển thị số 0 theo baseline.

6.1 Thành phần UI theo màn hình
Màn hình
Thành phần alert
Dashboard
Hai KPI/card cảnh báo cam và đỏ; danh sách task ưu tiên theo SLA.
Danh sách quotation
Mã báo giá, badge SLA, deadline/remaining, nền hàng nhạt.
Chi tiết quotation
Thanh/viền trạng thái; task active; deadline; thời gian còn lại/quá hạn.
Task panel
Badge task status + SLA alert; Start/Complete action.
Lịch sử
StartedAt, deadlineAt, completedAt, actual duration, trạng thái hoàn thành đúng/trễ.
Admin SLA Config
Bảng New/Re-submit theo công đoạn; cảnh báo hiệu lực cấu hình.

7. Dashboard Alert Specification
Widget
Nội dung
Data scope
Gần đến hạn
Số task WARNING hiện tại; ẩn số/widget count khi bằng 0 theo thiết kế.
Sales: quotation của mình; role khác/Admin: toàn bộ.
Quá hạn
Số task OVERDUE hiện tại; ẩn số/widget count khi bằng 0.
Sales: quotation của mình; role khác/Admin: toàn bộ.
Công việc chờ tôi xử lý
Task active của role hiện tại; Sales không có workflow task nội bộ.
Theo role/task.
Danh sách ưu tiên SLA
Overdue trước, warning sau, deadline gần nhất.
Theo data scope.
Hiệu suất phòng ban
Thời gian xử lý trung bình và số task trễ.
Role phòng ban/Giám đốc/Admin theo quyền.

ID
Quy tắc/Yêu cầu
Mức độ
Validation/Ghi chú
DASH-001
Alert count chỉ tính task chưa hoàn thành.
MUST
Không tính completed history.
DASH-002
Mỗi active task được đếm một lần.
MUST
QA/R&D là hai task độc lập.
DASH-003
Quotation ở QA_RND_REVIEW có thể đóng góp hai alert nếu cả QA và R&D đều warning/overdue.
MUST
Count task, không count quotation.
DASH-004
Nếu hiển thị danh sách quotation thay vì task, cần thể hiện rõ phòng ban/task gây alert.
MUST
Tránh mơ hồ.
DASH-005
Click widget mở danh sách đã lọc alert state tương ứng.
SHOULD
Giữ data scope.
DASH-006
Sales không được thấy alert của quotation Sales khác.
MUST
Backend scope trước khi aggregate.

8. SLA Configuration Management
Field cấu hình
Kiểu
Bắt buộc
Quy tắc
Task Type
Enum/RO
Có
Một trong 6 công đoạn.
New Duration Hours
Decimal
Có
> 0.
Re-submit Duration Hours
Decimal
Có
> 0.
Warning Threshold
Percentage
Có
Mặc định/fixed 50%; nếu editable phải > 0 và < 100.
Effective From
DateTime/System
Có
Áp dụng task tạo sau thời điểm hiệu lực.
Updated By/At
Audit/RO
Có
Lấy từ identity hệ thống.
Previous Values
History/RO
Có
Audit cấu hình.

ID
Quy tắc/Yêu cầu
Mức độ
Validation/Ghi chú
ADM-001
Chỉ Admin được sửa cấu hình SLA.
MUST
Role khác read-only nếu hiển thị.
ADM-002
Cấu hình phải có đủ New và Re-submit cho cả 6 task type.
MUST
Không cho lưu thiếu.
ADM-003
Giá trị thời lượng phải lớn hơn 0; không cho null, âm hoặc 0.
MUST
Decimal/number validation.
ADM-004
Thay đổi cấu hình phải lưu audit trước/sau.
MUST
Người sửa và thời điểm.
ADM-005
Task đang chạy giữ snapshot duration và deadline cũ.
MUST
Không hồi tố.
ADM-006
Task tạo sau effective time dùng cấu hình mới.
MUST
Deterministic.
ADM-007
MVP không cần lịch hiệu lực phức tạp; một bản active và history là đủ.
SHOULD
Keep simple.
ADM-008
Ngưỡng cam có thể cố định 50% để giảm effort.
SHOULD
Nếu không có yêu cầu chỉnh ngưỡng.

9. Validation Specification
9.1 Validation khi tạo task/SLA cycle
Validation
Kết quả nếu không đạt
Có cấu hình active cho task type + cycle type
Không tạo task; ghi lỗi hệ thống rõ ràng và rollback transition.
Duration > 0
Không tạo SLA cycle.
startedAt hợp lệ
Không tạo task/SLA.
deadlineAt > startedAt
Không tạo SLA.
Task cùng loại không bị tạo trùng trong cycle
Chặn duplicate/idempotent.
QA/R&D tạo song song atomic
Hoặc tạo đủ cả hai, hoặc rollback toàn bộ.

9.2 Validation khi Start Task
Actor đúng role và task đang PENDING.
Không sửa slaStartedAt, deadlineAt hoặc duration snapshot.
Ghi startedProcessingAt riêng nếu cần.
Start lặp lại phải idempotent hoặc trả lỗi trạng thái rõ ràng.
9.3 Validation khi Complete Task
Actor đúng role và task đang PENDING hoặc IN_PROGRESS.
Pass field/attachment validation của task.
Ghi completedAt theo thời gian server.
Tính actualDuration từ slaStartedAt đến completedAt.
Lưu cờ completedOnTime/completedLate hoặc dữ liệu đủ để suy ra.
Dừng alert realtime; tạo task tiếp theo theo State Machine.
Complete lặp lại không tạo task tiếp theo lần hai.
9.4 Validation cấu hình
Trường hợp
Thông báo đề xuất
Duration trống
Vui lòng nhập thời lượng SLA.
Duration <= 0
Thời lượng SLA phải lớn hơn 0 giờ.
Thiếu cấu hình công đoạn
Vui lòng cấu hình đầy đủ SLA cho tất cả công đoạn.
Warning threshold không hợp lệ
Ngưỡng cảnh báo phải lớn hơn 0% và nhỏ hơn 100%.
Cấu hình thay đổi
Cấu hình mới chỉ áp dụng cho công việc được tạo sau khi lưu.
Lỗi tạo task do thiếu config
Không thể tạo công việc vì cấu hình SLA chưa đầy đủ. Vui lòng liên hệ Quản trị viên.

10. Dữ liệu SLA và Audit History
Field
Ý nghĩa
Bắt buộc
slaCycleId
Định danh SLA cycle.
Có
workflowCycleId
Liên kết NEW/RE_SUBMIT.
Có
taskId
Task được theo dõi.
Có
taskType
Công đoạn.
Có
cycleType
NEW/RE_SUBMIT.
Có
configuredDurationHours
Snapshot thời lượng.
Có
warningThreshold
Snapshot ngưỡng.
Có
startedAt
Bắt đầu SLA.
Có
deadlineAt
Hạn hoàn thành.
Có
processingStartedAt
Thời điểm bấm Start nếu có.
Không
completedAt
Thời điểm Complete/decision.
Điều kiện
actualDuration
Thời gian thực tế.
Điều kiện
completedLate
Hoàn thành sau deadline.
Điều kiện
createdBySystemEvent
Sự kiện tạo task.
Có
configVersion/updated reference
Tham chiếu cấu hình snapshot.
SHOULD

ID
Quy tắc/Yêu cầu
Mức độ
Validation/Ghi chú
HIS-001
Không ghi đè SLA cycle cũ khi re-submit.
MUST
Mỗi task mới có cycle mới.
HIS-002
History phải cho biết task hoàn thành đúng hạn hay trễ.
MUST
Ngay cả khi không còn alert active.
HIS-003
Sửa cấu hình không làm thay đổi historical deadline/duration.
MUST
Snapshot.
HIS-004
Mọi thay đổi config lưu updatedBy, updatedAt và before/after.
MUST
Audit.
HIS-005
Alert state realtime có thể tính động; completedLate phải suy ra/lưu ổn định.
MUST
Báo cáo lịch sử nhất quán.

11. Tính nhất quán và xử lý đồng thời
Task creation và SLA snapshot phải nằm trong cùng transaction nghiệp vụ.
Parallel join QA/R&D phải atomic; chỉ tạo một EXECUTOR_CONSOLIDATION task và một SLA cycle.
Complete/Approve/Reject phải có state check hoặc idempotency để tránh kết thúc SLA hai lần.
Thời gian server là nguồn chính; không tin timestamp do frontend gửi.
Optimistic locking hoặc cơ chế tương đương phải chặn stale update.
Aggregate dashboard phải áp dụng data scope ở truy vấn backend, không lọc sau ở frontend.
12. Boundary và Edge Cases
Tình huống
Kết quả mong đợi
Đúng 50% SLA
NORMAL.
Ngay sau 50%
WARNING.
Đúng 100%
OVERDUE.
Complete đúng deadline
Hoàn thành đúng hạn nếu completedAt <= deadlineAt.
Complete sau deadline
Hoàn thành trễ; alert active kết thúc nhưng history ghi late.
Task Start sau khi đã WARNING
Giữ WARNING; deadline không đổi.
Task Start sau khi OVERDUE
Giữ OVERDUE; deadline không đổi.
Admin sửa duration khi task đang chạy
Task giữ duration/deadline snapshot cũ.
Re-submit
Tạo SLA cycle mới theo config Re-submit; history cũ giữ nguyên.
QA complete, R&D overdue
Quotation vẫn QA_RND_REVIEW; chỉ R&D task có alert active.
Cả QA/R&D overdue
Dashboard task count tăng 2; nếu list quotation phải chỉ rõ cả hai task.
Clock/timezone UI khác backend
Backend timestamp chuẩn; UI convert theo timezone cấu hình.
Không có alert
Không hiển thị số 0/badge giả.

13. API Capability đề xuất
Capability
Mục đích
Quyền
GetCurrentSla
Lấy SLA task active của quotation.
Theo quotation data scope.
ListSlaAlerts
Danh sách WARNING/OVERDUE có filter/paging.
Theo data scope.
GetSlaHistory
Lịch sử SLA theo quotation/cycle/task.
Theo data scope.
GetDashboardAlertSummary
Count cam/đỏ và danh sách ưu tiên.
Theo data scope.
ListSlaConfigurations
Danh sách cấu hình.
Admin; role khác RO nếu cần.
UpdateSlaConfiguration
Sửa duration New/Re-submit.
Admin.
GetSlaConfigurationHistory
Audit cấu hình.
Admin.
StartTask
Cập nhật task IN_PROGRESS, không đổi SLA.
Role task.
CompleteTask
Kết thúc SLA khi validation pass.
Role task.
Approve/Reject
Kết thúc Director SLA.
Giám đốc.

14. Label và thông báo UI chuẩn
Ngữ cảnh
Nội dung
Badge normal
Trong hạn
Badge warning
Gần đến hạn
Badge overdue
Quá hạn
Remaining
Còn {duration}
Overdue duration
Quá hạn {duration}
Deadline
Hạn xử lý: {dateTime}
Completed on time
Hoàn thành đúng hạn
Completed late
Hoàn thành trễ {duration}
No alert
Không hiển thị badge/count.
Config effect note
Cấu hình mới chỉ áp dụng cho công việc được tạo sau khi lưu.
No alerts empty state
Không có công việc gần đến hạn hoặc quá hạn.

15. Kịch bản kiểm thử tối thiểu
ID
Kịch bản
Kết quả mong đợi
SLA-T01
Tạo NEW EXECUTOR intake
Duration 2h; deadline đúng.
SLA-T02
Tạo RE_SUBMIT intake
Duration 1h.
SLA-T03
QA/R&D được tạo cùng lúc
Hai SLA độc lập, cùng start logic.
SLA-T04
Qua 50% + 1 giây
WARNING màu cam.
SLA-T05
Đúng deadline
OVERDUE màu đỏ.
SLA-T06
Start task
Deadline giữ nguyên.
SLA-T07
Complete trực tiếp từ PENDING
SLA kết thúc nếu validation pass.
SLA-T08
Complete thiếu attachment
Không complete; SLA tiếp tục.
SLA-T09
Complete sau deadline
History ghi completed late.
SLA-T10
Admin sửa config khi task active
Task active giữ deadline cũ.
SLA-T11
Task mới sau sửa config
Dùng duration mới.
SLA-T12
Hai QA/R&D complete gần đồng thời
Chỉ một task tổng hợp/SLA được tạo.
SLA-T13
Sales dashboard
Không thấy alert quotation Sales khác.
SLA-T14
Không có alert
Không hiển thị count 0.
SLA-T15
Re-submit
SLA cycle mới; history cycle cũ không đổi.
SLA-T16
Boundary 50%/100%
Trạng thái đúng quy tắc inclusive/exclusive.
SLA-T17
Timezone display
Deadline hiển thị nhất quán với timestamp backend.

16. Acceptance Criteria
Mỗi task được tạo với snapshot SLA đúng theo task type và NEW/RE_SUBMIT.
SLA chạy 24/7 và không bị reset khi bấm Bắt đầu xử lý.
WARNING xuất hiện sau 50%; OVERDUE xuất hiện từ 100%.
Hoàn thành trực tiếp từ PENDING được hỗ trợ và kết thúc SLA.
Màu cam/đỏ chỉ áp dụng cho thành phần đã thống nhất, luôn kèm text/badge/icon.
Dashboard cam/đỏ áp dụng đúng data scope và không hiển thị số 0.
Task completed late vẫn được ghi nhận trong history.
Admin sửa được cấu hình, nhưng không hồi tố task đang chạy.
Frontend và backend cùng validate; backend quyết định cuối.
Parallel QA/R&D không tạo trùng task hoặc SLA tiếp theo.
17. Chi tiết còn mở
Open ID
Nội dung
Ảnh hưởng
SLA-O01
Ngưỡng WARNING 50% có cần cho Admin chỉnh hay cố định.
Admin UI/config model.
SLA-O02
Timezone chính thức của ứng dụng và cách hiển thị cho user.
Date/time display.
SLA-O03
Chu kỳ refresh/polling hoặc realtime update của countdown.
Frontend architecture.
SLA-O04
Có lưu alert state transition event riêng hay tính động hoàn toàn.
Audit/reporting.
SLA-O05
Format duration hiển thị: giờ/phút hay ngày giờ phút.
UI consistency.
SLA-O06
Chính sách phân quyền xem SLA config đối với non-Admin.
Menu/read-only screen.
SLA-O07
Khoảng thời gian và filter mặc định của báo cáo SLA.
Reporting.
SLA-O08
Có cần đánh dấu escalation ngoài màu cam/đỏ trong phase sau.
Ngoài MVP hiện tại.
