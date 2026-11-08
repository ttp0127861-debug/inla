# Business Rules Quotation Management MVP

> Converted from `Business_Rules_Quotation_Management_MVP.docx` (Word baseline). **Source of truth:** this Markdown file.
> Annex/deltas: `annex/`, `spec-deltas/`. Templates: `templates/`.
BUSINESS RULES
Hệ thống quản lý quy trình báo giá thùng carton
Phiên bản
Baseline 0.1
Ngày
13/10/2026
Phạm vi
MVP
Nội dung
Quotation, Customer, Attachment, Versioning, Clone và Re-submit
Ngôn ngữ UI
Tiếng Việt
Trạng thái
Tài liệu làm việc tạm thời


1. Mục đích và phạm vi
Tài liệu tập hợp các business rule đã chốt cho dữ liệu và hành vi nghiệp vụ của Customer, Người liên hệ, Quotation, Attachment, Versioning, Clone và Re-submit. Các rule là baseline để thiết kế form, API validation, database constraint, authorization, kiểm thử và demo.
Quy ước: MUST là quy tắc bắt buộc; SHOULD là hành vi cần có trong MVP nhưng có thể hoàn thiện sau luồng lõi; OPEN là chi tiết chưa chốt và không được tự suy diễn thành requirement chính thức.

2. Nguyên tắc nghiệp vụ chung
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
GEN-001
Hệ thống là ứng dụng nội bộ; không trực tiếp gửi báo giá hoặc email cho khách hàng.
MUST
Sales thực hiện giao tiếp bên ngoài.
GEN-002
Toàn bộ label hiển thị cho người dùng phải bằng tiếng Việt.
MUST
Code/status có thể dùng tiếng Anh.
GEN-003
Backend là nguồn quyết định cuối cho quyền, validation và transition.
MUST
Không chỉ dựa vào UI.
GEN-004
Mọi thay đổi nghiệp vụ quan trọng phải lưu actor, role, timestamp và dữ liệu liên quan.
MUST
Phục vụ audit/history.
GEN-005
Tiền tệ duy nhất trong MVP là VNĐ.
MUST
Không hỗ trợ đa tiền tệ.
GEN-006
MVP ưu tiên workflow và quy tắc đơn giản; không tự động hóa công thức giá phức tạp.
MUST
KEEP IT STUPID SIMPLE.

3. Customer Business Rules
3.1 Mô hình Customer
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
CUS-001
Customer sử dụng một entity chung với hai loại: Doanh nghiệp và Cá nhân.
MUST
Không tạo hai module riêng.
CUS-002
Loại Customer là bắt buộc khi tạo mới.
MUST
Điều khiển field/contact rule.
CUS-003
Tên Customer hoặc tên doanh nghiệp là bắt buộc.
MUST
Không cho giá trị chỉ có khoảng trắng.
CUS-004
Mã số thuế bắt buộc cho cả Doanh nghiệp và Cá nhân.
MUST
Quy tắc uniqueness còn OPEN.
CUS-005
Thông tin liên lạc tối thiểu là bắt buộc.
MUST
Field chi tiết theo Data Field Specification.
CUS-006
Customer có trạng thái Hoạt động hoặc Ngừng hoạt động.
MUST
Không dùng hard delete cho dữ liệu đã sử dụng.
CUS-007
Customer Ngừng hoạt động không được chọn cho quotation mới.
MUST
Vẫn xem được lịch sử.
CUS-008
Một Customer có thể liên quan đến nhiều Sales và một Sales có thể liên quan nhiều Customer.
MUST
Quan hệ N-N.
CUS-009
Sales chỉ xem Customer có quan hệ với account Sales đó.
MUST
Role khác xem toàn bộ.
CUS-010
Quyền xem Customer không cho phép xem quotation của Sales khác.
MUST
Customer scope và quotation scope độc lập.

3.2 Người liên hệ
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
CON-001
Customer Doanh nghiệp phải có ít nhất một Người liên hệ.
MUST
Validation trước khi sử dụng cho quotation.
CON-002
Người liên hệ của Customer Cá nhân là tùy chọn.
MUST
Có thể không tạo contact riêng.
CON-003
Nếu Customer Cá nhân không có Người liên hệ, hệ thống dùng thông tin chính Customer làm đầu mối liên hệ.
MUST
Không tạo record giả nếu không cần.
CON-004
Người liên hệ phải thuộc đúng một Customer.
MUST
Không dùng chung contact giữa Customer.
CON-005
Có thể đánh dấu một Người liên hệ là liên hệ chính.
MUST
Cardinality liên hệ chính cần enforce trong service.
CON-006
Người liên hệ ngừng hoạt động không được chọn cho quotation mới.
SHOULD
Vẫn giữ trong quotation/history cũ.

