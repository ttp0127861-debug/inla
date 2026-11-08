# MVP Feature List Quotation Management

> Converted from `MVP_Feature_List_Quotation_Management.docx` (Word baseline). **Source of truth:** this Markdown file.
> Annex/deltas: `annex/`, `spec-deltas/`. Templates: `templates/`.
MVP FEATURE LIST
Hệ thống quản lý quy trình báo giá thùng carton
Phiên bản
Baseline 0.1
Ngày
13/10/2026
Phạm vi
MVP
Ngôn ngữ UI
Tiếng Việt
Trạng thái
Tài liệu làm việc tạm thời


1. Mục đích và cách sử dụng
Tài liệu liệt kê các tính năng thuộc phạm vi MVP theo từng module. Mỗi tính năng được mô tả ở mức đủ để lập Screen Inventory, UI Workflow, backlog phát triển và tiêu chí demo. Tài liệu không thay thế State Machine, Permission Matrix hoặc SRS chi tiết.
Quy ước ưu tiên: MUST = bắt buộc để chạy end-to-end demo; SHOULD = cần có trong MVP nhưng có thể hoàn thiện sau luồng lõi; COULD = hữu ích cho demo, không được làm ảnh hưởng tiến độ luồng lõi.

2. Tổng quan module
Mã
Module
Mục tiêu
Ưu tiên
M01
Xác thực và phiên làm việc
Đăng nhập an toàn, xác định đúng một business role.
MUST
M02
Dashboard
Hiển thị công việc, SLA alert và KPI theo data scope.
MUST
M03
Customer Management
Quản lý Customer, Người liên hệ và quan hệ Customer–Sales.
MUST
M04
Quotation Management
Tạo, xem, sửa Draft, clone, cancel và quản lý dữ liệu carton.
MUST
M05
Workflow & Task
Điều phối end-to-end qua EXECUTOR, QA, R&D, Kế toán, Giám đốc.
MUST
M06
SLA & Alert
Cấu hình deadline và hiển thị cảnh báo cam/đỏ.
MUST
M07
Attachment
Upload và quản lý tệp theo từng role/task.
MUST
M08
Outcome & Re-submit
Sales cập nhật kết quả và chạy lại workflow hợp lệ.
MUST
M09
History & Versioning
Truy xuất revision, task, SLA và audit history.
MUST
M10
Similar Quotations
Gợi ý tối đa 5 báo giá theo Customer/sản phẩm.
SHOULD
M11
Reporting
KPI vận hành và kết quả kinh doanh.
SHOULD
M12
User Administration
Quản lý account và ràng buộc role.
MUST
M13
SLA Administration
Quản lý SLA New/Re-submit theo công đoạn.
MUST
M14
System UX & Validation
Tiếng Việt, phân quyền UI, lỗi/empty/loading states.
MUST

3. Module M01 - Xác thực và phiên làm việc
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
AUTH-01
Đăng nhập
Đăng nhập bằng account do Admin quản lý qua Amazon Cognito.
Tất cả
MUST
AUTH-02
Đăng xuất
Kết thúc phiên và đưa người dùng về màn hình đăng nhập.
Tất cả
MUST
AUTH-03
Khôi phục/đặt lại mật khẩu
Hỗ trợ luồng reset mật khẩu theo cơ chế Cognito; không gửi email nghiệp vụ.
Tất cả/Admin
MUST
AUTH-04
Xác định role
Mỗi account thuộc đúng một Cognito group/business role.
Hệ thống
MUST
AUTH-05
Bảo vệ route
Ẩn/chặn màn hình và action không thuộc role. Backend vẫn phải kiểm tra lại.
Hệ thống
MUST
AUTH-06
Thông tin tài khoản
Hiển thị họ tên, role và thao tác đăng xuất.
Tất cả
SHOULD
AUTH-07
Hết phiên
Xử lý token hết hạn và yêu cầu đăng nhập lại, không để người dùng thao tác trên phiên không hợp lệ.
Hệ thống
MUST

