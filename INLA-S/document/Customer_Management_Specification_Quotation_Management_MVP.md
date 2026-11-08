# Customer Management Specification Quotation Management MVP

> Converted from `Customer_Management_Specification_Quotation_Management_MVP.docx` (Word baseline). **Source of truth:** this Markdown file.
> Annex/deltas: `annex/`, `spec-deltas/`. Templates: `templates/`.
> **Delta UI 2026-11-08:** `spec-deltas/2026-11-08-customer-ui-mvp.md` (frontend Customer MVP đã triển khai).
CUSTOMER MANAGEMENT SPECIFICATION
Hệ thống quản lý quy trình báo giá thùng carton
Phiên bản
Baseline 0.1
Ngày
13/10/2026
Phạm vi
MVP
Nội dung
CRUD Customer, Người liên hệ và quan hệ Customer-Sales
Ngôn ngữ UI
Tiếng Việt
Trạng thái
Tài liệu làm việc tạm thời


1. Mục đích và phạm vi
Tài liệu đặc tả module Customer Management trong MVP, bao gồm mô hình Customer, Người liên hệ, quan hệ Customer-Sales, quyền truy cập, CRUD, trạng thái hoạt động, validation, luồng giao diện và các API capability cần thiết. Nội dung được giữ nhất quán với Requirement Summary, Business Rules, Role & Permission Matrix và Data Field Specification đã chốt.
Phân biệt bắt buộc: Customer có thể liên quan nhiều Sales, nhưng mỗi quotation chỉ thuộc đúng một Sales Owner. Quyền xem Customer không bao giờ tự động cấp quyền xem quotation của Sales khác.

2. Mục tiêu module
Quản lý tập trung Customer loại Doanh nghiệp hoặc Cá nhân.
Quản lý Người liên hệ và liên hệ chính.
Cho phép cùng một Customer liên quan tới nhiều Sales mà không tạo dữ liệu Customer trùng lặp.
Giới hạn Sales chỉ thấy Customer có quan hệ với account Sales đó.
Cung cấp Customer/Contact hợp lệ cho quá trình tạo quotation.
Giữ lịch sử tham chiếu, không hard delete dữ liệu Customer đã dùng.
Hỗ trợ CRUD đơn giản, phù hợp demo và phát triển MVP.
3. Mô hình nghiệp vụ
Customer N ↔ N Sales
Customer 1 → N Contact Person
Customer 1 → N Quotation
Quotation N → 1 Sales Owner
Thực thể
Ý nghĩa
Quan hệ chính
Customer
Khách hàng chung, loại Doanh nghiệp hoặc Cá nhân.
N-N với Sales; 1-N với Contact; 1-N với Quotation.
Contact Person
Người liên hệ của Customer.
Thuộc đúng một Customer.
Customer-Sales Relation
Quan hệ cho phép Sales xem và sử dụng Customer.
Một Customer có nhiều Sales; một Sales có nhiều Customer.
Quotation
Báo giá do một Sales Owner tạo cho một Customer.
Thuộc đúng một Customer và một Sales Owner.

4. Customer Type và quy tắc liên hệ
Loại Customer
Người liên hệ
Cách dùng trong quotation
Doanh nghiệp
Bắt buộc có ít nhất một Người liên hệ hoạt động.
Sales phải chọn một Người liên hệ hợp lệ.
Cá nhân
Tùy chọn.
Nếu không có Người liên hệ, sử dụng thông tin chính Customer làm đầu mối liên hệ.

ID
Yêu cầu/Quy tắc
Mức độ
Ghi chú
CT-001
Customer Type bắt buộc là Doanh nghiệp hoặc Cá nhân.
MUST
Không để trống.
CT-002
Doanh nghiệp phải có ít nhất một Người liên hệ trước khi được dùng để Submit quotation.
MUST
Có thể tạo Customer trước rồi bổ sung Contact.
CT-003
Cá nhân không bắt buộc tạo Contact riêng.
MUST
Fallback về thông tin Customer.
CT-004
Contact đã Ngừng hoạt động không được chọn cho quotation mới.
MUST
Vẫn giữ trong lịch sử.
CT-005
Một Contact chỉ thuộc đúng một Customer.
MUST
Không dùng chung Contact giữa Customer.

