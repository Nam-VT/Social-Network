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
- [x] **Xem bài viết**: API `GET /api/posts/{id}` và `GET /api/posts/user/{username}` (Hỗ trợ Visibility).
- [x] **Sửa/Xóa bài viết**: API `PUT /api/posts/{id}` và `DELETE /api/posts/{id}` (chỉ chủ bài viết).
- [x] **Quản lý quyền riêng tư**: Hỗ trợ `PUBLIC`, `FRIENDS`, `PRIVATE` (field `Visibility`).
- [x] **News Feed**: API `GET /api/posts/feed` (Cursor-based pagination).
    - [x] Đã tích hợp logic lọc News Feed theo **Friendship + Visibility**.
- [ ] **Upload Media**.
    - 🖥️ **Local**: Hiện tại chấp nhận URL trực tiếp.
    - 🚀 **Deploy**: Cần tích hợp Cloudinary / AWS S3.

---

## ❤️ 5. TƯƠNG TÁC (INTERACTIONS)
- [x] **Reactions** (Like, Love, Wow...). Hỗ trợ cả Post và Comment.
- [x] **Comments** (Đa phương tiện, Threaded).

---

## 🤝 6. BẠN BÈ & THEO DÕI (SOCIAL & FOLLOW)
- [x] **Lời mời kết bạn**: API Gửi, Nhận, Huỷ, Xoá bạn bè, và Danh sách bạn bè.
- [x] **Quyền riêng tư (Friend List Visibility)**: API cập nhật quyền hiển thị danh sách bạn bè (PUBLIC, FRIENDS, PRIVATE).
- [x] **Chặn người dùng (Block)**: Tích hợp bảo mật chặn chéo xem Profile, đọc News Feed và chặn chat.
- [x] **Gợi ý bạn bè**: Giải thuật đếm Mutual Friends sử dụng Native SQL Query.
- [x] **Hệ thống Theo dõi (Follow)**: Khác với kết bạn (2 chiều), hỗ trợ theo dõi 1 chiều (như Follow FB/Insta).
    - [x] Cấu trúc Entity `Follow`. Quyền riêng tư `allowPublicFollowers` (Public/Private Account).
    - [x] Auto-Follow khi kết bạn thành công, Auto-Unfollow khi Unfriend hoặc Block.
    - [x] News Feed tích hợp lấy bài của người đang theo dõi.

---

## 💬 7. TIN NHẮN (MESSAGING)
- [x] **Chat 1-1** (Tự động khởi tạo khi reply Story).
- [x] **Inbox Management**: Sắp xếp theo tin nhắn mới nhất, theo dõi `unreadCount`.
- [x] **Messenger Real-time Push**: Đẩy độc lập `ChatNotificationPayload` qua kênh WebSocket `/queue/chat` phục vụ giật Popup Messenger (Tách biệt hoàn toàn khỏi Notification chuông).
- [ ] **Group Chat**.

---

## 🔔 8. THÔNG BÁO (NOTIFICATIONS)
- [x] **Thông báo tương tác** (Like, Comment, Friend Request, Follow).
- [x] **Gộp thông báo (Deduplication) chống Spam**: Lọc chặn tạo rác trên DB dựa trên truy vấn gom `targetId`.
- [x] **Thông báo thời gian thực**: Cắm `SimpMessagingTemplate` STOMP bắn DTO (đã lọc Password Actor) thẳng vào kênh `/queue/notifications`.
- [x] **Lịch sử thông báo**.

---

## 🔍 9. TÌM KIẾM (SEARCH)
- [x] **Tìm kiếm người dùng**: API `GET /api/search/users?q=keyword` (ElasticSearch, lọc Block).
- [x] **Tìm kiếm bài viết**: API `GET /api/search/posts?q=keyword` (ElasticSearch, lọc Block + Visibility).
- [x] **Auto-Indexing**: Tự động đồng bộ ES khi Create/Update/Delete Post. Kafka Consumer `search-indexing` hỗ trợ indexing bất đồng bộ.

---

## 🎞️ 10. STORIES
- [x] **Tạo Story**: API `POST /api/stories` (Hỗ trợ MediaType IMAGE, VIDEO, TEXT).
- [x] **Story Reaction & Reply**: Phản hồi story tự động chuyển thành tin nhắn riêng.
- [x] **Story Insights**: Chủ story xem được ai đã xem và thả cảm xúc.