4. Module M02 - Dashboard
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
DASH-01
Dashboard theo role
Nội dung và data scope thay đổi theo role đăng nhập.
Tất cả
MUST
DASH-02
Công việc chờ xử lý
Hiển thị các task đang PENDING/IN_PROGRESS thuộc công đoạn của role hiện tại.
EXECUTOR/QA/R&D/Kế toán/Giám đốc
MUST
DASH-03
Số cảnh báo màu cam
Hiển thị số task đã dùng quá 50% SLA nhưng chưa hết hạn; ẩn số khi bằng 0.
Theo data scope
MUST
DASH-04
Số cảnh báo màu đỏ
Hiển thị số task hết/vượt SLA; ẩn số khi bằng 0.
Theo data scope
MUST
DASH-05
Danh sách ưu tiên SLA
Sắp xếp task theo overdue trước, sau đó thời gian còn lại tăng dần.
Theo data scope
MUST
DASH-06
Báo giá mới đang xử lý
KPI số workflow cycle loại New chưa kết thúc.
Theo data scope
SHOULD
DASH-07
Re-submit đang xử lý
KPI số workflow cycle loại Re-submit chưa kết thúc.
Theo data scope
SHOULD
DASH-08
Phân bố workflow status
Biểu đồ/số lượng quotation theo trạng thái workflow.
Theo data scope
SHOULD
DASH-09
Thời gian xử lý trung bình
Hiển thị thời gian trung bình theo công đoạn/phòng ban.
Phòng ban/Giám đốc/Admin
SHOULD
DASH-10
KPI kết quả kinh doanh
Sent, Won, Lost, tỷ lệ Won/Lost, tổng giá trị Won, tỷ lệ/số lần re-submit.
Theo data scope
SHOULD
DASH-11
Điều hướng từ KPI
Chọn KPI/alert để mở danh sách đã áp dụng bộ lọc tương ứng.
Tất cả
SHOULD

5. Module M03 - Customer Management
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
CUS-01
Danh sách Customer
Tìm kiếm, lọc, phân trang và xem trạng thái hoạt động trong data scope.
Tất cả
MUST
CUS-02
Tạo Customer
Tạo Customer loại Doanh nghiệp hoặc Cá nhân.
Tất cả
MUST
CUS-03
Sửa Customer
Sửa thông tin Customer trong data scope.
Tất cả
MUST
CUS-04
Xem chi tiết Customer
Hiển thị thông tin cơ bản, Người liên hệ, Sales liên quan và quotation được phép xem.
Tất cả
MUST
CUS-05
Mã số thuế bắt buộc
Bắt buộc cho cả Doanh nghiệp và Cá nhân; quy tắc uniqueness còn mở.
Tất cả
MUST
CUS-06
Thông tin liên lạc bắt buộc
Bắt buộc dữ liệu liên hệ tối thiểu theo field specification.
Tất cả
MUST
CUS-07
Quan hệ Customer–Sales
Cho phép một Customer liên quan nhiều Sales; Sales chỉ xem Customer có quan hệ với mình.
Sales/Admin hoặc flow được cấp
MUST
CUS-08
Thêm Người liên hệ
Doanh nghiệp bắt buộc ít nhất một người liên hệ; Cá nhân là tùy chọn.
Tất cả
MUST
CUS-09
Sửa Người liên hệ
Cập nhật họ tên, chức vụ, phòng ban, email, điện thoại, ghi chú và liên hệ chính.
Tất cả
MUST
CUS-10
Liên hệ mặc định cho Cá nhân
Nếu Cá nhân không có Người liên hệ, tự dùng thông tin Customer làm đầu mối liên hệ.
Hệ thống
MUST
CUS-11
Ngừng hoạt động
Đổi trạng thái thay vì hard delete Customer đã từng có quotation.
Tất cả trong data scope
MUST
CUS-12
Xóa Customer chưa sử dụng
Chỉ cho xóa nếu chưa từng liên kết quotation; có cảnh báo xác nhận.
Tất cả trong data scope
SHOULD
CUS-13
Ẩn Customer ngừng hoạt động
Không cho chọn Customer ngừng hoạt động khi tạo quotation mới; vẫn xem được lịch sử.
Hệ thống
MUST

