# Open Questions Assumptions Quotation Management MVP

> Converted from `Open_Questions_Assumptions_Quotation_Management_MVP.docx` (Word baseline). **Source of truth:** this Markdown file.
> Annex/deltas: `annex/`, `spec-deltas/`. Templates: `templates/`.
OPEN QUESTIONS & ASSUMPTIONS
Hệ thống quản lý quy trình báo giá thùng carton
Phiên bản
Baseline 0.1
Ngày
13/10/2026
Phạm vi
MVP
Nội dung
Chi tiết nhỏ chưa chốt, không cản trở tiến độ hiện tại
Ngôn ngữ
Tiếng Việt
Trạng thái
Tài liệu làm việc tạm thời


1. Mục đích và nguyên tắc quản lý
Tài liệu tập trung các chi tiết chưa được khách hàng xác nhận hoàn toàn và các giả định tạm thời đang được sử dụng để tiếp tục thiết kế. Không mục nào trong danh sách hiện tại làm thay đổi workflow cốt lõi, ownership quotation, data scope chính, SLA baseline hoặc phạm vi MVP đã chốt.
Open Question không phải requirement. Assumption chỉ là giả định làm việc có kiểm soát. Khi có quyết định chính thức, phải cập nhật tài liệu nguồn liên quan và đóng mục tương ứng, không âm thầm biến giả định thành business rule.

Phân loại
Ý nghĩa
Cách xử lý
Open Question
Chi tiết cần stakeholder quyết định.
Ghi rõ ảnh hưởng và thời điểm cần chốt.
Assumption
Giả định tạm để tiếp tục thiết kế/phát triển.
Phải có cơ sở, rủi ro và cách kiểm chứng.
Deferred Decision
Quyết định có thể trì hoãn mà không cản luồng lõi.
Chốt trước module/sprint liên quan.
Out of Scope Candidate
Ý tưởng chưa thuộc MVP.
Không đưa vào backlog MVP nếu chưa có change request.

2. Tổng quan
Nhóm
Số mục
Mức độ ảnh hưởng hiện tại
Customer & Contact
10
Thấp đến trung bình; không cản CRUD cơ bản.
Quotation & Data Field
9
Thấp; cần chốt trước UI/API chi tiết.
Similar Quotation
4
Thấp; deterministic baseline đã đủ.
Attachment
6
Thấp đến trung bình; cần trước technical design hoàn chỉnh.
SLA & Alert
8
Thấp; SLA baseline đã chốt.
UI/Navigation
10
Thấp; ảnh hưởng Figma/layout, không ảnh hưởng nghiệp vụ.
User & Operations
5
Trung bình về vận hành, không cản demo.
Reporting
6
Thấp; có thể chốt sau luồng lõi.
Technical/Integration
8
Thấp đến trung bình; cần trước production-ready.
Assumptions đang dùng
18
Có kiểm soát; cần xác nhận dần.

3. Open Questions - Customer & Contact
ID
Câu hỏi/Chi tiết chưa chốt
Trạng thái tạm thời
Ảnh hưởng
Chủ sở hữu đề xuất
Thời điểm cần chốt
OQ-CUS-01
Mã số thuế có bắt buộc duy nhất toàn hệ thống hay chỉ cảnh báo trùng?
Không tạo unique constraint cứng; hiển thị khả năng trùng nếu triển khai.
Database, validation.
Business Owner/BA
Trước DB schema final.
OQ-CUS-02
Ai được thêm hoặc gỡ Sales liên quan trên Customer đã tồn tại?
Giữ quyền CRUD Customer rộng; action relation chưa expose rộng cho tới khi chốt.
Permission/UI.
Business Owner
Trước CUS-07.
OQ-CUS-03
Khi gỡ Sales relation, Sales có tiếp tục xem Customer vì vẫn sở hữu quotation cũ không?
Quotation vẫn xem theo Owner; Customer list theo relation hiện tại.
Data scope edge case.
Business Owner/BA
Trước API scope final.
OQ-CUS-04
Có cho đổi loại Customer Doanh nghiệp/Cá nhân sau khi đã có quotation?
Không khuyến khích; UI có thể khóa sau khi đã dùng.
Data integrity.
Business Owner
Trước Edit Customer.
OQ-CUS-05
Có chặn Ngừng hoạt động Customer đang có Draft quotation?
Cho phép deactivate; Draft hiện có cần cảnh báo khi Submit.
Lifecycle UX.
BA/Product
Trước validation final.
OQ-CUS-06
Doanh nghiệp có bắt buộc tạo Contact trong cùng transaction Create Customer?
Cho lưu Customer trước; chặn Submit quotation nếu chưa có Contact hoạt động.
Create flow.
Business Owner
Trước Figma form.
OQ-CUS-07
Sales có được thấy tên các Sales khác cùng liên quan Customer không?
Có thể chỉ hiển thị số lượng hoặc chính Sales hiện tại cho tới khi chốt.
Privacy/UI.
Business Owner
Trước CUS-07.
OQ-CUS-08
Danh mục tỉnh/thành dùng master data nào?
Dùng select/text tạm trong prototype.
Master data.
BA/Tech Lead
Trước implementation final.
OQ-CUS-09
Quy tắc format cho số điện thoại và mã số thuế là gì?
Validation định dạng cơ bản, không đặt pattern nghiệp vụ cứng.
Validation.
Business Owner
Trước API validation.
OQ-CUS-10
Có cần chức năng merge Customer trùng lặp?
Ngoài MVP.
Scope.
Product Owner
Sau MVP nếu cần.