5. Customer Data Specification
ID
Label UI
Kiểu/UI
Bắt buộc
Mặc định
Validation/Ghi chú
CUS-01
Loại khách hàng
Radio/Select
Có
Doanh nghiệp
Doanh nghiệp hoặc Cá nhân.
CUS-02
Tên khách hàng
Text
Có
Trống
Trim; không chỉ whitespace.
CUS-03
Tên viết tắt
Text
Không
Trống
Tùy chọn.
CUS-04
Mã số thuế
Text
Có
Trống
Bắt buộc cả hai loại; **10 hoặc 13 chữ số**; **UNIQUE** toàn hệ thống (DB + API 409).
CUS-05
Số điện thoại
Text
Có
Trống
Lưu chuẩn **+84** và 8–11 chữ số sau mã quốc gia; UI chuẩn hóa khi blur.
CUS-06
Email công ty
Email
Có
Trống
Đúng định dạng email khi Lưu (backend NOT NULL).
CUS-07
Địa chỉ
Textarea
Có
Trống
Không chỉ whitespace.
CUS-08
Tỉnh/Thành phố
Combobox (đóng danh sách)
Có
Trống
Chọn trong **63 tỉnh/thành VN** (`PROVINCE_OPTIONS`); không nhập tự do; lưu `text` trên DB.
CUS-09
Website
URL
Không
Trống
Đúng URL nếu nhập.
CUS-10
Ghi chú
Textarea
Không
Trống
Tùy chọn.
CUS-11
Trạng thái
Select/Badge
Có
Hoạt động
Hoạt động hoặc Ngừng hoạt động.
CUS-12
Sales liên quan
Multi-select User
Có
Sales tạo nếu phù hợp
Quan hệ N-N; actor quản lý chi tiết còn OPEN.
CUS-13
Ngày tạo
DateTime/RO
Có
System
Audit.
CUS-14
Người tạo
User/RO
Có
System
Audit.
CUS-15
Ngày cập nhật
DateTime/RO
Có
System
Audit.

Mã số thuế được xác nhận là bắt buộc cho cả Doanh nghiệp và Cá nhân. **MST duy nhất toàn hệ thống** đã chốt (`customers.tax_id` UNIQUE). UI validate độ dài 10 hoặc 13 chữ số trước khi gọi API.

6. Người liên hệ Data Specification
ID
Label UI
Kiểu/UI
Bắt buộc
Mặc định
Validation/Ghi chú
CON-01
Họ và tên
Text
Có
Trống
Trim; không chỉ whitespace.
CON-02
Chức vụ
Text
Không
Trống
Tùy chọn.
CON-03
Phòng ban
Text
Không
Trống
Tùy chọn.
CON-04
Email
Email
Có
Trống
Đúng định dạng email.
CON-05
Số điện thoại
Text
Có
Trống
Thông tin liên lạc bắt buộc.
CON-06
Ghi chú
Textarea
Không
Trống
Tùy chọn.
CON-07
Liên hệ chính
Checkbox
Không
False
Nên chỉ có một liên hệ chính hoạt động cho mỗi Customer.
CON-08
Trạng thái
Select/Badge
Có
Hoạt động
Hoạt động hoặc Ngừng hoạt động.
CON-09
Customer
Reference/RO
Có
Customer hiện tại
Không chuyển Contact giữa Customer trong MVP.
CON-10
Ngày tạo/Cập nhật
DateTime/RO
Có
System
Audit.

ID
Yêu cầu/Quy tắc
Mức độ
Ghi chú
CON-R01
Khi đặt một Contact thành Liên hệ chính, hệ thống bỏ cờ Liên hệ chính của Contact khác cùng Customer.
SHOULD
Giữ một primary contact.
CON-R02
Không được Ngừng hoạt động Contact duy nhất của Doanh nghiệp nếu điều đó làm Customer không còn Contact hoạt động để dùng cho quotation.
SHOULD
Cần cảnh báo/validation.
CON-R03
Contact đang được quotation lịch sử tham chiếu không được hard delete.
MUST
Chỉ Ngừng hoạt động.
CON-R04
Contact chưa từng được sử dụng có thể xóa sau xác nhận.
SHOULD
Backend kiểm tra reference.