6. Module M04 - Quotation Management
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
QUO-01
Danh sách quotation
Tìm kiếm/lọc/phân trang theo mã, Customer, workflow status, outcome, loại cycle, Sales Owner và SLA alert.
Theo data scope
MUST
QUO-02
Tạo quotation Draft
Sales tạo quotation mới và tự trở thành Sales Owner.
Sales
MUST
QUO-03
Chọn Customer/Contact
Chỉ chọn Customer liên quan đến Sales; hỗ trợ Người liên hệ theo quy tắc Customer type.
Sales
MUST
QUO-04
Nhập thông tin carton
Loại thùng; D/R/C; lọt lòng/phủ bì; chất liệu; số lớp; kiểu sóng; tải trọng; in ấn; số lượng; giao hàng; thời gian; yêu cầu khác.
Sales
MUST
QUO-05
Lưu Draft
Cho phép lưu chưa hoàn chỉnh và tiếp tục sửa khi DRAFT.
Sales Owner
MUST
QUO-06
Submit quotation
Validate dữ liệu bắt buộc, tạo workflow cycle New và task EXECUTOR_INTAKE.
Sales Owner
MUST
QUO-07
Xem chi tiết
Hiển thị tổng quan, dữ liệu đầu vào, kết quả từng phòng ban, workflow, SLA, attachment và lịch sử.
Theo data scope
MUST
QUO-08
Hủy Draft
Chỉ Sales Owner; sau submit không role nào được cancel.
Sales Owner
MUST
QUO-09
Clone quotation
Tạo quotation mới DRAFT, copy Customer/Contact/dữ liệu carton; không copy kết quả, history, SLA, approval/outcome.
Sales
MUST
QUO-10
Chọn attachment khi clone
Không copy mặc định; Sales chọn từng file muốn dùng lại.
Sales
SHOULD
QUO-11
Tham chiếu quotation nguồn
Lưu và hiển thị “Sao chép từ báo giá”.
Hệ thống
SHOULD
QUO-12
Khóa chỉnh sửa khi workflow chạy
Sales và các role không sửa dữ liệu không thuộc task/status cho phép.
Hệ thống
MUST
QUO-13
Hiển thị Sales Owner
Quotation có đúng một Sales Owner và không có chức năng chuyển owner.
Hệ thống
MUST
QUO-14
Tiền tệ VNĐ
Các field tiền của MVP chỉ dùng VNĐ.
Hệ thống
MUST

7. Module M05 - Workflow & Task
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
WF-01
Khởi tạo workflow New
Tạo cycle New khi Sales submit lần đầu.
Hệ thống
MUST
WF-02
Task EXECUTOR tiếp nhận
EXECUTOR xem yêu cầu và chọn Bắt đầu xử lý hoặc Hoàn thành trực tiếp.
EXECUTOR
MUST
WF-03
Khởi tạo song song QA/R&D
Khi EXECUTOR tiếp nhận hoàn thành, tạo đồng thời hai task và SLA.
Hệ thống
MUST
WF-04
Task QA
Nhập kết quả đánh giá, yêu cầu chất lượng, ghi chú; attachment riêng bắt buộc khi Complete.
QA
MUST
WF-05
Task R&D
Nhập chi phí bản in/khuôn, ngày đặt dự kiến, ghi chú; attachment riêng bắt buộc khi Complete.
R&D
MUST
WF-06
Join QA/R&D
Chỉ tạo task EXECUTOR tổng hợp khi cả QA và R&D COMPLETED.
Hệ thống
MUST
WF-07
Task EXECUTOR tổng hợp
Nhập đơn giá/1 thùng, thông tin tùy chọn; xem chi phí R&D read-only; attachment riêng bắt buộc.
EXECUTOR
MUST
WF-08
Task Kế toán
Nhập điều kiện thanh toán, VAT mặc định 10%, điều chỉnh tài chính, giá trị cuối cùng bắt buộc, ghi chú và attachment tùy chọn.
Kế toán
MUST
WF-09
Task Giám đốc
Xem toàn bộ dữ liệu và Phê duyệt/Từ chối; lý do từ chối bắt buộc.
Giám đốc
MUST
WF-10
Bắt đầu xử lý tùy chọn
PENDING→IN_PROGRESS, không reset/pause SLA.
Role task
MUST
WF-11
Hoàn thành trực tiếp
Cho phép PENDING→COMPLETED nếu validation hợp lệ.
Role task
MUST
WF-12
Tự động chuyển bước
Hoàn thành task tạo/chuyển task tiếp theo theo state machine.
Hệ thống
MUST
WF-13
Không trả lại bước trước
Không có Return/Request More Information trong MVP.
Hệ thống
MUST
WF-14
Workflow kết thúc
APPROVED hoặc REJECTED kết thúc cycle nội bộ.
Hệ thống
MUST