4. Open Questions - Quotation & Data Fields
ID
Câu hỏi/Chi tiết chưa chốt
Trạng thái tạm thời
Ảnh hưởng
Chủ sở hữu đề xuất
Thời điểm cần chốt
OQ-QUO-01
Format mã quotation là gì?
Dùng mã hệ thống tạm, duy nhất và dễ đọc.
UI/API identifier.
Business Owner/Tech Lead
Trước production data.
OQ-QUO-02
Format hiển thị workflow cycle và revision?
Cycle #1, #2; revision dùng ID/timestamp tạm.
History UI.
BA/UX
Trước History Figma.
OQ-QUO-03
Danh mục chuẩn cho Loại thùng?
Select có danh mục mẫu hoặc text/select hybrid.
Sales form/master data.
Business Owner
Trước form final.
OQ-QUO-04
Danh mục Chất liệu, Số lớp và Kiểu sóng?
Dùng dữ liệu mẫu; không hard-code danh mục chưa xác nhận.
Form/master data.
Business Owner
Trước implementation final.
OQ-QUO-05
Thời gian mong muốn dùng Date, Month Picker hay Text có cấu trúc?
Prototype dùng field linh hoạt; ưu tiên month/date nếu đủ ngữ cảnh.
UI/API type.
BA/UX
Trước API contract.
OQ-QUO-06
Thời gian sản xuất của EXECUTOR là số ngày hay mô tả text?
Dùng text/duration linh hoạt tạm thời.
Data type.
Business Owner
Trước DB field final.
OQ-QUO-07
Chi phí hoặc điều chỉnh tài chính là số tiền hay mô tả?
Dùng field linh hoạt; không tham gia công thức tự động.
Accounting form.
Kế toán/BA
Trước Accounting Figma.
OQ-QUO-08
Giới hạn ký tự cho text/textarea?
Dùng giới hạn kỹ thuật hợp lý, chưa coi là business rule.
Validation/storage.
Tech Lead/BA
Trước API final.
OQ-QUO-09
Có quy trình sửa Business Outcome nhập sai sau WON/LOST không?
Không cho sửa ngược trong MVP.
Operations/audit.
Business Owner
Sau MVP hoặc change request.

5. Open Questions - Báo giá tương tự
ID
Câu hỏi/Chi tiết chưa chốt
Trạng thái tạm thời
Ảnh hưởng
Chủ sở hữu đề xuất
Thời điểm cần chốt
OQ-SIM-01
Trọng số từng tiêu chí sản phẩm là bao nhiêu?
Dùng trọng số đơn giản, giải thích được trong prototype.
Kết quả ranking.
Business Owner/BA
Trước algorithm final.
OQ-SIM-02
Ngưỡng sai lệch D/R/C được coi là tương tự?
Dùng tolerance cấu hình kỹ thuật tạm; không công bố business rule.
Matching quality.
Business Owner/R&D
Trước UAT.
OQ-SIM-03
Có ngưỡng similarity tối thiểu để loại kết quả không?
Chỉ hiển thị kết quả đủ điều kiện theo implementation tạm; tối đa 5.
Empty/result behavior.
BA/Tech Lead
Trước UAT.
OQ-SIM-04
Card carousel cần hiển thị trường nào?
Mã, Customer, kích thước, loại thùng, đơn giá, ngày tạo là đề xuất.
Figma detail.
UX/BA
Trước Figma final.