7. Permission và Data Scope
Role
Xem Customer
Tạo/Sửa
Ngừng hoạt động/Xóa chưa dùng
Xem quotation tại Customer
Sales
Chỉ Customer có relation với Sales.
Trong data scope.
Trong data scope.
Chỉ quotation do chính Sales sở hữu.
EXECUTOR
Toàn bộ.
Toàn bộ.
Toàn bộ.
Toàn bộ.
QA
Toàn bộ.
Toàn bộ.
Toàn bộ.
Toàn bộ.
R&D
Toàn bộ.
Toàn bộ.
Toàn bộ.
Toàn bộ.
Kế toán
Toàn bộ.
Toàn bộ.
Toàn bộ.
Toàn bộ.
Giám đốc
Toàn bộ.
Toàn bộ.
Toàn bộ.
Toàn bộ.
Admin
Toàn bộ.
Toàn bộ.
Toàn bộ.
Toàn bộ read-only workflow.

Tất cả business role có quyền CRUD Customer trong data scope theo baseline đã chốt.
Quyền rộng này phải được audit; backend kiểm tra scope trước khi đọc hoặc ghi.
Admin quản trị dữ liệu Customer nhưng không có quyền workflow action trên quotation.
8. Customer-Sales Relationship Specification
ID
Yêu cầu/Quy tắc
Mức độ
Ghi chú
REL-001
Customer và Sales có quan hệ nhiều-nhiều.
MUST
Không lưu một salesOwnerId duy nhất trên Customer.
REL-002
Sales chỉ được trả về Customer có relation active với account đó.
MUST
Filter tại backend.
REL-003
Một Customer có thể đồng thời xuất hiện trong danh sách của nhiều Sales.
MUST
Không tạo bản sao Customer.
REL-004
Tạo quotation không tạo hoặc thay đổi relation Customer-Sales ngầm.
MUST
Customer phải đã thuộc scope Sales.
REL-005
Xóa relation Customer-Sales không xóa Customer, Contact hoặc quotation.
MUST
Chỉ xóa/disable association.
REL-006
Sales bị gỡ relation không được xem Customer trong danh sách hiện tại, nhưng quotation mà Sales sở hữu vẫn cần bảo toàn quyền theo quotation ownership.
OPEN
Cần chốt tác động giữa relation removal và quotation access.
REL-007
Mọi thay đổi relation phải audit actor, role, thời điểm và Sales được thêm/gỡ.
MUST
Traceability.
REL-008
Actor cụ thể được phép thêm/gỡ relation sau khi Customer tồn tại chưa được chốt.
OPEN
Không tự giới hạn chỉ Admin.

8.1 Dữ liệu quan hệ đề xuất
Trường
Ý nghĩa
Quy tắc
customerId
Customer được liên kết.
Bắt buộc.
salesUserId
Account Sales được liên kết.
Bắt buộc; phải có role SALES.
status
ACTIVE/INACTIVE nếu dùng soft relation.
Đề xuất kỹ thuật; chưa bắt buộc.
createdAt/createdBy
Thời điểm và actor tạo relation.
Audit.
endedAt/endedBy
Thời điểm và actor kết thúc relation.
Có nếu dùng soft relation.

