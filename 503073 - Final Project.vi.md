


## 503073 – LẬP TRÌNH WEB & ỨNG DỤNG
## ĐỒ ÁN CUỐI KỲ – HỌC KỲ II/2024-2025
Cập nhật lần cuối: 02/01/2025

Tuân thủ bắt buộc nội dung được tô đỏ
Đối với nội dung được tô đỏ, sinh viên phải tuân thủ nghiêm ngặt các mô tả đã cung cấp. Bất kỳ sự sai lệch, chỉnh sửa hoặc bổ sung tính năng nào sẽ khiến bài nộp bị loại khỏi đánh giá.

## I. Tổng quan
Phát triển một ứng dụng quản lý ghi chú cho phép người dùng tạo và tổ chức ghi chú của họ. Ghi chú có thể bao gồm nhiều định dạng nội dung khác nhau, bao gồm văn bản, hình ảnh và tệp đính kèm. Sinh viên phải tuân thủ nghiêm ngặt các chức năng được nêu trong bài tập này. Việc bổ sung các tính năng không liên quan, lệch khỏi các yêu cầu đã chỉ định có thể cho thấy sinh viên không tự thực hiện dự án một cách độc lập. Mặc dù sinh viên được phép sử dụng thư viện và framework để hỗ trợ phát triển—chẳng hạn như Bootstrap hoặc React cho front end và Laravel cho back end - nhưng không được triển khai bất kỳ tính năng nào ngoài những nội dung đã mô tả.


## II. Mô tả chi tiết

## 2.1 Quản lý tài khoản
- Để truy cập dịch vụ, người dùng phải có tài khoản và đăng nhập. Nếu người dùng cố gắng truy cập website khi chưa đăng nhập, họ sẽ được chuyển hướng ngay lập tức đến giao diện đăng nhập. Sau khi đăng nhập thành công, người dùng sẽ được đưa đến trang chủ cá nhân, nơi họ có thể xem các ghi chú của mình.
- Khi đăng ký tài khoản mới, người dùng chỉ bắt buộc cung cấp các thông tin sau: địa chỉ email, tên hiển thị và mật khẩu (nhập hai lần để xác nhận). Website sẽ không lưu trực tiếp mật khẩu mà chỉ lưu giá trị băm bằng bcrypt tương ứng. Sau khi đăng ký thành công, người dùng sẽ được tự động đăng nhập mà không cần đăng nhập lại. Ngoài ra, một email chứa liên kết kích hoạt sẽ được gửi đến địa chỉ email đã đăng ký của người dùng.
- Trước khi tài khoản được kích hoạt, người dùng vẫn có thể truy cập tất cả các chức năng; điểm khác biệt duy nhất là trên website sẽ có một thông báo nổi bật cho biết tài khoản chưa được xác thực và khuyên họ kiểm tra email để hoàn tất quá trình kích hoạt. Khi người dùng nhấp vào liên kết kích hoạt trong email, tài khoản sẽ được kích hoạt và thông báo sẽ biến mất.
- Màn hình Tùy chọn người dùng (User Preferences) cho phép người dùng điều chỉnh một số cài đặt cụ thể, chẳng hạn như cỡ chữ của ghi chú, màu ghi chú, hoặc chuyển đổi giữa giao diện sáng và tối.
- Tính năng Đặt lại mật khẩu (Password Reset) cho phép người dùng khôi phục mật khẩu qua email. Người dùng phải nhấp vào liên kết trong email hoặc nhập OTP được gửi qua email trước khi được chuyển đến màn hình nhập mật khẩu mới. Sau khi đặt lại mật khẩu, người dùng phải đăng nhập lại thủ công.

## 2.2 Quản lý ghi chú cơ bản
- Mặc định, ghi chú được hiển thị theo bố cục dạng lưới (grid view). Tuy nhiên, người dùng có thể chuyển sang dạng danh sách (list view) nếu muốn. Điều này đảm bảo giao diện phù hợp với các sở thích khác nhau của người dùng và tăng khả năng truy cập.