6. Open Questions - Attachment
ID
Câu hỏi/Chi tiết chưa chốt
Trạng thái tạm thời
Ảnh hưởng
Chủ sở hữu đề xuất
Thời điểm cần chốt
OQ-ATT-01
Cơ chế lưu trữ file vật lý sử dụng dịch vụ nào?
Thiết kế abstraction; S3 là hướng phù hợp nhưng chưa ghi thành business requirement.
Technical architecture.
Architect/Tech Lead
Trước implementation upload.
OQ-ATT-02
Có preview trực tiếp PDF/ảnh/video/DOC/XLS hay chỉ download?
Ưu tiên preview ảnh/PDF nếu dễ; loại khác download.
UI/effort.
Product/Tech Lead
Trước SHR-11.
OQ-ATT-03
Thời gian lưu file là bao lâu?
Không tự xóa; retention chưa chốt.
Storage/compliance.
Business/IT
Trước production.
OQ-ATT-04
Có scan virus/malware bắt buộc không?
Đánh dấu technical security requirement cần đánh giá.
Security.
Security/Architect
Trước production.
OQ-ATT-05
File clone có cần lưu sourceAttachmentId hiển thị trên UI?
Lưu metadata kỹ thuật nếu phù hợp; UI không bắt buộc.
Audit/model.
Tech Lead/BA
Trước schema final.
OQ-ATT-06
Cho phép xóa file sau Complete bằng quy trình admin đặc biệt không?
Không cho xóa qua nghiệp vụ MVP.
Operations/retention.
Business/IT
Sau MVP nếu cần.

7. Open Questions - SLA & Alert
ID
Câu hỏi/Chi tiết chưa chốt
Trạng thái tạm thời
Ảnh hưởng
Chủ sở hữu đề xuất
Thời điểm cần chốt
OQ-SLA-01
Ngưỡng WARNING 50% có cho Admin chỉnh không?
Cố định 50% trong MVP để đơn giản.
Admin config.
Business Owner
Trước Admin Figma.
OQ-SLA-02
Timezone chính thức của ứng dụng là gì?
Backend lưu timestamp chuẩn; UI tạm hiển thị timezone vận hành Việt Nam.
Date/time.
Business/IT
Trước production.
OQ-SLA-03
Countdown trên UI refresh bao lâu một lần?
Dùng polling/refresh đủ mượt; không ảnh hưởng trạng thái backend.
Frontend UX.
Tech Lead
Trước implementation.
OQ-SLA-04
Có lưu event lúc chuyển NORMAL→WARNING→OVERDUE hay tính động?
Tính động; lưu deadline và completedLate là tối thiểu.
Audit/reporting.
Architect/BA
Trước schema final.
OQ-SLA-05
Format duration hiển thị như thế nào?
Dùng giờ/phút; trên 24h có thể dùng ngày giờ.
UI consistency.
UX
Trước design system.
OQ-SLA-06
Non-Admin có được xem màn hình cấu hình SLA read-only?
Không cần menu riêng; deadline hiện trực tiếp trên task.
Navigation/permission.
Product Owner
Trước menu final.
OQ-SLA-07
Khoảng thời gian mặc định của báo cáo SLA?
30 ngày gần nhất là đề xuất, chưa chốt.
Reporting.
Business Owner
Trước report final.
OQ-SLA-08
Có escalation ngoài màu cam/đỏ không?
Ngoài MVP; không email/push/escalation.
Scope.
Product Owner
Sau MVP.

