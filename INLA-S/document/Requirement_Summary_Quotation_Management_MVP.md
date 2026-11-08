# Requirement Summary Quotation Management MVP

> Converted from `Requirement_Summary_Quotation_Management_MVP.docx` (Word baseline). **Source of truth:** this Markdown file.
> Annex/deltas: `annex/`, `spec-deltas/`. Templates: `templates/`.
REQUIREMENT SUMMARY
Hệ thống quản lý quy trình báo giá thùng carton
Phiên bản
Baseline 0.1
Ngày tổng hợp
13/10/2026
Phạm vi
MVP
Mục đích
Nền tảng cho Figma, UI workflow và demo application
TÀI LIỆU LÀM VIỆC TẠM THỜI


1. Mục đích tài liệu
Tài liệu tổng hợp toàn bộ yêu cầu và quyết định nghiệp vụ đã thống nhất cho hệ thống quản lý quy trình báo giá nội bộ. Đây là baseline cho Feature List, State Machine, Permission Matrix, Business Rules, Data Field Specification, UI Workflow, Screen Inventory, Figma Prototype và Demo Application. Tài liệu chưa phải SRS chi tiết và chưa mô tả đầy đủ API, cơ sở dữ liệu hoặc thiết kế kỹ thuật.
2. Tổng quan sản phẩm
2.1 Bối cảnh
Doanh nghiệp cần ứng dụng web nội bộ để quản lý quy trình báo giá sản phẩm thùng carton. Các bên tham gia gồm Sales, Trưởng phòng Kế hoạch, QA, R&D, Kế toán và Giám đốc. Hệ thống không trực tiếp gửi báo giá cho khách hàng; Sales giao tiếp bên ngoài hệ thống và tự cập nhật kết quả kinh doanh sau khi báo giá được phê duyệt nội bộ.
2.2 Mục tiêu nghiệp vụ
Giảm tải công việc cho Trưởng phòng Kế hoạch.
Minh bạch hóa toàn bộ quy trình xử lý báo giá.
Theo dõi thời gian xử lý tại từng phòng ban.
Cảnh báo báo giá sắp quá hạn hoặc đã quá hạn.
Lưu toàn bộ lịch sử và các phiên bản báo giá.
Theo dõi kết quả kinh doanh.
Cung cấp dữ liệu đánh giá hiệu suất xử lý.
Hỗ trợ tham khảo các báo giá tương tự trước đây.
2.3 Nguyên tắc MVP
KEEP IT STUPID SIMPLE.
Không xây workflow engine tổng quát hoặc permission editor động.
Không hỗ trợ trả lại bước trước, pause SLA hoặc yêu cầu bổ sung thông tin trong workflow.
Không dùng AI/vector search; không tự động tính giá phức tạp.
Không gửi email; không xây version engine riêng.
Không chuyển quotation giữa các Sales.
Cho phép hoàn thành task mà không bắt buộc bấm “Bắt đầu xử lý”.
3. Phạm vi MVP
3.1 Trong phạm vi
Đăng nhập và phân quyền theo role.
Dashboard vận hành và kết quả kinh doanh.
CRUD Customer và Người liên hệ.
Tạo, clone, quản lý và re-submit quotation.
Workflow theo phòng ban; SLA và Cảnh báo SLA.
Attachment theo task; lịch sử và versioning bằng Hibernate Envers.
Tìm báo giá tương tự theo quy tắc xác định.
Cập nhật kết quả Sent to Customer, Won, Lost.
Quản lý người dùng cơ bản và cấu hình SLA.
3.2 Ngoài phạm vi
Gửi báo giá/email cho khách hàng; customer portal.
Workflow trả lại bước trước hoặc bổ sung thông tin.
Chuyển quotation giữa Sales; account có nhiều business role.
Công thức tự động tính đơn giá/giá trị cuối cùng.
CRM hoặc sales pipeline hoàn chỉnh; quản lý đơn hàng.
Admin xử lý nghiệp vụ thay các phòng ban.
So sánh hai revision song song trong MVP.
4. Vai trò người dùng
Code role
Label nghiệp vụ
Trách nhiệm chính
SALES
Nhân viên Sales
Quản lý Customer liên quan; tạo, clone, re-submit quotation; cập nhật outcome.
EXECUTOR
Trưởng phòng Kế hoạch
Tiếp nhận, điều phối QA/R&D và tổng hợp báo giá.
QA
QA
Nhập kết quả đánh giá và yêu cầu chất lượng.
RND
R&D
Nhập chi phí bản in, chi phí khuôn và ngày dự kiến.
ACCOUNTING
Kế toán
Nhập dữ liệu tài chính và giá trị cuối cùng.
DIRECTOR
Giám đốc
Phê duyệt hoặc từ chối.
ADMIN
Quản trị hệ thống
Quản lý account, cấu hình và xem toàn bộ dữ liệu.