8. Module M06 - SLA & Alert
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
SLA-01
Khởi tạo SLA cycle
Bắt đầu khi task được chuyển tới role/phòng ban.
Hệ thống
MUST
SLA-02
Kết thúc SLA cycle
Kết thúc khi task COMPLETED hoặc Giám đốc approve/reject.
Hệ thống
MUST
SLA-03
Tính 24/7
Tính giờ thực tế liên tục, gồm ngoài giờ và cuối tuần.
Hệ thống
MUST
SLA-04
SLA theo cycle type
Áp dụng thời lượng riêng cho New và Re-submit ở từng công đoạn.
Hệ thống
MUST
SLA-05
Alert màu cam
Trên 50% và dưới 100% SLA, task chưa hoàn thành.
Hệ thống
MUST
SLA-06
Alert màu đỏ
Đạt/vượt 100% SLA, task chưa hoàn thành.
Hệ thống
MUST
SLA-07
Hiển thị còn lại/quá hạn
Hiển thị deadline và thời gian còn lại hoặc đã quá hạn.
Theo data scope
MUST
SLA-08
Style cảnh báo có kiểm soát
Đánh dấu mã, badge, thời gian, nền hàng nhạt và thanh trạng thái; không tô toàn bộ text.
Hệ thống
MUST
SLA-09
Lưu lịch sử SLA
Không ghi đè cycle cũ; lưu start/end/deadline/duration/alert state.
Hệ thống
MUST
SLA-10
Không hiển thị số 0
Dashboard không hiển thị số alert cam/đỏ khi count bằng 0.
Hệ thống
SHOULD

9. Module M07 - Attachment
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
ATT-01
Upload theo task
Attachment gắn quotation, workflow cycle, task, role và user upload.
Role task
MUST
ATT-02
Tối đa 10 tệp/task
Giới hạn riêng cho mỗi role/task, không áp dụng cho toàn quotation.
Hệ thống
MUST
ATT-03
Định dạng ảnh
JPG, JPEG, PNG, WEBP; tối đa 10 MB/tệp.
Hệ thống
MUST
ATT-04
Định dạng video
MP4, MOV, WEBM; tối đa 100 MB/tệp.
Hệ thống
MUST
ATT-05
Định dạng tài liệu
PDF, DOC, DOCX, XLS, XLSX; tối đa 20 MB/tệp.
Hệ thống
MUST
ATT-06
Validation MIME/extension
Kiểm tra frontend và backend; backend quyết định cuối cùng.
Hệ thống
MUST
ATT-07
Validation role ownership
File của task trước không thỏa điều kiện attachment bắt buộc task hiện tại.
Hệ thống
MUST
ATT-08
QA attachment bắt buộc
Ít nhất 1 file do QA upload trước Complete.
QA
MUST
ATT-09
R&D attachment bắt buộc
Ít nhất 1 file do R&D upload trước Complete.
R&D
MUST
ATT-10
EXECUTOR tổng hợp bắt buộc
Ít nhất 1 file do EXECUTOR upload ở task tổng hợp trước Complete.
EXECUTOR
MUST
ATT-11
Danh sách/preview/download
Hiển thị metadata; cho xem trước loại hỗ trợ hoặc tải xuống.
Theo data scope
SHOULD
ATT-12
Xóa trước Complete
Người upload được xóa file trong task còn mở; giữ audit metadata phù hợp.
Role task
SHOULD
ATT-13
Label định dạng
UI hiển thị đầy đủ extension, dung lượng và giới hạn 10 tệp.
Hệ thống
MUST