- Khi tạo ghi chú mới, người dùng chỉ được nhập hai trường: tiêu đề (title) và nội dung (content); không cho phép bất kỳ trường hoặc thuộc tính bổ sung nào. Cùng một giao diện phải được sử dụng cho cả việc thêm mới và chỉnh sửa ghi chú, nghĩa là không được phép phát triển hai màn hình riêng cho hai chức năng này. Ngoài ra, nội dung ghi chú phải được tự động lưu, loại bỏ nhu cầu người dùng phải nhấp nút “lưu”. Tính năng tự động lưu này đảm bảo trải nghiệm liền mạch và giảm rủi ro mất dữ liệu.
- Khi xóa ghi chú, luôn phải hiển thị hộp thoại xác nhận để lấy sự đồng ý rõ ràng của người dùng trước khi tiến hành xóa. Điều này tăng độ an toàn và ngăn ngừa mất dữ liệu do thao tác nhầm. Ghi chú cũng có thể hỗ trợ đính kèm hình ảnh, với tùy chọn đính kèm một hoặc nhiều ảnh. Sinh viên có thể tự quyết định cách triển khai tính năng đính kèm theo cách phù hợp với thiết kế và yêu cầu khả dụng của hệ thống.
- Mặc định, ghi chú phải được sắp xếp theo thời điểm tạo hoặc thời điểm chỉnh sửa gần nhất, với các ghi chú mới nhất xuất hiện ở đầu danh sách. Tuy nhiên, người dùng có thể “ghim” một số ghi chú lên đầu, đảm bảo chúng luôn được hiển thị trước. Nếu có nhiều ghi chú được ghim, chúng phải được sắp xếp theo thời điểm được ghim, duy trì một thứ bậc rõ ràng.
- Nền tảng phải có chức năng tìm kiếm hiệu quả, cho phép người dùng tìm ghi chú theo từ khóa. Tìm kiếm phải quét cả tiêu đề và nội dung ghi chú để tìm kết quả khớp. Thay vì cung cấp nút “Tìm kiếm”, hệ thống phải có cơ chế tìm kiếm trực tiếp (live search), kích hoạt ngay khi người dùng bắt đầu gõ vào ô tìm kiếm. Có thể triển khai một độ trễ nhỏ (ví dụ: 300ms) để cải thiện hiệu năng và độ phản hồi.
- Quản lý nhãn (label) là một tính năng thiết yếu khác. Người dùng phải có thể xem danh sách tất cả nhãn, thêm nhãn mới, đổi tên nhãn hiện có và xóa nhãn khi cần. Một ghi chú có thể không có nhãn hoặc gắn với một hay nhiều nhãn. Ngoài ra, người dùng phải có khả năng lọc ghi chú theo nhãn, chỉ hiển thị các ghi chú gắn với nhãn đã chọn. Lưu ý rằng nếu một nhãn bị xóa, điều đó không được ảnh hưởng đến các ghi chú trước đó đã liên kết với nhãn đó. Tương tự, nếu nhãn được đổi tên, tất cả ghi chú liên kết với nhãn đó phải tự động phản ánh tên nhãn mới, đảm bảo tính nhất quán trên toàn hệ thống.

## 2.3 Quản lý ghi chú nâng cao