8. Open Questions - UI & Navigation
ID
Câu hỏi/Chi tiết chưa chốt
Trạng thái tạm thời
Ảnh hưởng
Chủ sở hữu đề xuất
Thời điểm cần chốt
OQ-UI-01
Dashboard là một page adaptive hay nhiều route theo role?
Một route adaptive theo role.
Implementation.
Tech Lead/UX
Trước frontend structure.
OQ-UI-02
Task processing là panel trong quotation detail hay route riêng?
Panel/tab trong chi tiết, có deep link nếu cần.
Navigation.
UX/Tech Lead
Trước Figma prototype.
OQ-UI-03
Giám đốc có nút Bắt đầu xử lý không?
Chỉ Approve/Reject trực tiếp là phương án tối giản; task vẫn có SLA.
Director UI.
Business Owner
Trước Director Figma.
OQ-UI-04
EXECUTOR Intake có ghi chú/attachment tùy chọn không?
Không hiển thị để giữ MVP đơn giản, trừ khi khách hàng yêu cầu.
Form scope.
Business Owner
Trước Intake Figma.
OQ-UI-05
History dùng tab, drawer hay route?
Tab trong quotation detail; revision mở read-only.
Figma/navigation.
UX
Trước History Figma.
OQ-UI-06
Mức responsive ngoài desktop?
Desktop-first; hỗ trợ tablet cơ bản nếu layout cho phép.
Design effort.
Product/UX
Trước Figma final.
OQ-UI-07
Tên menu cuối cùng?
Tổng quan, Báo giá, Công việc, Khách hàng, Báo cáo, Quản trị.
Navigation labels.
Business Owner/UX
Trước prototype review.
OQ-UI-08
Loading dùng skeleton hay spinner theo màn hình?
Skeleton cho list/detail, spinner cho action ngắn.
Design system.
UX
Trước component library.
OQ-UI-09
Similar quotation mở tab mới, drawer hay same page?
Drawer/modal read-only hoặc route detail; chưa chốt.
User flow.
UX/BA
Trước similar Figma.
OQ-UI-10
Có breadcrumb trên các màn hình chi tiết không?
Có là đề xuất cho desktop management.
Navigation.
UX
Trước design system.

9. Open Questions - User & Operations
ID
Câu hỏi/Chi tiết chưa chốt
Trạng thái tạm thời
Ảnh hưởng
Chủ sở hữu đề xuất
Thời điểm cần chốt
OQ-USR-01
Quy trình vận hành khi Sales nghỉ việc nhưng không được chuyển quotation?
Khóa account; giữ ownership lịch sử; cách xử lý quotation active chưa chốt.
Operations.
Business Owner/Admin
Trước go-live.
OQ-USR-02
Các role QA/R&D/Kế toán/Giám đốc có bao nhiêu account?
Theo vận hành khách hàng; mỗi account vẫn một role.
User setup.
Business Owner
Trước UAT account setup.
OQ-USR-03
User có tự sửa hồ sơ cá nhân không?
Read-only hoặc chỉ sửa thông tin cơ bản; Admin là nguồn quản lý chính.
Profile UI.
Product Owner
Trước AUTH-04.
OQ-USR-04
Có cần lý do khi khóa account?
Chưa bắt buộc trong MVP; audit action tối thiểu.
Admin/audit.
Business/IT
Trước Admin final.
OQ-USR-05
API trả 403 hay 404 khi object ngoài data scope?
Ưu tiên không lộ tồn tại; quyết định kỹ thuật/bảo mật.
API behavior.
Security/Tech Lead
Trước API standard.

10. Open Questions - Reporting
ID
Câu hỏi/Chi tiết chưa chốt
Trạng thái tạm thời
Ảnh hưởng
Chủ sở hữu đề xuất
Thời điểm cần chốt
OQ-RPT-01
Export Excel/PDF có thuộc MVP không?
COULD; không cản dashboard/report view.
Scope.
Product Owner
Trước report sprint.
OQ-RPT-02
Khoảng thời gian mặc định của dashboard/report?
30 ngày gần nhất là đề xuất.
KPI consistency.
Business Owner
Trước report Figma.
OQ-RPT-03
Sales có được so sánh KPI với Sales khác không?
Không; chỉ dữ liệu của mình.
Data scope.
Business Owner
Trước dashboard final.
OQ-RPT-04
Phòng ban có xem KPI phòng ban khác không?
Baseline cho xem toàn bộ dữ liệu; cách hiển thị có thể tập trung role hiện tại.
Dashboard UX.
Business Owner
Trước dashboard final.
OQ-RPT-05
Định nghĩa mẫu số tỷ lệ Won/Lost?
Cần chốt công thức báo cáo; không ảnh hưởng outcome workflow.
Metric correctness.
Business Owner/BA
Trước report implementation.
OQ-RPT-06
Tổng giá trị Won dùng finalQuotationValue của cycle nào?
Dùng cycle được APPROVED và outcome WON gần nhất là giả định.
Metric correctness.
BA/Kế toán
Trước report implementation.