3.3 CRUD, deactivate và delete
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
CUS-011
Tất cả business role được xem, tạo và sửa Customer trong data scope.
MUST
Mọi thay đổi phải audit.
CUS-012
Customer đã liên kết ít nhất một quotation không được xóa vật lý.
MUST
Chỉ cho Ngừng hoạt động.
CUS-013
Customer chưa từng được sử dụng có thể được xóa sau cảnh báo xác nhận.
SHOULD
Backend kiểm tra lại reference.
CUS-014
Ngừng hoạt động không xóa Người liên hệ, quan hệ Sales hoặc quotation history.
MUST
Chỉ thay status.
CUS-015
Không cho deactivate Customer nếu đang có Draft quotation mới cần xử lý mà UX chưa giải quyết.
OPEN
Cần chốt khi làm SRS chi tiết.
CUS-016
Việc thêm/xóa quan hệ Customer–Sales phải nằm trong data scope và được audit.
MUST
Actor UI cụ thể còn OPEN.

4. Quotation Business Rules
4.1 Identity, ownership và access
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
QUO-001
Mỗi quotation có một identity ổn định qua nhiều workflow cycle và revision.
MUST
Re-submit không tạo quotation mới.
QUO-002
Mỗi quotation có đúng một Sales Owner.
MUST
Quan hệ N quotation - 1 Sales.
QUO-003
Sales tạo quotation tự động trở thành Sales Owner.
MUST
Không cho client tự chọn owner khác.
QUO-004
Chỉ Sales Owner được xem và thao tác quotation của Sales.
MUST
Sales khác không được xem dù cùng Customer.
QUO-005
EXECUTOR, QA, R&D, Kế toán, Giám đốc và Admin được xem toàn bộ quotation.
MUST
Admin chỉ đọc nghiệp vụ.
QUO-006
Không có chức năng chuyển quotation từ Sales A sang Sales B.
MUST
Không được tự bổ sung.
QUO-007
Admin không được đổi Sales Owner trên ứng dụng.
MUST
Trường hợp nghỉ việc là vận hành OPEN.

4.2 Dữ liệu đầu vào carton
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
QUO-008
Quotation không sử dụng line item sản phẩm/dịch vụ trong MVP.
MUST
Một form yêu cầu thùng carton.
QUO-009
Thông tin carton gồm tối thiểu loại thùng, kích thước D/R/C, loại kích thước, chất liệu, số lớp, kiểu sóng, tải trọng, in ấn, số lượng, giao hàng, thời gian mong muốn và yêu cầu khác.
MUST
Field-level rule ở tài liệu riêng.
QUO-010
Đơn vị kích thước là mm.
MUST
Hiển thị label rõ.
QUO-011
Đơn vị tải trọng là kg/thùng.
MUST
Một thùng là một piece.
QUO-012
Số lượng quotation là số lượng piece/thùng.
MUST
Không phải line-item quantity.
QUO-013
Loại kích thước phải xác định Lọt lòng hoặc Phủ bì.
MUST
Danh mục UI.
QUO-014
Attachment của Sales là tùy chọn.
MUST
Tối đa 10 tệp trong phần Sales.
QUO-015
System không tự tính đơn giá hoặc giá trị cuối cùng.
MUST
Người dùng tự tính và nhập.

4.3 Draft, Submit và Cancel
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
QUO-016
Quotation mới được tạo ở DRAFT.
MUST
Chỉ Sales Owner sửa.
QUO-017
Lưu nháp không yêu cầu toàn bộ field bắt buộc phải hoàn chỉnh.
MUST
Validation đầy đủ khi Submit.
QUO-018
Submit chỉ hợp lệ khi field bắt buộc, Customer và Contact rule đều hợp lệ.
MUST
Frontend + backend.
QUO-019
Submit lần đầu tạo workflow cycle loại NEW.
MUST
Tạo task EXECUTOR_INTAKE.
QUO-020
Sau Submit, dữ liệu đầu vào Sales bị khóa trong cycle đang chạy.
MUST
Chỉ read-only.
QUO-021
Sales chỉ được Cancel khi quotation/current cycle còn DRAFT.
MUST
Sau Submit không role nào Cancel.
QUO-022
CANCELLED là trạng thái kết thúc và không được re-submit trong MVP.
MUST
Không có transition khác.