- Để tăng cường bảo mật, website nên cung cấp cơ chế khóa ghi chú bằng mật khẩu. Với một ghi chú thông thường, khi tính năng này được kích hoạt, người dùng phải đặt một mật khẩu riêng cho ghi chú đó. Mỗi ghi chú có một mật khẩu riêng, không liên quan đến các ghi chú khác. Khi bật bảo vệ mật khẩu, một hộp thoại sẽ yêu cầu người dùng nhập mật khẩu trước khi cho phép bất kỳ hành động nào, như xem, chỉnh sửa hoặc xóa ghi chú. Người dùng cũng có thể thay đổi mật khẩu của ghi chú hoặc tắt bảo vệ mật khẩu hoàn toàn nếu họ không còn muốn sử dụng tính năng này.
- Khả năng chia sẻ ghi chú là một tính năng nâng cao, cho phép người dùng chia sẻ ghi chú của họ với người khác thông qua tài khoản email đã đăng ký. Khi chia sẻ, chủ sở hữu ghi chú có thể chỉ định quyền chia sẻ như chỉ đọc hoặc có quyền chỉnh sửa. Họ cũng có thể chọn một hoặc nhiều người nhận. Ngoài ra, chủ sở hữu vẫn có toàn quyền thu hồi quyền truy cập hoặc thay đổi cài đặt chia sẻ bất cứ lúc nào.
- Người nhận ghi chú được chia sẻ phải có một khu vực riêng nơi tất cả ghi chú được chia sẻ với họ được hiển thị. Khu vực này phải thể hiện rõ trạng thái chia sẻ của từng ghi chú, nêu rõ ghi chú chỉ đọc hay có thể chỉnh sửa. Ngoài ra, cần cung cấp thông tin về người đã chia sẻ ghi chú, kèm theo dấu thời gian khi việc chia sẻ diễn ra. Với các ghi chú được chia sẻ kèm quyền chỉnh sửa, phải triển khai cộng tác thời gian thực bằng công nghệ WebSocket. Điều này cho phép nhiều người dùng chỉnh sửa ghi chú đồng thời và quan sát các thay đổi của nhau theo thời gian thực.
- Với các ghi chú đặc biệt, chẳng hạn như ghi chú được chia sẻ, được ghim, hoặc được bảo vệ bằng mật khẩu, hệ thống phải có một biểu tượng dễ nhận biết để người dùng nhận diện nhanh. Biểu tượng này phải được hiển thị ở cả chế độ danh sách và chế độ lưới, giúp người dùng nhanh chóng biết trạng thái ghi chú mà không cần mở ghi chú hoặc đi vào chi tiết. Ví dụ, người dùng phải có thể nhận ra ngay một ghi chú có bảo vệ mật khẩu hay đã được chia sẻ chỉ bằng cách nhìn biểu tượng.

## 2.4 Yêu cầu bổ sung
Các cân nhắc về UI và UX
- Giao diện người dùng (UI) và trải nghiệm người dùng (UX) là những yếu tố then chốt để tạo ra một website hấp dẫn. UI tập trung vào các yếu tố thẩm mỹ, chẳng hạn thiết kế có đẹp mắt hay không; trong khi UX liên quan đến cảm nhận của người dùng khi tương tác với website—liệu có tiện lợi hay gây bực bội, nhanh hay chậm. Những website có UI và UX ở mức trung bình sẽ không được chấm điểm ở hạng mục này. Để đạt 0.25 điểm, website phải thể hiện UI và UX tốt; còn nếu xuất sắc ở các khía cạnh này sẽ đạt 0.5 điểm.
## Thiết kế đáp ứng (Responsive Design)
- Thiết kế đáp ứng là một tiêu chí đánh giá riêng do tầm quan trọng của nó đối với cả UI và UX. Một website đáp ứng phải thích nghi mượt mà với các kích thước màn hình khác nhau, tối ưu việc sử dụng không gian khả dụng trên nhiều thiết bị. Tối thiểu, website phải hoạt động tốt trên ba loại thiết bị: smartphone, tablet và màn hình desktop. Khả năng đáp ứng tốt đảm bảo người dùng có trải nghiệm nhất quán và dễ chịu bất kể họ dùng thiết bị nào.
## Khả năng hoạt động ngoại tuyến (Offline Capabilities)
- Khả năng ngoại tuyến, một đặc trưng của Progressive Web Apps (PWA), nên được triển khai bằng JavaScript. Tính năng này cho phép website vẫn truy cập được và hiển thị nội dung ghi chú ngay cả khi người dùng offline hoặc tạm thời mất kết nối Internet. Để triển khai hiệu quả, lập trình viên cần tìm hiểu các nguyên tắc PWA và tích hợp một cơ sở dữ liệu cục bộ (bằng JavaScript) với cơ sở dữ liệu trực tuyến (ví dụ: MySQL). Sự kết hợp này đảm bảo trải nghiệm liền mạch bằng cách cho phép người dùng xem ghi chú khi offline và đồng bộ dữ liệu khi kết nối Internet được khôi phục.
## Triển khai trực tuyến (Online Deployment)
- Triển khai trực tuyến là việc host website và tất cả các dịch vụ liên quan, chẳng hạn cơ sở dữ liệu, trên một nền tảng công khai để mọi người có thể truy cập qua tên miền. Để đạt 0.5 điểm cho yêu cầu này, bạn phải triển khai website và cơ sở dữ liệu lên một dịch vụ online, đảm bảo hệ thống chạy không lỗi và vẫn hoạt động trong thời gian giảng viên chấm điểm. Còn 5% (65,819 đã dùng / 258K)
- Nếu không thể triển khai online, một phương án thay thế là dùng docker-compose. Trong trường hợp này, bạn phải tuân theo hướng dẫn của giảng viên và template dự án được cung cấp để phát triển ứng dụng. Nộp dự án đúng định dạng sẽ cho phép giảng viên tái tạo và kiểm thử trên hệ thống của họ.

