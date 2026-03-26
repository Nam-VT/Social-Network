# 📋 TÀI LIỆU MÔ TẢ CHỨC NĂNG (FUNCTIONAL REQUIREMENTS OVERVIEW)

Tài liệu này cung cấp cái nhìn chi tiết về các tính năng và luồng xử lý chính trong hệ thống Mạng xã hội.

---

## 🔐 1. HỆ THỐNG XÁC THỰC (AUTHENTICATION & AUTHORIZATION)
Hệ thống hỗ trợ cơ chế đăng nhập đa phương thức và bảo mật dựa trên JWT.
- **Đăng nhập truyền thống**: Xác thực qua Username/Email và Password.
- **Google OAuth2 Login**: 
    - Người dùng đăng nhập bằng tài khoản Gmail.
    - Hệ thống tự động tạo tài khoản nếu là người dùng mới (lấy Email, Họ tên, Avatar từ Google).
- **Quản lý phiên (Session)**: Sử dụng JWT (Access Token & Refresh Token) để duy trì đăng nhập.
- **Bảo mật**: Chức năng đổi mật khẩu, quên mật khẩu qua Email.

## 👤 2. QUẢN LÝ TÀI KHOẢN & TRANG CÁ NHÂN (USER PROFILES)
- **Thiết lập hồ sơ**: Cập nhật thông tin cá nhân (Họ tên, Bio, Vị trí, Website, Ngày sinh).
- **Hình ảnh đại diện**: Upload và thay đổi Avatar, Ảnh bìa (Cover Photo).
- **Trạng thái**: Hiển thị trạng thái hoạt động và quản lý quyền riêng tư của hồ sơ.

## 📝 3. NỘI DUNG & DÒNG THỜI GIAN (POSTS & NEWS FEED)
- **Soạn thảo bài viết**: Hỗ trợ văn bản thuần túy và đính kèm nhiều tệp (Hình ảnh/Video).
- **Quyền riêng tư (Privacy)**: 
    - `PUBLIC`: Mọi người đều thấy.
    - `FRIENDS`: Chỉ bạn bè thấy.
    - `PRIVATE`: Chỉ chủ bài viết thấy.
- **News Feed**: 
    - Hiển thị bài viết từ bạn bè và bản thân.
    - Sử dụng cơ chế tải dữ liệu tối ưu (Cursor-based pagination).

## ❤️ 4. TƯƠNG TÁC & PHẢN HỒI (INTERACTIONS)
- **Reactions**: Thả cảm xúc đa dạng (Like, Love, Wow, Sad, Angry) trên bài viết và bình luận.
- **Comments**: 
    - Bình luận đa phương tiện (văn bản + ảnh).
    - Phản hồi bình luận (Threaded comments) giúp theo dõi cuộc hội thoại dễ dàng.

## 🤝 5. MẠNG LƯỚI XÃ HỘI (SOCIAL NETWORK)
- **Quản lý bạn bè**: Gửi lời mời, chấp nhận, từ chối, hủy kết bạn.
- **Chặn (Block)**: Ngăn chặn tương tác và hiển thị nội dung từ người dùng cụ thể.
- **Gợi ý kết bạn**: (Dự kiến) Gợi ý dựa trên bạn chung.

## 💬 6. TIN NHẮN THỜI GIAN THỰC (REAL-TIME MESSAGING)
- **Chat 1-1**: Trò chuyện cá nhân bí mật.
- **Group Chat**: Tạo nhóm, thêm/xóa thành viên, quản trị nhóm (Admin/Member).
- **Tính năng Chat**: Gửi tin nhắn, hình ảnh, video, hiển thị trạng thái "đã xem".

## 🔔 7. HỆ THỐNG THÔNG BÁO (NOTIFICATION SYSTEM)
- **Thông báo tương tác**: Khi có Like, Comment, Friend Request, New Message.
- **Real-time Push**: Đẩy thông báo tức thì qua WebSocket.
- **Trung tâm thông báo**: Nơi lưu trữ lịch sử và đánh dấu các thông báo đã đọc.

## 🔍 8. TÌM KIẾM THÔNG MINH (SMART SEARCH)
- **Tìm kiếm người dùng**: Theo tên, username.
- **Tìm kiếm nội dung**: Theo từ khóa trong bài viết.
- **Hiệu năng**: Tích hợp Elastic Search để tăng tốc độ truy vấn và độ chính xác (Fuzzy search).

## 📸 9. TÍNH NĂNG STORY (KHOẢNH KHẮC)
- **Đăng Story**: Cho phép người dùng đăng hình ảnh hoặc video ngắn làm tin.
- **Thời gian tồn tại**: Story tự động biến mất/ẩn sau 24 giờ kể từ khi đăng.
- **Người xem Story**: Chủ Story có thể xem danh sách những người đã xem tin của mình.
- **Tương tác nhanh**: Cho phép người xem thả cảm xúc hoặc phản hồi tin nhắn trực tiếp qua Story.

---
*Tài liệu được cập nhật ngày: 25/03/2026*