9. CRUD Customer Workflow
9.1 Tạo Customer (triển khai CUS-S02 / route `/customers/new`)
Người dùng mở **Tạo khách hàng mới**; chọn **Doanh nghiệp** hoặc **Cá nhân** (radio).
Section thu gọn **Thông tin khách hàng**: grid Field (icon, label hover); các trường theo §5.
**Doanh nghiệp — Tạo:** section **Người liên hệ** (có thể thêm nhiều dòng); chỉ validate dòng đã nhập; banner: báo giá cần ≥1 contact active; cho phép **Lưu** không bắt buộc contact ngay.
**Cá nhân — Tạo:** ghi chú không bắt buộc contact; đổi sang Cá nhân xóa draft contact inline.
**Sales (không Admin):** hiển thị read-only *Sales phụ trách* (tên user); API tự gắn relation khi POST.
**Admin:** checkbox danh sách *Nhân viên Sales liên quan* (tài khoản SALES enabled).
Lưu → validate FE + API → audit → điều hướng **Chi tiết** (`/customers/:code`). Lỗi contact sau khi tạo KH: redirect chi tiết kèm `notice`.
**Chốt CM-O06:** không bắt buộc contact trong cùng transaction tạo Customer; vẫn **MUST** có contact active trước Submit quotation (CT-002).

9.2 Xem danh sách Customer (triển khai CUS-S01 / route `/customers`)
Thành phần
Yêu cầu
Tiêu đề / CTA
Quản lý khách hàng; nút **+ Tạo khách hàng**.
Tìm kiếm (`q`)
Placeholder: tên, MST, SĐT, email. Backend list hiện khớp name/code/MST/email; **tìm theo SĐT** là yêu cầu API (chưa có trong MVP backend).
Bộ lọc
Loại KH, **Tỉnh/Thành phố** (combobox giá trị distinct từ dữ liệu), Trạng thái; nút **Lọc** và **Đặt lại** (không lọc theo Sales trên UI).
Cột chính
**Mã KH**, Tên, Loại KH, MST, SĐT, Email, Tỉnh/Thành phố, Trạng thái (icon), Hành động.
Data scope
Sales: Customer có relation active; Admin: toàn bộ (theo API customer module).
Phân trang/sắp xếp
API hỗ trợ paging; UI MVP tải `pageSize` 100, chưa có control phân trang. Sắp xếp `updated_at` DESC (backend).
Action trên list
**Xem** (icon); Sửa / Ngừng hoạt động thực hiện từ chi tiết hoặc form sửa.

9.3 Sửa Customer
Chỉ cho sửa Customer trong data scope.
Không thay đổi quotation ownership khi sửa Customer hoặc Sales relation.
Thay đổi Customer không tự động sửa snapshot lịch sử của quotation/revision cũ.
Mọi thay đổi được audit; các trường hệ thống chỉ đọc.
Nếu đổi loại Doanh nghiệp/Cá nhân, cần validation Contact tương ứng. Việc có cho đổi loại sau khi đã dùng hay không là OPEN và nên hạn chế sau khi có quotation.
9.4 Ngừng hoạt động
Người dùng chọn Ngừng hoạt động.
UI hiển thị cảnh báo Customer sẽ không thể được chọn cho quotation mới.
Backend kiểm tra quyền/data scope.
Cập nhật trạng thái, không xóa Contact, relation hoặc history.
Customer vẫn xuất hiện trong quotation cũ và màn hình lịch sử.
9.5 Xóa Customer chưa sử dụng
Chỉ khi chưa từng liên kết quotation.
Có hộp thoại xác nhận hành động rủi ro.
Backend kiểm tra reference lần cuối, kể cả khi UI đã kiểm tra.
Nếu có quotation, trả lỗi và hướng dẫn Ngừng hoạt động.
Mọi xóa phải audit theo khả năng hệ thống.
10. CRUD Người liên hệ Workflow
Hành động
Điều kiện
Kết quả
Tạo
Có quyền với Customer; field bắt buộc hợp lệ.
Contact mới thuộc đúng Customer.
Sửa
Contact thuộc Customer trong data scope.
Cập nhật và audit.
Đặt liên hệ chính
Contact đang hoạt động.
Contact khác cùng Customer bỏ cờ primary.
Ngừng hoạt động
Không vi phạm quy tắc Contact bắt buộc của Doanh nghiệp.
Không chọn cho quotation mới.
Xóa
Contact chưa từng được quotation tham chiếu.
Xóa sau xác nhận.
Xem lịch sử
Theo Customer scope.
Read-only audit/history nếu hỗ trợ.