## 2.5 Ghi chú

Các mô tả ở trên không phải là đầy đủ hay mang tính định nghĩa tuyệt đối. Sinh viên phải dựa vào kinh nghiệm và thực hiện nghiên cứu bổ sung về các dịch vụ tương tự để đảm bảo triển khai tối ưu. Một tính năng chỉ được coi là hoàn thành đầy đủ khi nó hoạt động đúng như mô tả, có xử lý lỗi, tránh các lỗ hổng bảo mật nghiêm trọng và tuân thủ các best practices trong ngành thường được các dịch vụ khác áp dụng. Dưới đây là các ví dụ minh họa cách tiếp cận giúp phân biệt giữa triển khai kém và triển khai tốt hơn:
## Chia sẻ ghi chú (Sharing Notes)
- Cách tiếp cận kém: Cho phép người dùng chia sẻ ghi chú chỉ bằng cách nhập một địa chỉ email. Nếu email tồn tại trong hệ thống, người nhận sẽ thấy ghi chú được chia sẻ khi họ đăng nhập.
- Cách tiếp cận tốt hơn: Triển khai cơ chế để xác thực email được nhập, đảm bảo nó thuộc về một người dùng đã đăng ký. Ngoài ra, người nhận nên nhận được thông báo email về ghi chú được chia sẻ. Tối thiểu, cần có một thông báo nổi bật được hiển thị trong tài khoản của người nhận khi họ đăng nhập lần tiếp theo, giúp họ dễ dàng nhận thấy và truy cập ghi chú được chia sẻ.
## Ghi chú được bảo vệ bằng mật khẩu (Password-Protected Notes)
- Cách tiếp cận kém: Tạo mật khẩu bằng cách cho phép người dùng nhập mật khẩu mong muốn một lần. Tương tự, khi thay đổi mật khẩu, người dùng nhập trực tiếp mật khẩu mới. Việc tắt bảo vệ mật khẩu chỉ cần chọn một tùy chọn trong menu.
- Cách tiếp cận tốt hơn: Tăng cường bảo mật bằng cách yêu cầu người dùng nhập mật khẩu hai lần khi tạo hoặc cập nhật để đảm bảo không bị lỗi gõ. Khi thay đổi mật khẩu, người dùng phải cung cấp mật khẩu hiện tại trước, sau đó nhập mật khẩu mới hai lần. Việc tắt bảo vệ mật khẩu cần yêu cầu người dùng nhập lại mật khẩu hiện tại như một bước xác nhận cuối cùng trước khi vô hiệu hóa.
## Chi tiết ghi chú được chia sẻ (Shared Notes Details)
- Cách tiếp cận kém: Chỉ cho phép người nhận của ghi chú được chia sẻ xem nội dung mà không có bất kỳ chi tiết bổ sung nào. Chủ sở hữu ghi chú không biết ghi chú đã được chia sẻ với ai.
- Cách tiếp cận tốt hơn: Cung cấp cho chủ sở hữu ghi chú một cái nhìn tổng quan chi tiết về các ghi chú đã chia sẻ. Khi chủ sở hữu nhấp vào bất kỳ ghi chú được chia sẻ nào, họ phải thấy trạng thái chia sẻ và danh sách tất cả người nhận. Danh sách này phải bao gồm email của từng người nhận và quyền của họ (ví dụ: chỉ đọc hoặc có thể chỉnh sửa). Chủ sở hữu cũng phải có khả năng thay đổi hoặc thu hồi quyền chia sẻ từ giao diện này.