10. Module M08 - Outcome & Re-submit
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
OUT-01
Cập nhật Đã gửi khách hàng
Sales Owner chuyển từ APPROVED sang SENT_TO_CUSTOMER.
Sales Owner
MUST
OUT-02
Cập nhật Thành công
Sales Owner chuyển APPROVED hoặc SENT_TO_CUSTOMER sang WON.
Sales Owner
MUST
OUT-03
Cập nhật Thất bại
Sales Owner chuyển APPROVED hoặc SENT_TO_CUSTOMER sang LOST.
Sales Owner
MUST
OUT-04
Không ép đi qua Sent
Cho phép APPROVED chuyển trực tiếp WON/LOST.
Sales Owner
MUST
OUT-05
Tách outcome và workflow
Outcome không thay thế workflow status; REJECTED không phải LOST.
Hệ thống
MUST
RES-01
Điều kiện re-submit
Chỉ quotation REJECTED hoặc outcome LOST.
Sales Owner
MUST
RES-02
Lý do re-submit
Bắt buộc nhập trước khi tạo cycle mới.
Sales Owner
MUST
RES-03
Chỉnh dữ liệu trước re-submit
Sales được sửa dữ liệu đầu vào trong giai đoạn chuẩn bị re-submit.
Sales Owner
MUST
RES-04
Tạo cycle Re-submit
Giữ quotation identity; tạo revision/task/SLA cycle mới từ EXECUTOR_INTAKE.
Hệ thống
MUST
RES-05
Không kế thừa task cũ
Không copy completion/result của task cũ vào cycle mới; lịch sử vẫn giữ nguyên.
Hệ thống
MUST

11. Module M09 - History & Versioning
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
HIS-01
Audit bằng Envers
Tự quản lý revision dữ liệu entity qua Hibernate Envers.
Hệ thống
MUST
HIS-02
Timeline quotation
Hiển thị toàn bộ sự kiện theo thời gian và workflow cycle.
Theo data scope
MUST
HIS-03
Lịch sử trạng thái
Lưu status trước/sau, actor và timestamp.
Hệ thống
MUST
HIS-04
Lịch sử task
Lưu thời điểm tạo, bắt đầu, hoàn thành và role/user xử lý.
Hệ thống
MUST
HIS-05
Lịch sử SLA
Lưu deadline và thời gian xử lý thực tế của từng task cycle.
Hệ thống
MUST
HIS-06
Lịch sử approve/reject
Lưu ghi chú phê duyệt hoặc lý do từ chối bắt buộc.
Hệ thống
MUST
HIS-07
Lịch sử outcome
Lưu cập nhật Sent/Won/Lost và người cập nhật.
Hệ thống
MUST
HIS-08
Lịch sử re-submit
Hiển thị lý do và liên kết các cycle của cùng quotation.
Hệ thống
MUST
HIS-09
Xem revision
Cho phép mở dữ liệu tại một revision ở chế độ chỉ đọc.
Theo data scope
SHOULD
HIS-10
Không so sánh song song
Không bao gồm UI diff giữa hai revision trong MVP.
Hệ thống
MUST

12. Module M10 - Similar Quotations
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
SIM-01
Theo Customer
Cùng customerId, bỏ quotation hiện tại, mới nhất trước, tối đa 5.
EXECUTOR tổng hợp
SHOULD
SIM-02
Theo sản phẩm
Chấm điểm deterministic theo loại thùng, kích thước, vật liệu, sóng, in và số lượng.
EXECUTOR tổng hợp
SHOULD
SIM-03
Sắp xếp kết quả
similarityScore giảm dần, sau đó ngày tạo giảm dần.
Hệ thống
SHOULD
SIM-04
Carousel
Mỗi nhóm hiển thị tối đa 5 card và mở được quotation lịch sử.
EXECUTOR
SHOULD
SIM-05
Empty state
Hiển thị “Không có báo giá tương tự trước đây.” cho từng nhóm độc lập.
Hệ thống
SHOULD
SIM-06
Không dùng AI
Không dùng vector search/AI trong MVP.
Hệ thống
MUST