11. Screen Specification cấp module
Screen ID
Tên màn hình
Mục đích
Action chính
CUS-S01
Danh sách khách hàng
Tìm/lọc/xem Customer theo scope.
Tạo, Xem, Sửa, Ngừng hoạt động.
CUS-S02
Tạo khách hàng
Tạo Doanh nghiệp/Cá nhân và Sales relation.
Lưu, Hủy, thêm Contact.
CUS-S03
Chi tiết khách hàng
Tổng hợp thông tin, Contact, Sales relation và quotation được phép xem.
Sửa, thêm Contact, đổi trạng thái.
CUS-S04
Sửa khách hàng
Cập nhật thông tin Customer.
Lưu, Hủy.
CUS-S05
Tạo người liên hệ
Thêm Contact cho Customer.
Lưu, Hủy.
CUS-S06
Sửa người liên hệ
Cập nhật Contact, primary và trạng thái.
Lưu, Hủy, Ngừng hoạt động.
CUS-S07
Quản lý Sales liên quan
Xem/thay đổi quan hệ N-N.
Thêm/Gỡ theo quyền chưa chốt.
CUS-S08
Chọn khách hàng trong quotation
Sales chọn Customer/Contact hợp lệ.
Tìm, chọn, mở nhanh chi tiết.

11.1 Cấu trúc màn hình Chi tiết khách hàng (route `/customers/:code`)
Phần header (trên tabs)
Mã KH · loại; tên; badge trạng thái; **Sửa thông tin**; **Tạo báo giá** (Sales).
Tab/Section
Nội dung
Quy tắc data scope
Thông tin (`end`)
Tab mặc định: dl 2 cột (tên, MST, SĐT, email, địa chỉ, tỉnh, website/tên viết tắt nếu có, loại, **Sales phụ trách**, trạng thái, ghi chú).
Theo Customer scope.
Người liên hệ (count)
Bảng contact **active**; modal Thêm/Sửa; Ngừng hoạt động (modal).
Theo Customer scope.
Sales liên quan (count)
Bảng relation active; **Admin** thêm/gỡ qua select + nút.
Admin quản lý; Sales xem.
Báo giá (count)
Bảng quotation (mã, workflow, outcome, owner, ngày tạo).
Quotation scope backend.
Lịch sử thay đổi
Audit read-only; badge *Chỉ đọc*.
Theo scope.

**Sửa khách hàng:** `/customers/:code/edit` — cùng form create (không section contact inline); **Admin** thấy **Ngừng hoạt động** (active) → modal `/deactivate`.
**Contact modal:** *Vai trò liên hệ* = select Liên hệ chính / phụ (tương đương `isPrimary`).

Tab Báo giá phải áp dụng quotation scope riêng. Không được tải toàn bộ quotation theo Customer rồi chỉ ẩn ở frontend đối với Sales.

12. Validation Rules
ID
Yêu cầu/Quy tắc
Mức độ
Ghi chú
VAL-001
Tên Customer, MST, điện thoại, email, địa chỉ và tỉnh/thành là bắt buộc.
MUST
Theo baseline field.
VAL-002
Email phải đúng định dạng; website đúng URL nếu nhập.
MUST
Frontend + backend.
VAL-003
Text bắt buộc phải trim và không chỉ whitespace.
MUST
Customer/Contact.
VAL-004
Sales được chọn phải là account role SALES và active.
MUST
Customer-Sales relation.
VAL-005
Doanh nghiệp phải có Contact hoạt động trước Submit quotation.
MUST
Không nhất thiết chặn Save Customer.
VAL-006
Customer/Contact Ngừng hoạt động không được chọn cho quotation mới.
MUST
Backend kiểm tra.
VAL-007
Không xóa Customer hoặc Contact đã được quotation tham chiếu.
MUST
Reference check.
VAL-008
Không cho Sales đọc/sửa Customer ngoài relation.
MUST
Data scope backend.
VAL-009
Không cho Sales xem quotation Sales khác trong tab Customer.
MUST
Query scope.
VAL-010
Thay đổi loại Customer sau khi đã có quotation là OPEN.
OPEN
Không tự cho phép/chặn tuyệt đối trước khi chốt.

