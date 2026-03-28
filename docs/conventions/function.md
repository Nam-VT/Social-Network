# 🚀 TRẠNG THÁI PHÁT TRIỂN TÍNH NĂNG (FEATURE PROGRESS)

Tài liệu này theo dõi tiến độ thực hiện các chức năng dựa trên `functional-requirements.md`.

---

## 🔐 1. HỆ THỐNG XÁC THỰC (AUTHENTICATION)
- [x] **Đăng nhập truyền thống**: API `/api/auth/signin` hỗ trợ Username/Password.
- [x] **Đăng ký tài khoản**: API `/api/auth/signup` với Validation đầy đủ.
- [x] **Google OAuth2 Login**: Tích hợp callback, tự động tạo tài khoản và trả về JWT.
- [x] **Bảo mật JWT**: 
    - [x] Phát hành Access Token.
    - [x] `JwtAuthenticationFilter` kiểm tra quyền mỗi request.
- [x] **Refresh Token**: API `/api/auth/refresh-token` cấp Access Token mới từ Refresh Token (7 ngày).
- [x] **Đổi mật khẩu**: API `/api/auth/change-password` (yêu cầu đăng nhập).
- [x] **Quên mật khẩu**: API `/api/auth/forgot-password` + `/api/auth/reset-password`.
    - 🖥️ **Local**: Link reset password được log ra Console/Terminal.
    - 🚀 **Deploy**: Cần cấu hình SMTP Gmail trong `application-prod.yaml` (xem `setup-dev-guide.md`).

---

## 🏗️ 2. HẠ TẦNG HỆ THỐNG (INFRASTRUCTURE)
- [x] **Cấu hình Security**: Spring Security, CORS, Stateless session.
- [x] **Message Broker (Kafka)**: Thiết lập 5 topics (`chat-messages`, `notifications`, `post-activities`, `search-indexing`, `default`).
- [x] **Real-time (WebSocket)**: Endpoint `/ws` với STOMP broker.
- [x] **Search Engine (ElasticSearch)**: Cấu hình kết nối tới server ES.
- [x] **Xử lý lỗi tập trung**: `GlobalExceptionHandler` + `ErrorCode` enum.
- [x] **Chuẩn phản hồi**: `ApiResponse<T>` wrapper cho toàn bộ hệ thống.

---

## 👤 3. QUẢN LÝ TÀI KHOẢN (USER PROFILES)
- [x] **Xem thông tin cá nhân**: API `GET /api/users/me` (bản thân) và `GET /api/users/{username}` (người khác).
- [x] **Cập nhật Profile**: API `PUT /api/users/me` (Bio, Vị trí, Website, Ngày sinh, Giới tính).
- [ ] **Upload Avatar/Cover Photo**.
    - 🖥️ **Local**: Hiện tại chấp nhận URL ảnh trực tiếp.
    - 🚀 **Deploy**: Cần tích hợp dịch vụ lưu trữ file (Cloudinary / AWS S3).

---

## 📝 4. BÀI VIẾT & NEWS FEED (POSTS)
- [x] **Đăng bài viết**: API `POST /api/posts` (Text + danh sách Media URL).
- [x] **Xem bài viết**: API `GET /api/posts/{id}` và `GET /api/posts/user/{username}`.
- [x] **Sửa/Xóa bài viết**: API `PUT /api/posts/{id}` và `DELETE /api/posts/{id}` (chỉ chủ bài viết).
- [x] **Quản lý quyền riêng tư**: Hỗ trợ `PUBLIC`, `FRIENDS`, `PRIVATE` (field `Visibility`).
- [x] **News Feed**: API `GET /api/posts/feed` (Cursor-based pagination).
    - 🖥️ **Local**: Trả tất cả bài viết (chưa lọc theo bạn bè/Visibility).
    - 🚀 **Deploy**: Cần bổ sung logic lọc theo Friendship + Visibility.
- [ ] **Upload Media**.
    - 🖥️ **Local**: Hiện tại chấp nhận URL trực tiếp.
    - 🚀 **Deploy**: Cần tích hợp Cloudinary / AWS S3.

---

## ❤️ 5. TƯƠNG TÁC (INTERACTIONS)
- [ ] **Reactions** (Like, Love, Wow...).
- [ ] **Comments** (Đa phương tiện, Threaded).

---

## 🤝 6. BẠN BÈ (SOCIAL)
- [ ] **Lời mời kết bạn**.
- [ ] **Chặn người dùng**.
- [ ] **Gợi ý bạn bè**.

---

## 💬 7. TIN NHẮN (MESSAGING)
- [ ] **Chat 1-1**.
- [ ] **Group Chat**.

---

## 🔔 8. THÔNG BÁO (NOTIFICATIONS)
- [ ] **Thông báo thời gian thực** (WebSocket).
- [ ] **Lịch sử thông báo**.

---

## 🔍 9. TÌM KIẾM (SEARCH)
- [ ] **Tìm kiếm người dùng/bài viết** (ES).

---

*Ghi chú: [x] là đã hoàn thành, [ ] là đang đợi triển khai.*