13. Module M11 - Reporting
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
RPT-01
Báo cáo SLA
Số lượng/trạng thái alert và thời gian xử lý theo công đoạn.
Phòng ban/Giám đốc/Admin
SHOULD
RPT-02
Báo cáo workflow
Số quotation theo status, loại New/Re-submit và khoảng thời gian.
Theo data scope
SHOULD
RPT-03
Báo cáo outcome
Sent, Won, Lost và tỷ lệ tương ứng.
Theo data scope
SHOULD
RPT-04
Giá trị Won
Tổng giá trị cuối cùng của quotation outcome WON.
Theo data scope
SHOULD
RPT-05
Hiệu suất phòng ban
Thời gian xử lý trung bình và số task overdue theo role.
Giám đốc/Admin, phòng ban phù hợp
SHOULD
RPT-06
Tỷ lệ re-submit
Tỷ lệ quotation có re-submit và số lần trung bình.
Theo data scope
SHOULD
RPT-07
Bộ lọc thời gian
Lọc theo khoảng ngày và các chiều dữ liệu phù hợp.
Theo data scope
SHOULD
RPT-08
Export
Export chưa được baseline xác nhận; để mở, không bắt buộc demo.
Chưa chốt
COULD

14. Module M12 - User Administration
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
USR-01
Danh sách account
Xem account, role, trạng thái và thông tin liên hệ.
Admin
MUST
USR-02
Tạo Sales account
Admin tạo account Sales theo nhu cầu.
Admin
MUST
USR-03
Quản lý account role cố định
Quản lý account QA/R&D/Kế toán/Giám đốc theo quy tắc vận hành.
Admin
MUST
USR-04
Ràng buộc EXECUTOR duy nhất
Không cho tạo account EXECUTOR thứ hai.
Admin/Hệ thống
MUST
USR-05
Sửa hồ sơ account
Sửa họ tên, email và số điện thoại.
Admin
MUST
USR-06
Khóa/Mở khóa
Ngăn hoặc cho phép đăng nhập mà không xóa lịch sử.
Admin
MUST
USR-07
Reset mật khẩu
Kích hoạt quy trình reset mật khẩu.
Admin
MUST
USR-08
Thay account khi nghỉ việc
Cho thay account nghiệp vụ cũ bằng account mới; không chuyển quotation Sales trong MVP.
Admin
SHOULD
USR-09
Một role/account
Không gán nhiều business role.
Hệ thống
MUST
USR-10
Không permission editor
Không có UI chỉnh permission chi tiết trong MVP.
Hệ thống
MUST

15. Module M13 - SLA Administration
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
CFG-01
Danh sách cấu hình SLA
Hiển thị thời lượng New/Re-submit theo từng công đoạn.
Admin
MUST
CFG-02
Sửa thời lượng SLA
Cho Admin cập nhật số giờ; áp dụng cho task tạo sau thời điểm hiệu lực.
Admin
MUST
CFG-03
Cấu hình cảnh báo 50%
Ngưỡng cam mặc định 50%; MVP có thể cố định nếu chưa cần UI chỉnh.
Admin/Hệ thống
SHOULD
CFG-04
Validation cấu hình
Thời lượng phải lớn hơn 0; không cho thiếu công đoạn/cycle type.
Hệ thống
MUST
CFG-05
Lưu audit cấu hình
Lưu người sửa, thời điểm và giá trị cũ/mới.
Hệ thống
SHOULD
CFG-06
Không sửa deadline task đang chạy
Cấu hình mới không hồi tố task đã tạo, tránh thay đổi lịch sử SLA.
Hệ thống
MUST

16. Module M14 - System UX & Validation
ID
Tính năng
Mô tả/Quy tắc
Actor chính
Ưu tiên
UX-01
Toàn bộ label tiếng Việt
Menu, form, button, trạng thái, lỗi và empty state dùng tiếng Việt.
Hệ thống
MUST
UX-02
Desktop-first
Giao diện web management ưu tiên desktop.
Hệ thống
MUST
UX-03
Action theo role/status
Chỉ hiện action hợp lệ; backend vẫn kiểm tra authorization.
Hệ thống
MUST
UX-04
Read-only rõ ràng
Dữ liệu phòng ban khác hiển thị chỉ đọc và có phân vùng rõ.
Hệ thống
MUST
UX-05
Validation inline
Hiển thị lỗi field/attachment trước Complete hoặc Submit.
Hệ thống
MUST
UX-06
Confirmation dialog
Xác nhận cho Cancel, Reject, Delete, Deactivate và các action không thể đảo ngược.
Hệ thống
MUST
UX-07
Loading/empty/error state
Có trạng thái tải, không dữ liệu, lỗi hệ thống và không có quyền.
Hệ thống
MUST
UX-08
Toast/action result
Thông báo kết quả hành động trong ứng dụng; không phải business notification.
Hệ thống
SHOULD
UX-09
Accessibility màu SLA
Màu cam/đỏ luôn đi kèm badge/text/icon, không dựa duy nhất vào màu.
Hệ thống
MUST
UX-10
Định dạng tiền/ngày
VNĐ và ngày giờ hiển thị nhất quán theo locale Việt Nam.
Hệ thống
MUST