4.4 Dữ liệu từng phòng ban
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
QUO-023
QA nhập Kết quả đánh giá chất lượng và Yêu cầu chất lượng; cả hai bắt buộc.
MUST
Ghi chú tùy chọn.
QUO-024
QA không nhập bất kỳ chi phí/giá trị tiền nào.
MUST
Không hiển thị field tiền.
QUO-025
R&D nhập Chi phí bản in và Chi phí khuôn; bắt buộc, mặc định 0 VNĐ, cho phép 0.
MUST
Giá trị không âm.
QUO-026
R&D nhập ngày đặt bản in và ngày đặt khuôn bế dự kiến; bắt buộc, mặc định ngày hiện tại.
MUST
Ghi chú tùy chọn.
QUO-027
EXECUTOR tổng hợp nhập Đơn giá cho 1 thùng; bắt buộc.
MUST
Người dùng tự tính.
QUO-028
EXECUTOR chỉ xem Chi phí bản in/khuôn do R&D cung cấp; không được sửa.
MUST
Field read-only.
QUO-029
Thời gian sản xuất, Điều kiện giao hàng và Ghi chú tổng hợp là tùy chọn.
MUST
EXECUTOR input.
QUO-030
Kế toán nhập Giá trị cuối cùng; bắt buộc và tự tính ngoài hệ thống.
MUST
Không áp công thức tự động.
QUO-031
VAT mặc định 10%, là tùy chọn và Kế toán được chỉnh sửa.
MUST
Giá trị lưu theo field numeric.
QUO-032
Điều kiện thanh toán, điều chỉnh tài chính, ghi chú và attachment Kế toán là tùy chọn.
MUST
Không ngăn Complete trừ giá trị cuối cùng.
QUO-033
Giám đốc chỉ Approve hoặc Reject; không điều chỉnh giá trong MVP.
MUST
Reject cần lý do.

4.5 Outcome
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
OUT-001
Business Outcome chỉ được cập nhật sau khi workflow nội bộ APPROVED.
MUST
Chỉ Sales Owner.
OUT-002
Outcome mặc định sau APPROVED là NOT_UPDATED.
MUST
Label: Chưa cập nhật.
OUT-003
Sales có thể cập nhật NOT_UPDATED thành SENT_TO_CUSTOMER, WON hoặc LOST.
MUST
Cho phép đi tắt Won/Lost.
OUT-004
SENT_TO_CUSTOMER chỉ chuyển tiếp thành WON hoặc LOST.
MUST
Không quay lại NOT_UPDATED.
OUT-005
WON và LOST là outcome kết thúc trong cycle hiện tại.
MUST
LOST cho phép re-submit.
OUT-006
REJECTED không phải LOST.
MUST
Rejected nội bộ; Lost bên ngoài.
OUT-007
MVP không cho đổi ngược WON sang LOST hoặc LOST sang WON.
MUST
Sửa sai cần yêu cầu mới có audit.

5. Attachment Business Rules
5.1 Định dạng, dung lượng và số lượng
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
ATT-001
Mỗi role/task được upload tối đa 10 tệp.
MUST
Không tính tổng 10 cho toàn quotation.
ATT-002
Ảnh hỗ trợ JPG, JPEG, PNG, WEBP; tối đa 10 MB/tệp.
MUST
Extension + MIME validation.
ATT-003
Video hỗ trợ MP4, MOV, WEBM; tối đa 100 MB/tệp.
MUST
Extension + MIME validation.
ATT-004
Tài liệu hỗ trợ PDF, DOC, DOCX, XLS, XLSX; tối đa 20 MB/tệp.
MUST
Extension + MIME validation.
ATT-005
UI phải hiển thị rõ extension, dung lượng và giới hạn 10 tệp.
MUST
Label tiếng Việt.
ATT-006
File không hợp lệ phải bị từ chối trước khi gắn với task.
MUST
Backend kiểm tra cuối.