Mỗi account thuộc đúng một business role/Cognito group.
Chỉ có đúng một account EXECUTOR; không cho tạo thêm.
Admin xem toàn bộ nhưng không mặc nhiên được thao tác nghiệp vụ thay role khác.
5. Workflow tổng thể
Sales tạo Draft
  → Sales Submit
  → EXECUTOR tiếp nhận
  → QA và R&D xử lý song song
  → Chờ cả QA và R&D hoàn thành
  → EXECUTOR tổng hợp
  → Kế toán xử lý
  → Giám đốc phê duyệt hoặc từ chối
QA và R&D được tạo task đồng thời.
Chỉ chuyển sang EXECUTOR tổng hợp khi cả hai task đã COMPLETED.
MVP không cho trả về bước trước hoặc yêu cầu bổ sung thông tin.
6. Mô hình trạng thái
6.1 Workflow Status
Status code
Label UI
Ý nghĩa
DRAFT
Bản nháp
Sales chuẩn bị quotation.
EXECUTOR_INTAKE
Trưởng phòng Kế hoạch tiếp nhận
EXECUTOR kiểm tra và tiếp nhận.
QA_RND_REVIEW
QA và R&D đang xử lý
Hai task xử lý song song.
EXECUTOR_CONSOLIDATION
Trưởng phòng Kế hoạch tổng hợp
EXECUTOR tổng hợp kết quả.
ACCOUNTING_REVIEW
Kế toán đang xử lý
Kế toán nhập dữ liệu tài chính.
DIRECTOR_REVIEW
Chờ Giám đốc phê duyệt
Giám đốc xem xét.
APPROVED
Đã phê duyệt
Workflow nội bộ hoàn thành thành công.
REJECTED
Đã từ chối
Giám đốc không phê duyệt.
CANCELLED
Đã hủy
Sales hủy khi còn Draft.

6.2 Task Status
Status
Label UI
PENDING
Chờ xử lý
IN_PROGRESS
Đang xử lý
COMPLETED
Đã hoàn thành

PENDING → IN_PROGRESS → COMPLETED
hoặc
PENDING → COMPLETED
6.3 Business Outcome
Outcome code
Label UI
NOT_UPDATED
Chưa cập nhật
SENT_TO_CUSTOMER
Đã gửi khách hàng
WON
Thành công
LOST
Thất bại

6.4 Transition sau phê duyệt
APPROVED → SENT_TO_CUSTOMER
APPROVED → WON
APPROVED → LOST
SENT_TO_CUSTOMER → WON
SENT_TO_CUSTOMER → LOST
REJECTED là kết quả workflow nội bộ; LOST là kết quả kinh doanh sau khi báo giá được phê duyệt nhưng khách hàng không chấp nhận.
7. Re-submit
Chỉ áp dụng cho quotation REJECTED hoặc outcome LOST.
Không tạo quotation mới; giữ identity hiện tại.
Sales bắt buộc nhập lý do và được sửa dữ liệu đầu vào trước khi submit.
Tạo revision và workflow cycle mới, bắt đầu lại từ EXECUTOR_INTAKE.
Áp dụng SLA loại Re-submit; không ghi đè task/SLA/lịch sử cũ.
Sales không được sửa quotation khi workflow đang chạy.
8. Approve, Reject và Cancel
Hành động
Actor
Quy tắc
Phê duyệt
DIRECTOR
Ghi chú tùy chọn; chuyển tự động sang APPROVED.
Từ chối
DIRECTOR
Lý do bắt buộc; chuyển tự động sang REJECTED.
Hủy
Sales Owner
Chỉ khi DRAFT; không role nào được hủy sau khi submit.

9. SLA và Cảnh báo SLA
Công đoạn
Báo giá mới
Re-submit
EXECUTOR tiếp nhận
2 giờ
1 giờ
QA
4 giờ
2 giờ
R&D
4 giờ
2 giờ
EXECUTOR tổng hợp
4 giờ
2 giờ
Kế toán
4 giờ
2 giờ
Giám đốc
4 giờ
2 giờ