## III. HƯỚNG DẪN LẬP TRÌNH (CODING GUIDELINE)
- Nếu bạn không thể triển khai website công khai và chọn không dùng Docker Compose, bài nộp của bạn vẫn sẽ được đánh giá, nhưng bạn phải tuân thủ nghiêm ngặt các hướng dẫn cụ thể để đảm bảo giảng viên có thể chạy dự án thành công. Luôn sử dụng URL tương đối thay vì hardcode cổng và hostname cố định; ví dụ, thay <img
src="http://localhost:8080/images/phone.jpg"> bằng <img  src="images/phone.jpg"> để đảm bảo linh hoạt trên các cấu hình khác nhau. Ngoài ra, tránh đặt dự án web trong các thư mục con; thay vì phục vụ tại http://localhost:8080/final_project, hãy đảm bảo có thể truy cập trực tiếp tại http://localhost:8080/. Với những bạn dùng XAMPP, điều này có nghĩa là lưu các tệp dự án vào thư mục
htdocs
thay vì các thư mục con như htdocs/final_project. Cổng 8080 chỉ là ví dụ; bạn có thể dùng bất kỳ cổng nào, nhưng nó không được hardcode trong mã nguồn.
- Bạn được phép sử dụng bất kỳ thư viện hoặc framework nào, chẳng hạn React cho frontend hoặc Laravel cho backend, với điều kiện bạn triển khai dự án online hoặc thiết lập bằng Docker Compose để giảng viên có thể truy cập. Nếu cả hai phương án đều không khả thi, hãy kèm theo hướng dẫn rõ ràng và chi tiết trong tệp readme.txt để hướng dẫn giảng viên chạy dự án trên máy cục bộ. Tuân thủ các hướng dẫn này giúp dự án của bạn luôn có thể truy cập và đánh giá được.
## IV. BẢNG TIÊU CHÍ (RUBRIK)
## ID TIÊU CHÍ
## MỨC ĐỘ
## 1 2 3
## ĐIỂM 0 ĐIỂM 25-75% ĐIỂM ĐIỂM TỐI ĐA


Quản lý tài khoản
## 2.0

## 1
Đăng ký người dùng
## 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 2
Kích hoạt tài khoản
## 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 3
Đăng nhập và đăng xuất
## 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 4
Đặt lại mật khẩu
## 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 5
Xem hồ sơ và avatar
## 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 6
Chỉnh sửa hồ sơ và avatar
## 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 7
Đổi mật khẩu
## 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 8
Tùy chọn người dùng
## 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.

Quản lý ghi chú
đơn giản
## 4.0

## 9
Hiển thị ghi chú dạng listiew 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 10
Hiển thị ghi chú dạng gridview 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.

## 11
Tạo ghi chú 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 12
Cập nhật ghi chú 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 13
Xóa ghi chú 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 14
Tự động lưu ghi chú 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 15
Đính kèm hình ảnh vào ghi chú 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 16
Ghim ghi chú lên đầu 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 17
Tìm kiếm ghi chú 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 18
Quản lý nhãn
(liệt kê, thêm, sửa, xóa)
## 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 19
Gắn nhãn vào ghi chú 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 20
Lọc ghi chú dựa trên
nhãn
## 0.25
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.

Quản lý ghi chú
nâng cao
## 2.0

## 21
Bật và tắt
mật khẩu cho ghi chú
## 0.5
Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.