5.2 Ownership và validation
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
ATT-007
Mỗi attachment phải gắn quotation, workflow cycle, task/section, role, user và thời điểm upload.
MUST
Metadata audit.
ATT-008
Attachment của role/task trước không thỏa validation bắt buộc của role/task hiện tại.
MUST
Ownership theo task.
ATT-009
QA phải có ít nhất một tệp do chính QA upload trước Complete.
MUST
Frontend + backend.
ATT-010
R&D phải có ít nhất một tệp do chính R&D upload trước Complete.
MUST
Frontend + backend.
ATT-011
EXECUTOR tổng hợp phải có ít nhất một tệp do chính EXECUTOR upload trong task tổng hợp.
MUST
File intake không được tính.
ATT-012
Sales, EXECUTOR intake, Kế toán và Giám đốc không có attachment bắt buộc trong baseline.
MUST
Giám đốc không upload MVP.
ATT-013
Người upload chỉ được xóa file của mình khi Draft/task còn mở.
SHOULD
Sau Complete chuyển read-only.
ATT-014
Attachment của task đã Complete không được sửa/xóa qua nghiệp vụ thông thường.
MUST
Giữ lịch sử.
ATT-015
Quyền xem/download attachment theo quotation data scope.
MUST
Sales Owner hoặc role xem toàn bộ.

5.3 Label UI chuẩn
Định dạng hỗ trợ: JPG, JPEG, PNG, WEBP, MP4, MOV, WEBM, PDF, DOC, DOCX, XLS, XLSX. Tối đa 10 tệp. Ảnh tối đa 10 MB/tệp; video tối đa 100 MB/tệp; tài liệu tối đa 20 MB/tệp.

6. Versioning & Audit Business Rules
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
VER-001
Versioning thuộc phạm vi MVP.
MUST
Không trì hoãn sang phase sau.
VER-002
Hibernate Envers được dùng để quản lý entity revision.
MUST
Không xây version engine riêng.
VER-003
Backend cung cấp API truy xuất historical data trên Envers.
MUST
Theo data scope.
VER-004
Dữ liệu revision cũ không được ghi đè hoặc sửa qua UI.
MUST
Chỉ đọc.
VER-005
Sales sửa Draft có thể tạo nhiều Envers revision theo transaction; không cần business version thủ công cho từng lần lưu.
MUST
Keep simple.
VER-006
Submit/Re-submit phải tạo mốc lịch sử nhận diện được.
MUST
Liên kết workflow cycle.
VER-007
Task, SLA, approval, outcome và attachment history phải truy vấn được theo cycle.
MUST
Không chỉ dựa vào entity diff.
VER-008
Lịch sử phải lưu actor, role, timestamp và nội dung thay đổi/sự kiện.
MUST
Audit đầy đủ.
VER-009
UI cho phép xem revision ở chế độ read-only.
SHOULD
Không yêu cầu compare side-by-side.
VER-010
UI so sánh hai revision song song không thuộc MVP.
MUST
Ngoài phạm vi.
VER-011
Lịch sử được giữ bất kể quotation APPROVED, REJECTED, LOST, WON, CANCELLED hay re-submit.
MUST
Không xóa theo trạng thái.

6.1 Phân biệt revision và workflow cycle
Khái niệm
Ý nghĩa
Ví dụ
Envers Revision
Snapshot/audit của thay đổi entity theo transaction.
Sales lưu Draft, QA nhập nội dung, outcome thay đổi.
Workflow Cycle
Một lần chạy quy trình nội bộ NEW hoặc RE_SUBMIT.
Cycle 1 bị Rejected; Cycle 2 là Re-submit.
Task/SLA Event
Sự kiện vận hành trong một cycle.
QA started/completed; SLA overdue.
Clone Link
Quan hệ giữa hai quotation độc lập.
Quotation B sao chép từ Quotation A.

Không dùng “version” để thay thế “workflow cycle”. Một cycle có thể chứa nhiều Envers revision; một quotation có thể có nhiều cycle.