Không áp dụng SLA tổng thể 24h/12h.
Tính liên tục 24/7, gồm ngoài giờ và cuối tuần.
Bắt đầu khi task được chuyển tới phòng ban; kết thúc khi bấm Hoàn thành.
Bắt đầu xử lý không reset, pause hoặc thay đổi deadline.
Trên 50% SLA và chưa hoàn thành: màu cam; hết/vượt SLA: màu đỏ.
Mỗi workflow cycle lưu SLA cycle riêng.
9.1 Hiển thị cảnh báo
Thuật ngữ chính thức: Cảnh báo SLA, không phải Notification.
Chỉ đánh dấu mã báo giá, badge SLA, thời gian còn lại/quá hạn, nền hàng nhạt, và viền/thanh trạng thái ở trang chi tiết.
Nếu số cảnh báo bằng 0 thì không hiển thị con số trên UI.
10. Dashboard
10.1 Dashboard vận hành
Báo giá đang chờ tôi xử lý.
Báo giá gần đến hạn và quá hạn.
Báo giá mới và re-submit đang xử lý.
Thời gian xử lý trung bình theo phòng ban.
Số quotation theo workflow status.
Danh sách task ưu tiên theo SLA.
10.2 Dashboard kết quả kinh doanh
Số báo giá đã gửi khách hàng.
Số lượng/tỷ lệ Won và Lost.
Tổng giá trị báo giá Won.
Tỷ lệ re-submit và số lần re-submit trung bình.
Data scope: Sales chỉ xem dữ liệu của chính mình; EXECUTOR, QA, R&D, Kế toán, Giám đốc và Admin xem toàn bộ.
11. Customer Management
11.1 Mô hình và dữ liệu
Một entity Customer với loại Doanh nghiệp hoặc Cá nhân.
Mã số thuế và thông tin liên lạc bắt buộc cho cả hai loại.
Trường cơ bản: tên, tên viết tắt, mã số thuế, điện thoại, email, địa chỉ, tỉnh/thành phố, website, ghi chú, trạng thái hoạt động, Sales liên quan.
11.2 Người liên hệ
Doanh nghiệp bắt buộc có ít nhất một người liên hệ.
Cá nhân có thể không có người liên hệ; khi đó dùng chính thông tin cá nhân làm đầu mối liên hệ.
Trường cơ bản: họ tên, chức vụ, phòng ban, email, điện thoại, ghi chú, liên hệ chính.
11.3 Quan hệ và quyền
Customer N ↔ N Sales
Quotation N → 1 Sales Owner
Sales chỉ xem Customer có quan hệ với Sales đó.
Nhiều Sales có thể cùng xem một Customer.
Mỗi quotation chỉ thuộc một Sales Owner; Sales khác không được xem dù cùng Customer.
Không hỗ trợ chuyển quotation giữa Sales.
Tất cả role được xem/tạo/sửa trong data scope; dùng Ngừng hoạt động thay hard delete. Customer đã có quotation không được xóa vật lý.
12. Dữ liệu quotation do Sales nhập
Nhóm
Trường chính
Thông tin chung
Customer; Người liên hệ; Ghi chú; Lý do re-submit; Attachment.
Loại sản phẩm
Loại thùng.
Kích thước
Dài, rộng, cao; loại kích thước lọt lòng/phủ bì.
Vật liệu/cấu trúc
Chất liệu carton; số lớp; kiểu sóng.
Tải trọng
kg/thùng.
In ấn
Nội dung in; số màu; số mặt in.
Số lượng
Số lượng thùng, đơn vị piece.
Giao hàng
Địa điểm giao hàng; thời gian mong muốn.
Khác
Yêu cầu khác.

Một piece tương ứng một thùng carton. MVP không sử dụng quotation line item.
13. Dữ liệu và validation theo phòng ban
13.1 EXECUTOR tiếp nhận
Kiểm tra yêu cầu Sales; không có field chuyên môn bắt buộc.
Action: Bắt đầu xử lý hoặc Hoàn thành trực tiếp.
Khi hoàn thành, tạo đồng thời task QA/R&D và bắt đầu SLA của hai task.
13.2 QA
Trường
Quy tắc
Kết quả đánh giá chất lượng
Bắt buộc, mặc định trống.
Yêu cầu chất lượng
Bắt buộc, mặc định trống.
Ghi chú
Tùy chọn.
Attachment
Bắt buộc khi hoàn thành; ít nhất 1 tệp do QA upload.