17. Tóm tắt feature theo role
Role
Nhóm chức năng chính
Data scope
Sales
Customer liên quan; tạo/sửa Draft; submit; clone; cancel Draft; Sent/Won/Lost; re-submit; xem history.
Quotation của chính mình; Customer có quan hệ.
EXECUTOR
Tiếp nhận; tổng hợp; upload; xem báo giá tương tự; xem toàn bộ history.
Toàn bộ quotation/Customer.
QA
Xử lý task QA; nhập dữ liệu; upload; complete.
Toàn bộ quotation/Customer; chỉ sửa task QA hiện tại.
R&D
Xử lý task R&D; nhập chi phí/ngày; upload; complete.
Toàn bộ quotation/Customer; chỉ sửa task R&D hiện tại.
Kế toán
Nhập tài chính, giá trị cuối cùng; complete.
Toàn bộ quotation/Customer; chỉ sửa task Kế toán hiện tại.
Giám đốc
Xem toàn bộ; approve/reject; dashboard/report toàn cục.
Toàn bộ.
Admin
User/SLA admin; xem toàn bộ; không thao tác nghiệp vụ thay role.
Toàn bộ dữ liệu đọc; admin modules ghi.

18. Dependencies và thứ tự triển khai đề xuất
Giai đoạn
Module/Feature
Kết quả
1. Foundation
M01, M12 cơ bản, M14 cơ bản
Đăng nhập, role, route, layout và mock user.
2. Master Data
M03, M07 nền tảng
CRUD Customer/Contact, quan hệ Sales, upload component.
3. Quotation Core
M04
Tạo Draft, sửa, xem, cancel, clone.
4. Workflow Core
M05 + M06
Luồng EXECUTOR→QA/R&D→EXECUTOR→Kế toán→Giám đốc và SLA.
5. Outcome/Re-submit
M08
Kết quả kinh doanh và workflow cycle mới.
6. History
M09
Timeline, revisions, task/SLA audit.
7. Dashboard/Similar
M02 + M10
Operational dashboard và suggestions.
8. Reports/Admin Polish
M11 + M13 + M14
Reporting, SLA configuration, UX states và demo polish.

19. Kịch bản demo bắt buộc
Sales tạo Customer doanh nghiệp, Người liên hệ và liên kết Customer với Sales.
Sales tạo quotation Draft, nhập thông tin carton, upload file và submit.
EXECUTOR hoàn thành tiếp nhận trực tiếp; hệ thống tạo task QA và R&D song song.
QA và R&D hoàn thành với dữ liệu và attachment riêng; workflow chờ đủ hai task.
EXECUTOR xem báo giá tương tự, nhập đơn giá, upload file và hoàn thành tổng hợp.
Kế toán nhập VAT/giá trị cuối cùng và hoàn thành.
Giám đốc approve; Sales cập nhật trực tiếp Won hoặc đi qua Sent to Customer.
Giám đốc reject một quotation khác; Sales nhập lý do và re-submit.
Hiển thị task màu cam/đỏ theo SLA; dashboard áp dụng đúng data scope.
Sales A không xem quotation Sales B; hai Sales có thể cùng xem Customer khi cùng được liên kết.
Clone quotation tạo Draft mới đúng quy tắc; xem timeline và revision cũ.
20. Chi tiết còn mở, không bổ sung phạm vi
Trọng số/ngưỡng similarity; danh mục loại thùng, chất liệu, kiểu sóng.
Quy tắc uniqueness mã số thuế và format mã quotation/revision.
UX quản lý quan hệ Customer–nhiều Sales.
Cơ chế lưu trữ/preview/retention file.
Export báo cáo; bộ lọc và khoảng thời gian mặc định.
Quy tắc vận hành account Sales nghỉ việc; không được biến thành chức năng chuyển quotation nếu chưa có quyết định mới.