7. Clone Quotation Business Rules
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
CLN-001
Clone tạo một quotation mới độc lập ở trạng thái DRAFT.
MUST
Không phải revision hay re-submit.
CLN-002
Sales thực hiện clone trở thành Sales Owner của quotation mới.
MUST
Source phải trong data scope.
CLN-003
Clone copy Customer và Người liên hệ từ quotation nguồn.
MUST
Chỉ khi dữ liệu vẫn hợp lệ/được xem.
CLN-004
Clone copy toàn bộ thông tin yêu cầu carton của Sales.
MUST
Cho phép chỉnh ở Draft mới.
CLN-005
Clone không copy kết quả QA, R&D, EXECUTOR, Kế toán hoặc Giám đốc.
MUST
Không copy workflow output.
CLN-006
Clone không copy task, SLA, history, approval/rejection hoặc Business Outcome.
MUST
Quotation mới sạch.
CLN-007
Clone không copy attachment mặc định.
MUST
Sales chọn từng file muốn dùng lại.
CLN-008
File được Sales chọn khi clone trở thành attachment mới trong phần Sales của quotation đích.
MUST
Lưu source reference nếu cần audit.
CLN-009
Quotation đích lưu tham chiếu “Sao chép từ báo giá”.
MUST
Source quotation ID.
CLN-010
Clone không làm thay đổi quotation nguồn.
MUST
Không ghi event workflow nguồn ngoài audit truy cập nếu có.
CLN-011
Không cho clone quotation ngoài data scope của Sales.
MUST
Sales không thấy source của Sales khác.

7.1 Bảng dữ liệu copy khi Clone
Nhóm dữ liệu
Copy
Quy tắc
Customer
Có
Giữ reference nếu Customer còn hợp lệ.
Người liên hệ
Có
Giữ reference nếu contact còn hợp lệ.
Thông tin carton
Có
Sales được sửa trong Draft mới.
Ghi chú Sales
Có, nếu thuộc dữ liệu đầu vào
Không copy ghi chú phòng ban.
Attachment Sales
Tùy chọn
Không copy mặc định; chọn từng file.
Kết quả QA/R&D
Không
Luôn trống.
Đơn giá EXECUTOR
Không
Luôn trống.
Dữ liệu Kế toán
Không
VAT dùng default mới khi tới task.
Approval/Reject
Không
Không có workflow cycle.
Outcome
Không
NOT_UPDATED khi phù hợp sau approve.
History/SLA/Task
Không
Quotation mới độc lập.

8. Re-submit Business Rules
8.1 Điều kiện
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
RES-001
Chỉ Sales Owner được khởi tạo re-submit.
MUST
Data ownership.
RES-002
Re-submit chỉ hợp lệ khi workflow REJECTED hoặc Business Outcome LOST.
MUST
Không từ trạng thái khác.
RES-003
Quotation APPROVED nhưng NOT_UPDATED, SENT_TO_CUSTOMER hoặc WON không được re-submit.
MUST
Chặn backend.
RES-004
Quotation CANCELLED không được re-submit.
MUST
Ngoài scope.
RES-005
Re-submit reason là bắt buộc.
MUST
Không để trống.

8.2 Hành vi và dữ liệu
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
RES-006
Re-submit giữ nguyên quotation identity.
MUST
Không tạo quotation mới.
RES-007
Re-submit tạo workflow cycle mới loại RE_SUBMIT.
MUST
Cycle trước giữ nguyên.
RES-008
Cycle mới bắt đầu ở DRAFT để Sales chỉnh dữ liệu trước Submit.
MUST
Sau Submit chuyển EXECUTOR_INTAKE.
RES-009
Sales được chỉnh dữ liệu đầu vào trong Re-submit Draft.
MUST
Khóa lại sau Submit.
RES-010
Re-submit chạy lại toàn bộ workflow từ EXECUTOR intake đến Giám đốc.
MUST
Không bỏ qua bước.
RES-011
Re-submit áp dụng SLA riêng: 1h intake và 2h cho các công đoạn còn lại theo baseline.
MUST
Theo SLA config snapshot.
RES-012
Không kế thừa task status hoặc completion của cycle cũ.
MUST
Tạo task mới.
RES-013
Không ghi đè SLA cycle hoặc workflow history cũ.
MUST
Lịch sử theo cycle.
RES-014
Dữ liệu nghiệp vụ cũ được dùng làm nền để Sales chỉnh, nhưng kết quả phòng ban phải được nhập lại trong cycle mới.
MUST
Không copy output task.
RES-015
Sau Submit re-submit, Sales không được sửa cho đến khi cycle kết thúc.
MUST
Giống New flow.
RES-016
Nếu re-submit được APPROVED, Business Outcome của cycle mới bắt đầu ở NOT_UPDATED.
MUST
Outcome cycle cũ vẫn trong history.