## 22
Bảo vệ mật khẩu,
đổi mật khẩu cho
ghi chú
## 0.5

Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 23 
Chia sẻ và nhận ghi chú
## 0.5

Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
## 24
Cộng tác và
chỉnh sửa thời gian thực
## 0.5

Tính năng không có
hoặc hoàn toàn không hoạt động hoặc
được làm hoàn toàn sai
Tính năng đã được triển khai nhưng
không hoạt động đúng hoặc vẫn còn
một số lỗi nghiêm trọng
Tính năng đã được triển khai đúng theo
yêu cầu, không có lỗi
hoặc chỉ có lỗi không đáng kể.
Các yêu cầu khác 2.0

## 25
UI và UX
Chấm dựa trên cảm nhận của giảng viên;
chỉ những bài làm trên mức trung bình mới có điểm (giao diện cơ bản sẽ không có điểm)
## 0.5

Thiết kế kém, UI không nhất quán,
không có phản hồi, không có hỗ trợ truy cập.
Có style cơ bản, UX không nhất quán, phản hồi
hạn chế, tuân thủ khả năng truy cập một phần.
UI được trau chuốt, UX trực quan,
phản hồi đầy đủ, hoàn toàn
đáp ứng khả năng truy cập.
## 26
## Đáp ứng
Chấm dựa trên cảm nhận của giảng viên;
chỉ những bài làm trên mức trung bình mới có điểm (giao diện cơ bản sẽ không có điểm)
## 0.5

Không thích ứng với kích thước
màn hình, phần tử lệch,
không có media queries.
Đáp ứng một phần, media queries
hạn chế, bố cục lỗi trên một số thiết bị.
Hoàn toàn đáp ứng, bố cục tối ưu,
co giãn đúng, chuyển tiếp mượt mà
trên nhiều thiết bị.
## 27 Khả năng ngoại tuyến
## 0.5

Không có chức năng offline, không
cache, không có service worker.
Truy cập offline hạn chế, cache một phần,
service worker không ổn định, lỗi khi
offline.
Truy cập offline mạnh mẽ, cache hiệu quả,
đồng bộ dữ liệu offline đúng cách.
28 Triển khai online
## 0.5

Chưa triển khai, không có kế hoạch
host hay triển khai.
Online nhưng không ổn định, hiệu năng kém,
thiếu HTTPS, tối ưu hóa tối thiểu.
Triển khai đầy đủ, an toàn (HTTPS),
tối ưu hiệu năng, có thể mở rộng,
thời gian hoạt động cao.

## V. YÊU CẦU ĐẦU RA
- Các thành phần bắt buộc khi nộp bao gồm:
o
## Rubrik.docx:
Tệp này liệt kê 28 tính năng bắt buộc cho dự án. Nhóm cần tự đánh giá mức độ hoàn thành trong tệp này.
Giảng viên sẽ cung cấp tệp này tại thời điểm nộp bài. Tệp cũng sẽ bao gồm URL công khai của ứng dụng web
và bất kỳ username/password nào cần thiết để đăng nhập.
o Thư mục "
source
":
## §
nếu bạn không dùng docker compose
: thư mục source phải chứa toàn bộ mã nguồn của ứng dụng web (ví dụ:
frontend,  backend),  cùng  với  các  tệp  cơ  sở  dữ  liệu  liên  quan.  Đảm  bảo  mã  nguồn  này  có  thể  chạy  trên  máy  của  giảng  viên.