QA không nhập thông tin tiền bạc.
13.3 R&D
Trường
Quy tắc
Chi phí bản in
Bắt buộc, mặc định 0 VNĐ.
Chi phí khuôn
Bắt buộc, mặc định 0 VNĐ.
Ngày đặt bản in dự kiến
Bắt buộc, mặc định ngày hiện tại.
Ngày đặt khuôn bế dự kiến
Bắt buộc, mặc định ngày hiện tại.
Ghi chú
Tùy chọn.
Attachment
Bắt buộc khi hoàn thành; ít nhất 1 tệp do R&D upload.

13.4 EXECUTOR tổng hợp
Trường
Quy tắc
Đơn giá cho 1 thùng
Bắt buộc; EXECUTOR tự tính và nhập.
Chi phí bản in
Chỉ đọc, lấy từ R&D.
Chi phí khuôn
Chỉ đọc, lấy từ R&D.
Thời gian sản xuất
Tùy chọn.
Điều kiện giao hàng
Tùy chọn.
Ghi chú tổng hợp
Tùy chọn.
Attachment
Bắt buộc khi hoàn thành; ít nhất 1 tệp do EXECUTOR upload.

Hệ thống không tự tính đơn giá. Cuối form hiển thị hai carousel: báo giá tương tự theo sản phẩm và theo khách hàng, mỗi nhóm tối đa 5 kết quả; nếu không có, hiển thị “Không có báo giá tương tự trước đây.”
13.5 Kế toán
Trường
Quy tắc
Điều kiện thanh toán
Tùy chọn.
Thuế VAT
Tùy chọn, mặc định 10%, được chỉnh sửa.
Chi phí/điều chỉnh tài chính
Tùy chọn.
Giá trị cuối cùng
Bắt buộc; Kế toán tự tính và nhập.
Ghi chú
Tùy chọn.
Attachment
Tùy chọn.

Không có công thức tự động tính giá trị cuối cùng trong MVP. Action: Bắt đầu xử lý hoặc Hoàn thành trực tiếp.
13.6 Giám đốc
Phê duyệt hoặc Từ chối.
Ghi chú phê duyệt tùy chọn.
Lý do từ chối bắt buộc.
Không nhập hoặc điều chỉnh giá trong MVP.
14. Attachment
Loại
Định dạng
Dung lượng tối đa
Hình ảnh
JPG, JPEG, PNG, WEBP
10 MB/tệp
Video
MP4, MOV, WEBM
100 MB/tệp
Tài liệu
PDF, DOC, DOCX, XLS, XLSX
20 MB/tệp

Mỗi role/task tối đa 10 tệp, không phải 10 tệp cho toàn quotation.
Attachment bắt buộc phải do chính role của task hiện tại upload.
Validation thực hiện cả frontend và backend; backend là lớp kiểm soát cuối cùng.
Lưu quotation, workflow cycle, task, role/user upload, tên, MIME type, dung lượng và thời điểm.
Label UI: Định dạng hỗ trợ: JPG, JPEG, PNG, WEBP, MP4, MOV, WEBM, PDF, DOC, DOCX, XLS, XLSX. Tối đa 10 tệp.
15. Clone quotation
Tạo quotation độc lập ở DRAFT; Sales thực hiện clone là Sales Owner.
Copy Customer, Contact và thông tin carton.
Không copy kết quả phòng ban, approval, outcome, workflow/SLA history.
Không copy attachment mặc định; Sales chọn từng tệp muốn dùng lại.
Lưu tham chiếu “Sao chép từ báo giá”.
Clone không phải revision của quotation nguồn.
16. Versioning và lịch sử
Thuộc MVP; dùng Hibernate Envers, không xây version engine riêng.
Truy xuất dữ liệu trước/sau thay đổi, người và thời điểm thay đổi, workflow cycle, status, task, SLA, approve/reject, outcome và re-submit.
Lưu toàn bộ lịch sử bất kể trạng thái hiện tại.
Sales chỉ sửa ở Draft hoặc giai đoạn chuẩn bị re-submit; revision cũ không bị ghi đè.
17. Báo giá tương tự
17.1 Theo khách hàng
Cùng customerId; loại quotation hiện tại.
Sắp xếp mới nhất trước; tối đa 5.
17.2 Theo sản phẩm
Deterministic matching theo loại thùng, kích thước, loại kích thước, chất liệu, số lớp, kiểu sóng, số màu/mặt in và số lượng.
Sắp xếp similarityScore giảm dần, sau đó ngày tạo giảm dần; tối đa 5.
Không dùng AI hoặc vector search. Trọng số/ngưỡng sai lệch được chi tiết hóa sau.
18. Quản lý người dùng
Admin xem danh sách; sửa họ tên/email/điện thoại; khóa/mở khóa; reset mật khẩu; thay account cũ bằng account mới khi nhân sự nghỉ việc.
Mỗi account có một role; EXECUTOR chỉ có một account.
Không có permission editor động.
Admin không được hoàn thành task hoặc phê duyệt thay role nghiệp vụ.
19. Authentication và Authorization
React + Amplify Auth
  → Amazon Cognito group
  → JWT + role/scope
  → API Gateway
  → Backend role + data-scope validation