8.3 Phân biệt Clone và Re-submit
Tiêu chí
Clone
Re-submit
Quotation identity
Tạo quotation mới.
Giữ quotation hiện tại.
Điều kiện
Source thuộc data scope.
Chỉ REJECTED hoặc LOST.
Mục đích
Tạo yêu cầu tương tự độc lập.
Chạy lại cùng báo giá sau thất bại/từ chối.
Customer/Carton input
Copy sang Draft mới.
Dùng dữ liệu hiện tại và cho Sales chỉnh.
Workflow cycle
Chưa có cho tới Submit New.
Tạo cycle RE_SUBMIT.
History
Không copy; chỉ lưu source link.
Giữ toàn bộ cycle/revision cũ cùng quotation.
SLA
New khi submit.
Re-submit khi submit.
Outcome cũ
Không copy.
Giữ trong history cycle cũ.

9. Business Rules liên quan báo giá tương tự
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
SIM-001
Chức năng chỉ hiển thị tại bước EXECUTOR tổng hợp.
MUST
Cuối form.
SIM-002
Có hai nhóm độc lập: cùng Customer và cùng thông tin sản phẩm.
MUST
Mỗi nhóm tối đa 5.
SIM-003
Nhóm cùng Customer dùng cùng customerId, bỏ quotation hiện tại, ưu tiên mới nhất.
MUST
Deterministic.
SIM-004
Nhóm cùng sản phẩm chấm điểm theo loại thùng, D/R/C, loại kích thước, chất liệu, số lớp, kiểu sóng, số màu/mặt in và số lượng.
MUST
Không AI/vector.
SIM-005
Sắp xếp theo similarityScore giảm dần rồi ngày tạo giảm dần.
MUST
Trọng số/ngưỡng OPEN.
SIM-006
Không có kết quả thì hiển thị “Không có báo giá tương tự trước đây.” cho từng nhóm.
MUST
Empty state riêng.
SIM-007
EXECUTOR có quyền xem toàn bộ quotation nên matching được chạy trên tập dữ liệu toàn bộ.
MUST
Vẫn loại dữ liệu bị xóa logic nếu không phù hợp.

10. Immutability, Deletion và Retention Rules
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
DEL-001
Quotation không có chức năng hard delete trong MVP.
MUST
Draft dùng Cancel.
DEL-002
Workflow cycle, task, SLA event, approval và outcome history không được xóa qua UI.
MUST
Audit data.
DEL-003
Customer đã dùng không hard delete; chỉ Ngừng hoạt động.
MUST
Bảo toàn reference.
DEL-004
Attachment trong task đã Complete không xóa nghiệp vụ.
MUST
Retention vật lý còn OPEN.
DEL-005
Clone source reference và re-submit cycle link không được thay đổi sau tạo.
MUST
Bảo toàn traceability.
DEL-006
Chính sách retention file và audit data chưa được chốt.
OPEN
Không tự đặt thời gian xóa.

11. Validation và Error Handling Rules
Rule ID
Quy tắc
Mức độ
Ghi chú/Validation
VAL-001
Frontend validate sớm để hỗ trợ người dùng; backend lặp lại toàn bộ validation.
MUST
Không tin frontend.
VAL-002
Lỗi phải trả message tiếng Việt rõ field/action.
MUST
Không lộ thông tin nhạy cảm.
VAL-003
Action lặp hoặc stale state phải bị chặn bằng state check/optimistic locking.
MUST
Tránh double submit/complete.
VAL-004
Upload kiểm tra cả extension, MIME type, size và count.
MUST
Backend cuối.
VAL-005
Mọi action theo Owner hoặc role phải lấy identity từ JWT, không lấy từ payload client.
MUST
Authorization.
VAL-006
Trường tiền chấp nhận 0 khi rule cho phép; không chấp nhận số âm.
MUST
R&D cost có thể 0.
VAL-007
Text bắt buộc không được chỉ chứa whitespace.
MUST
Trim trước validation.
VAL-008
Ngày mặc định hôm nay vẫn phải được gửi/lưu rõ, không chỉ hiển thị placeholder.
MUST
R&D dates.