Dự án cần được "clean" để loại bỏ nội dung không cần thiết trước khi nộp và giảm
kích thước của tệp nén.
## §
nếu bạn dùng docker compose
: Thư mục này phải chứa toàn bộ mã nguồn cho các module cần thiết, tệp docker-compose
và hướng dẫn chạy ứng dụng trên máy của giảng viên (ví dụ: chạy npm install ở đâu và docker-
compose up). Đảm bảo đã kiểm thử kỹ trước khi nộp.
o Video demo, đặt tên “
demo.mp4
” phải có sự tham gia của tất cả thành viên để giới thiệu sản phẩm của nhóm.
Video cần cung cấp tổng quan ngắn gọn về công nghệ và kiến trúc của ứng dụng web. Sau đó,
nhóm phải lần lượt trình bày từng tính năng đã phát triển theo phiếu đánh giá gồm 28 tiêu chí. Bất kỳ
tiêu chí nào không được trình bày trong video sẽ được xem như chưa triển khai, kể cả khi nhóm
tự đánh giá là đã làm trong biểu mẫu. Video phải có độ phân giải tối thiểu 1080p, âm thanh rõ
và dễ hiểu. Nếu tệp video quá lớn, nhóm nên tải lên YouTube và kèm liên kết trong bài nộp..
o
## Readme.txt
tệp: Cung cấp tất cả thông tin cần thiết cho quá trình đánh giá, chẳng hạn hướng dẫn build và chạy dự án,
URL + thông tin đăng nhập máy chủ (nếu có), và username/password cho các tài khoản có dữ liệu được nạp sẵn để chấm.
Bao gồm mọi ghi chú liên quan về việc build, chạy và sử dụng ứng dụng để giảng viên có thể tái tạo dự án.
Nếu nhóm triển khai một số tính năng tùy chọn (được cộng thêm điểm), phải ghi rõ trong tệp readme.
- Tổ chức tất cả nội dung trên vào một thư mục có tên
id1_fullname1_id2_fullname2
, sau đó nén thư mục này dưới định dạng ZIP với
cùng tên, ví dụ: id1_fullname1_id2_fullname2.zip. Một đại diện nhóm sẽ nộp tệp này lên hệ thống elearning
theo hướng dẫn của giảng viên môn học.
- Giảng viên không nhận bài nộp qua email, chỉ chấp nhận qua elearning.
- Không nộp mã nguồn, video hoặc rubrik.docx sẽ khiến toàn bộ nhóm nhận điểm 0.
- Nếu nhóm nộp một dự án không liên quan, dự án sẽ không được chấm và toàn bộ nhóm sẽ nhận điểm 0. Ví dụ, nếu
nhóm dùng mã nguồn từ một website thương mại điện tử khác và chỉ triển khai một vài tính năng liên quan đến bài này trong khi
phần lớn các tính năng không liên quan, dự án sẽ nhận 0 điểm.
- Bài Essay hoàn toàn độc lập với Đồ án Cuối kỳ. Do đó, tất cả thành viên phải tham gia cả Essay và Đồ án Cuối kỳ. Essay
sẽ được chấm bởi giảng viên lab, trong khi Đồ án Cuối kỳ sẽ được chấm bởi giảng viên lý thuyết.
- Các nhóm bị cấm chia sẻ code với nhau, lấy mã nguồn từ Internet và phải có trách nhiệm bảo vệ mã nguồn của nhóm mình. Các nhóm có mã nguồn tương tự (được xác minh bằng phần mềm chuyên dụng) hoặc code được tìm thấy online,
kể cả chỉ một phần, sẽ nhận điểm 0 cho tất cả thành viên, bất kể nhóm nào đã chia sẻ hay nhận code.

- Trừ điểm cũng áp dụng trong các trường hợp sau:
o Nộp trễ: trễ 1 ngày trừ 1 điểm. Nộp trễ từ 1 giây đến dưới 1 ngày được tính là trễ 1 ngày.
o Cấu hình dự án phức tạp nhưng không có hướng dẫn cụ thể để giảng viên có thể biên dịch và chạy chương trình: trừ 2
điểm.
o Nộp toàn bộ dự án mà không thực hiện clean để loại bỏ các tệp không cần thiết: trừ 0.5 điểm.
o Không cung cấp thông tin chấm cần thiết, chẳng hạn thiếu username/password, đặt tên tệp sai, hoặc không
nộp đủ nội dung yêu cầu: trừ 1.0 điểm.


Đừng quên liên hệ trực tiếp giảng viên hoặc qua email maivanmanh@tdtu.edu.vn để kịp thời
giải quyết bất kỳ câu hỏi hoặc băn khoăn nào liên quan đến dự án.