Một account → một Cognito group → một business role.
Backend phải kiểm tra cả role và data scope.
Sales có role phù hợp vẫn không được truy cập quotation của Sales khác.
Admin xem toàn bộ nhưng không được gọi API nghiệp vụ thay role.
20. Kiến trúc kỹ thuật định hướng
React Application
  → CloudFront
  → API Gateway
  → Lambda API (SnapStart theo sơ đồ)
  → PostgreSQL on RDS
Hibernate Envers quản lý audit revision.
Attachment cần cơ chế lưu trữ file phù hợp, sẽ xác định trong thiết kế kỹ thuật.
21. Ma trận phạm vi dữ liệu tổng hợp
Dữ liệu
Sales
EXECUTOR/QA/R&D/Kế toán
Giám đốc
Admin
Quotation
Chỉ của mình
Toàn bộ
Toàn bộ
Toàn bộ
Customer
Có quan hệ
Toàn bộ
Toàn bộ
Toàn bộ
Người liên hệ
Theo Customer
Toàn bộ
Toàn bộ
Toàn bộ
Dashboard/Lịch sử
Dữ liệu của mình
Toàn bộ
Toàn bộ
Toàn bộ
User management
Không
Không
Không
Có

Quyền xem toàn bộ quotation không đồng nghĩa được chỉnh sửa toàn bộ dữ liệu. Mỗi role chỉ sửa phần thuộc task của role đó.
22. Yêu cầu UI chung
Toàn bộ label bằng tiếng Việt; desktop web management.
Hiển thị tách biệt Workflow Status, Task Status và Business Outcome.
Action phụ thuộc role, data scope và trạng thái.
Cảnh báo SLA rõ nhưng không tô toàn bộ màn hình.
Phân vùng rõ dữ liệu theo phòng ban; trường read-only phải rõ ràng.
Hiển thị validation attachment và danh sách định dạng trực tiếp trên UI.
Lịch sử có timeline dễ theo dõi.
Carousel báo giá tương tự chỉ ở bước EXECUTOR tổng hợp.
23. Tiêu chí thành công của MVP
Sales tạo Customer/Người liên hệ và quotation Draft.
Submit qua EXECUTOR; QA/R&D xử lý song song với validation attachment.
EXECUTOR tổng hợp, tham khảo báo giá tương tự và nhập đơn giá.
Kế toán nhập giá trị cuối cùng; Giám đốc approve/reject.
Sales cập nhật Sent/Won/Lost và re-submit Rejected/Lost.
Áp dụng đúng SLA New/Re-submit và cảnh báo cam/đỏ.
Sales không xem quotation Sales khác; phòng ban xem toàn bộ.
Truy xuất lịch sử/revision; clone tạo Draft độc lập đúng quy tắc.
24. Chi tiết còn mở nhưng không chặn thiết kế
Trọng số và ngưỡng thuật toán báo giá tương tự.
Danh mục chuẩn loại thùng, chất liệu và kiểu sóng.
Quy tắc duy nhất của mã số thuế.
Cách quản lý quan hệ Customer - nhiều Sales trên UI.
Format mã quotation và revision.
Chi tiết màn hình cấu hình SLA.
Lưu trữ, retention và preview attachment.
Phân trang, sort, export và khoảng thời gian dashboard.
Quy tắc vận hành khi Sales nghỉ việc do không hỗ trợ chuyển quotation.