12. Rule Traceability theo module
Nhóm Rule
Module liên quan
Ứng dụng chính
GEN-*
Toàn hệ thống
Kiến trúc, audit, localization.
CUS-*/CON-*
Customer Management
CRUD, data scope, contact validation.
QUO-*
Quotation Management/Workflow
Form, ownership, dữ liệu phòng ban.
OUT-*
Outcome
Sales actions sau APPROVED.
ATT-*
Attachment
Uploader, storage metadata, complete validation.
VER-*
History & Versioning
Envers API, timeline, read-only revision.
CLN-*
Clone
Tạo Draft độc lập và chọn attachment.
RES-*
Re-submit
Cycle mới, SLA mới, giữ identity/history.
SIM-*
Similar Quotations
Carousel và deterministic matching.
DEL-*
Data lifecycle
Không hard delete và bảo toàn lịch sử.
VAL-*
Frontend/Backend
Validation, security, concurrency.

13. Kịch bản kiểm thử Business Rules tối thiểu
ID
Kịch bản
Kết quả mong đợi
BR-T01
Sales A/B cùng Customer X
Cả hai xem Customer; mỗi Sales chỉ xem quotation của mình.
BR-T02
Doanh nghiệp không có contact
Không được dùng để Submit quotation.
BR-T03
Cá nhân không có contact
Dùng thông tin Customer làm đầu mối.
BR-T04
Xóa Customer đã có quotation
Bị chặn; cho Ngừng hoạt động.
BR-T05
Lưu Draft thiếu field
Được phép; Submit bị chặn.
BR-T06
QA Complete với file Sales
Bị chặn; cần file do QA upload.
BR-T07
R&D nhập chi phí 0
Được phép nếu các field và attachment khác hợp lệ.
BR-T08
EXECUTOR sửa chi phí R&D
Bị chặn/read-only.
BR-T09
Kế toán Complete thiếu giá trị cuối cùng
Bị chặn.
BR-T10
Clone quotation
Tạo Draft mới, không copy output/history/outcome.
BR-T11
Clone chọn 2 attachment
Chỉ 2 file được tạo ở phần Sales của quotation đích.
BR-T12
Re-submit từ Rejected
Giữ quotation ID, tạo cycle RE_SUBMIT và lý do bắt buộc.
BR-T13
Re-submit từ Won
Bị chặn.
BR-T14
Xem revision cũ
Read-only; không sửa được.
BR-T15
Upload file vượt size/sai MIME
Bị chặn ở backend.
BR-T16
Customer ngừng hoạt động trong lịch sử
Vẫn xem được; không chọn cho quotation mới.

14. Open Details không được tự suy diễn
Open ID
Nội dung
Ảnh hưởng
OPEN-01
Mã số thuế có bắt buộc unique toàn hệ thống hay theo loại Customer.
Database constraint/customer validation.
OPEN-02
Actor và UX chính xác để thêm/xóa quan hệ Customer–Sales.
Customer permission/UI.
OPEN-03
Danh mục chuẩn loại thùng, chất liệu, số lớp, kiểu sóng.
Form component/master data.
OPEN-04
Trọng số và ngưỡng similarity.
Similar quotation algorithm.
OPEN-05
Format mã quotation, workflow cycle và revision.
UI/API identifiers.
OPEN-06
Retention/preview/storage vật lý của attachment.
Technical design.
OPEN-07
Xử lý Sales nghỉ việc khi không cho chuyển quotation.
Operational procedure.
OPEN-08
Có chặn deactivate Customer khi còn Draft quotation hay không.
Customer lifecycle.
OPEN-09
Cho phép sửa outcome sai bằng quy trình nào sau MVP.
Outcome audit.

15. Baseline Summary
Customer dùng chung một entity, có hai loại, quan hệ nhiều-nhiều với Sales; quotation vẫn thuộc đúng một Sales Owner.
Quotation không có line item; dữ liệu chuyên biệt cho thùng carton; giá được nhập thủ công.
Attachment được quản lý theo role/task, giới hạn và validation riêng; file task trước không thỏa task hiện tại.
Versioning dùng Hibernate Envers và API history; workflow cycle/task/SLA history vẫn phải truy vấn nghiệp vụ được.
Clone tạo quotation mới độc lập; Re-submit giữ quotation identity và tạo cycle mới.
Re-submit chỉ từ REJECTED hoặc LOST, có lý do bắt buộc và chạy lại toàn bộ workflow với SLA riêng.