13. Thông báo UI đề xuất
Tình huống
Thông báo tiếng Việt
Thiếu loại Customer
Vui lòng chọn loại khách hàng.
Thiếu tên
Vui lòng nhập tên khách hàng.
Thiếu MST
Vui lòng nhập mã số thuế.
Email sai
Email không đúng định dạng.
Website sai
Website phải bắt đầu bằng http:// hoặc https://.
SĐT sai
Số điện thoại không hợp lệ.
MST sai
Mã số thuế gồm 10 hoặc 13 chữ số.
Tỉnh/Thành không hợp lệ
Chọn Tỉnh/Thành phố trong danh sách.
MST trùng
Mã số thuế này đã tồn tại.
Doanh nghiệp thiếu Contact
Khách hàng doanh nghiệp cần ít nhất một người liên hệ hoạt động.
Customer inactive khi tạo quotation
Khách hàng đã ngừng hoạt động và không thể dùng để tạo báo giá mới.
Contact inactive
Người liên hệ đã ngừng hoạt động. Vui lòng chọn người khác.
Xóa Customer đã dùng
Không thể xóa khách hàng đã có báo giá. Hãy chuyển sang trạng thái Ngừng hoạt động.
Xóa Contact đã dùng
Không thể xóa người liên hệ đã được sử dụng trong báo giá.
Không có quyền
Bạn không có quyền truy cập khách hàng này.
Gỡ Contact cuối của Doanh nghiệp
Không thể ngừng hoạt động người liên hệ duy nhất của khách hàng doanh nghiệp.
Relation Sales không hợp lệ
Không thể cập nhật Sales liên quan. Vui lòng kiểm tra lại quyền và trạng thái tài khoản.

14. API Capability List
Capability
Mục đích
Authorization/Scope
ListCustomers
Danh sách có search/filter/paging.
Sales theo relation; role khác toàn bộ.
GetCustomer
Chi tiết Customer.
Theo Customer scope.
CreateCustomer
Tạo Customer.
Business role/Admin theo baseline.
UpdateCustomer
Sửa Customer.
Theo scope; audit.
DeactivateCustomer
Ngừng hoạt động.
Theo scope; không xóa history.
DeleteUnusedCustomer
Xóa Customer chưa dùng.
Theo scope + reference check.
ListContacts
Danh sách Contact theo Customer.
Theo Customer scope.
CreateContact
Tạo Contact.
Theo Customer scope.
UpdateContact
Sửa Contact.
Theo Customer scope.
DeactivateContact
Ngừng hoạt động Contact.
Theo scope + business validation.
DeleteUnusedContact
Xóa Contact chưa dùng.
Theo scope + reference check.
ListRelatedSales
Xem Sales relation.
Theo permission chi tiết còn OPEN.
AddCustomerSalesRelation
Thêm relation.
Actor cụ thể OPEN; backend audit.
RemoveCustomerSalesRelation
Gỡ relation.
Actor/tác động access OPEN.
ListCustomerQuotations
Quotation tại Customer.
Phải áp dụng quotation scope riêng.
SearchSelectableCustomers
Customer cho form quotation.
Sales relation + Customer active.
SearchSelectableContacts
Contact cho form quotation.
Customer selected + Contact active.

15. Audit và History Requirements
Sự kiện
Dữ liệu cần lưu
Customer created/updated
Customer ID; before/after; actor; role; timestamp.
Customer activated/deactivated
Trạng thái trước/sau; actor; thời điểm; ghi chú nếu có.
Customer deleted
Chỉ unused; actor; timestamp; identifier tối thiểu theo audit policy.
Contact created/updated
Contact ID; Customer ID; before/after; actor; timestamp.
Primary contact changed
Contact cũ/mới; actor; timestamp.
Contact deactivated/deleted
Trạng thái hoặc deletion event; actor; timestamp.
Sales relation added/removed
Customer ID; Sales User ID; actor; role; timestamp.
Customer selected for quotation
Không bắt buộc event riêng; quotation lưu reference/snapshot qua revision.