11. Open Questions - Technical & Integration
ID
Câu hỏi/Chi tiết chưa chốt
Trạng thái tạm thời
Ảnh hưởng
Chủ sở hữu đề xuất
Thời điểm cần chốt
OQ-TECH-01
Lambda runtime/framework và cấu hình SnapStart cụ thể?
Theo kiến trúc được cung cấp; chi tiết ở Technical Design.
Implementation.
Architect
Trước coding backend.
OQ-TECH-02
Cơ chế connection từ Lambda tới RDS?
Cần technical design, có thể dùng RDS Proxy nếu phù hợp.
Scalability.
Architect
Trước infrastructure.
OQ-TECH-03
Cấu trúc lưu attachment và signed URL?
Thiết kế abstraction, không lưu binary trong PostgreSQL.
Storage/security.
Architect
Trước file implementation.
OQ-TECH-04
Cách đồng bộ Cognito user và user profile trong DB?
Cognito là identity; DB giữ business profile/reference.
User model.
Tech Lead
Trước schema/API.
OQ-TECH-05
Chiến lược optimistic locking/idempotency?
Bắt buộc về nguyên tắc; chi tiết trong Technical Design.
Consistency.
Tech Lead
Trước workflow coding.
OQ-TECH-06
Cách lập lịch/realtime tính alert SLA?
Có thể tính query-time và frontend refresh; chưa khóa thiết kế.
Performance/UX.
Architect
Trước dashboard implementation.
OQ-TECH-07
Audit event model ngoài Envers?
Cần event/task/SLA tables để truy vấn nghiệp vụ; schema chi tiết còn mở.
History/reporting.
Tech Lead/BA
Trước DB design.
OQ-TECH-08
Chính sách logging, monitoring và audit retention?
Chưa chốt; cần trước production readiness.
Operations/compliance.
IT/Security
Trước go-live.

12. Assumptions đang được sử dụng
ID
Giả định làm việc
Cơ sở
Rủi ro nếu sai
Cách kiểm chứng
ASM-001
MVP là ứng dụng desktop web nội bộ.
Requirement/UI baseline.
Thiếu mobile UX nếu thực tế dùng điện thoại.
Xác nhận thiết bị người dùng.
ASM-002
Toàn bộ label UI dùng tiếng Việt.
Đã thống nhất trong baseline.
Phát sinh i18n nếu cần ngôn ngữ khác.
Xác nhận stakeholder.
ASM-003
Giờ SLA tính 24/7, không loại cuối tuần/ngày nghỉ.
Đã chốt.
KPI/SLA khác thực tế vận hành.
UAT với dữ liệu thời gian.
ASM-004
Ngưỡng WARNING cố định 50% trong MVP.
Baseline cảnh báo.
Admin có thể cần chỉnh.
Review màn hình SLA.
ASM-005
Mỗi task chỉ có một role chịu trách nhiệm, không assign cá nhân động.
Workflow theo role.
Khó truy trách nhiệm nếu nhiều account cùng role.
Xác nhận mô hình account.
ASM-006
EXECUTOR chỉ có một account active.
Đã chốt.
Single point of operation.
Admin validation/UAT.
ASM-007
Sales attachment là tùy chọn.
Không có yêu cầu bắt buộc.
Thiếu tài liệu đầu vào ở thực tế.
UAT Sales flow.
ASM-008
Doanh nghiệp có thể lưu trước Contact nhưng không Submit quotation.
Giải pháp không chặn CRUD.
Khác kỳ vọng business.
Chốt OQ-CUS-06.
ASM-009
Giám đốc không cần Start action, có thể Approve/Reject trực tiếp.
Simplified workflow.
Thiếu IN_PROGRESS signal.
Chốt OQ-UI-03.
ASM-010
EXECUTOR Intake không cần note/file trên UI.
Không có field bắt buộc.
Mất ghi chú vận hành mong muốn.
Chốt OQ-UI-04.
ASM-011
Một route Dashboard thay đổi widget theo role.
Giảm trùng lặp implementation.
Figma/logic phức tạp hơn.
Prototype review.
ASM-012
Task form nằm trong quotation detail.
Giữ context đầy đủ.
Page dài.
Usability test.
ASM-013
Hibernate Envers xử lý entity revision; event tables xử lý workflow/task/SLA.
Baseline versioning.
Schema/audit phức tạp hơn dự kiến.
Technical design review.
ASM-014
Không hard delete quotation và dữ liệu lịch sử.
Audit requirement.
Tăng storage.
Xác nhận retention.
ASM-015
Outcome WON/LOST không sửa ngược trong MVP.
State machine đã chốt.
Cần xử lý manual nếu nhập sai.
Operational review.
ASM-016
Similar quotation dùng deterministic matching, không AI/vector.
Đã chốt MVP.
Chất lượng gợi ý giới hạn.
UAT ranking.
ASM-017
Báo cáo chưa cần export để demo core flow.
Feature priority.
Stakeholder có thể kỳ vọng file output.
Chốt OQ-RPT-01.
ASM-018
Backend lưu timestamp chuẩn và UI hiển thị theo timezone Việt Nam tạm thời.
Vận hành hiện tại.
Sai giờ nếu triển khai vùng khác.
Chốt OQ-SLA-02.

13. Vì sao các mục này không chặn tiến độ
Hạng mục đã đủ baseline
Có thể tiếp tục
Workflow & State Machine
Thiết kế và triển khai luồng end-to-end.
Role & Permission
Xây route guard, API authorization và data scope chính.
Data fields cốt lõi
Thiết kế form Sales/QA/R&D/EXECUTOR/Kế toán/Giám đốc.
Attachment limits
Xây upload validation và ownership theo task.
SLA durations
Xây deadline, warning, overdue và dashboard alert.
Clone/Re-submit
Xây hành vi dữ liệu và cycle mới.
Customer-Sales N-N
Xây model relation và Sales Customer scope.
Screen Inventory/UI Workflow
Bắt đầu Figma và frontend shell.

Các mục Open chỉ phải được chốt trước phần việc trực tiếp phụ thuộc, không cần dừng toàn bộ thiết kế hoặc implementation MVP.

14. Quy trình đóng Open Question
Bước
Thao tác
1
BA ghi nhận quyết định, người quyết định và ngày quyết định.
2
Đánh dấu Open Question là CLOSED hoặc DEFERRED.
3
Cập nhật tài liệu nguồn: Business Rules, Data Fields, Permission, SLA, UI Workflow hoặc Screen Inventory.
4
Đánh giá tác động lên Figma, API, DB, test case và backlog.
5
Nếu mâu thuẫn baseline đã chốt, yêu cầu xác nhận rõ trước khi thay đổi.
6
Không xóa lịch sử quyết định; giữ changelog.

15. Decision Log Template
Trường
Nội dung
Open ID
Mã câu hỏi.
Decision
Quyết định chính thức.
Decided By
Người/stakeholder quyết định.
Decision Date
Ngày quyết định.
Reason
Lý do/ngữ cảnh.
Affected Documents
Tài liệu cần cập nhật.
Affected Features/Screens
Feature hoặc màn hình bị tác động.
Status
CLOSED / DEFERRED / OUT OF SCOPE.

16. Thứ tự ưu tiên cần chốt
Ưu tiên
Nhóm cần chốt
Thời điểm
P1
Customer relation actor/access; field data type; Director/Intake UI; timezone.
Trước Figma/API/DB final của module liên quan.
P2
Similarity weights; attachment preview/storage; report metric formula.
Trước UAT hoặc implementation module.
P3
Export, mobile responsiveness, escalation, merge Customer, correction workflow.
Sau core MVP hoặc change request.

17. Acceptance Criteria của tài liệu
Mỗi chi tiết chưa chốt có ID, trạng thái tạm, ảnh hưởng, owner đề xuất và thời điểm cần quyết định.
Assumption không được trình bày như fact đã xác nhận.
Không open lại các quyết định đã chốt như EXECUTOR role, quotation owner 1-1, Customer N-N Sales, attachment theo task và SLA baseline.
Open Questions không làm thay đổi workflow cốt lõi hiện tại.
Khi đóng một mục phải cập nhật tài liệu nguồn và changelog.