16. Kịch bản kiểm thử tối thiểu
ID
Kịch bản
Kết quả mong đợi
CM-T01
Sales tạo Customer mới
Customer liên kết Sales tạo; Sales xem được.
CM-T02
Hai Sales liên quan cùng Customer
Cả hai thấy Customer; không thấy quotation của nhau.
CM-T03
Sales truy cập Customer không relation
Bị từ chối/không lộ dữ liệu.
CM-T04
Tạo Doanh nghiệp chưa Contact
Có thể lưu theo đề xuất; Submit quotation bị chặn.
CM-T05
Cá nhân không Contact
Quotation dùng thông tin chính Customer.
CM-T06
Ngừng hoạt động Customer
Không chọn được cho quotation mới; history vẫn hiển thị.
CM-T07
Xóa Customer đã có quotation
Bị chặn; đề nghị Ngừng hoạt động.
CM-T08
Xóa Customer chưa dùng
Được phép sau xác nhận và reference check.
CM-T09
Ngừng Contact duy nhất của Doanh nghiệp
Bị chặn/cảnh báo theo rule.
CM-T10
Đặt Contact thứ hai là chính
Contact chính cũ được bỏ cờ.
CM-T11
Tab Báo giá khi đăng nhập Sales
Chỉ quotation của Sales đó.
CM-T12
Role phòng ban xem Customer
Xem toàn bộ Customer và quotation theo role scope.
CM-T13
Sửa Customer
Lưu audit before/after.
CM-T14
Contact inactive trong quotation mới
Không cho chọn.
CM-T15
Gỡ relation Customer-Sales
Không xóa dữ liệu; tác động access theo rule được chốt sau.

17. Open Details cần chốt sau
Open ID
Nội dung
Ảnh hưởng
CM-O01
~~Mã số thuế có unique toàn hệ thống không?~~ **Đã chốt: UNIQUE.**
Database constraint, duplicate warning.
CM-O02
Ai được thêm/gỡ Sales relation trên Customer đã tồn tại?
**Một phần chốt:** **ADMIN** trên tab Sales và form edit; SALES auto-relation khi tạo KH.
CM-O03
Khi gỡ Sales relation, Sales có tiếp tục xem Customer vì còn quotation sở hữu không?
Data scope consistency.
CM-O04
Có cho đổi Customer Type sau khi đã có quotation không?
Data integrity và Contact rule.
CM-O05
Có chặn Ngừng hoạt động Customer đang có Draft quotation không?
Lifecycle validation.
CM-O06
Có cho lưu Doanh nghiệp chưa Contact hay bắt buộc Contact trong cùng transaction?
**Đã chốt:** cho lưu không contact; contact inline tùy chọn hoặc tab sau.
CM-O07
Sales có được nhìn thấy tên các Sales khác liên quan cùng Customer không?
Privacy/UI.
CM-O08
Danh mục tỉnh/thành dùng master data nào?
**UI chốt:** `frontend/src/lib/vietnamProvinces.ts`; chưa có bảng master DB.
CM-O09
Field số điện thoại và MST có quy tắc format cụ thể không?
**Đã chốt:** phone +84…; MST 10/13 chữ số (FE + khuyến nghị CHECK DB).
CM-O10
Có yêu cầu merge Customer trùng lặp không?
Ngoài MVP hiện tại nếu không chốt.

18. Acceptance Criteria cấp module
Tạo, xem, sửa Customer loại Doanh nghiệp/Cá nhân bằng label tiếng Việt.
Quản lý Contact và liên hệ chính theo đúng quy tắc từng loại Customer.
Sales chỉ thấy Customer có relation; vai trò còn lại thấy toàn bộ.
Hai Sales cùng Customer không xem được quotation của nhau.
Customer/Contact inactive không dùng cho quotation mới nhưng vẫn hiển thị lịch sử.
Không hard delete Customer/Contact đã được quotation sử dụng.
Tab quotation tại Customer áp dụng quotation scope ở backend.
Mọi CRUD và thay đổi relation quan trọng được audit.
Validation hiển thị ở frontend và được enforce lại ở backend.
