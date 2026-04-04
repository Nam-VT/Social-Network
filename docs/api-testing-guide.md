# 📬 API Testing Guide - Social Network (Postman)

> **Base URL:** `http://localhost:8080`
> **Content-Type:** `application/json`

## 🔑 Thiết lập Postman

### Biến môi trường (Environment Variables)
| Variable | Value |
|---|---|
| `base_url` | `http://localhost:8080` |
| `token` | *(tự động set sau khi login)* |

### Header mặc định cho API cần xác thực
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Script tự động lưu Token (đặt trong tab **Tests** của request Login/Signup)
```javascript
var jsonData = pm.response.json();
if (jsonData.data && jsonData.data.token) {
    pm.environment.set("token", jsonData.data.token);
    pm.environment.set("refreshToken", jsonData.data.refreshToken);
}
```

---

## 1. 🔐 AUTH (`/api/auth`)

### 1.1 Đăng ký
```
POST {{base_url}}/api/auth/signup
```
```json
{
    "username": "testuser01",
    "password": "Test@1234",
    "email": "testuser01@gmail.com",
    "fullName": "Test User 01"
}
```
**Response:** `201` - Trả về `token`, `refreshToken`, `username`, `email`.

---

### 1.2 Đăng nhập
```
POST {{base_url}}/api/auth/signin
```
```json
{
    "username": "testuser01",
    "password": "Test@1234"
}
```
**Response:** `200` - Trả về `token`, `refreshToken`.

> [!TIP]
> Sau khi đăng nhập, copy `token` vào biến `{{token}}` hoặc dùng script tự động ở trên.

---

### 1.3 Refresh Token
```
POST {{base_url}}/api/auth/refresh-token
```
```json
{
    "refreshToken": "{{refreshToken}}"
}
```

---

### 1.4 Đổi mật khẩu 🔒
```
POST {{base_url}}/api/auth/change-password
Authorization: Bearer {{token}}
```
```json
{
    "currentPassword": "Test@1234",
    "newPassword": "NewPass@5678"
}
```

---

### 1.5 Quên mật khẩu
```
POST {{base_url}}/api/auth/forgot-password
```
```json
{
    "email": "testuser01@gmail.com"
}
```
> [!NOTE]
> Local: cần chạy MailHog để nhận email. Hoặc check console log.

---

### 1.6 Đặt lại mật khẩu
```
POST {{base_url}}/api/auth/reset-password
```
```json
{
    "token": "<reset-token-from-email>",
    "newPassword": "ResetPass@9999"
}
```

---

## 2. 👤 USER (`/api/users`)

### 2.1 Xem profile của tôi 🔒
```
GET {{base_url}}/api/users/me
Authorization: Bearer {{token}}
```

---

### 2.2 Cập nhật profile 🔒
```
PUT {{base_url}}/api/users/me
Authorization: Bearer {{token}}
```
```json
{
    "fullName": "Nguyen Van A Updated",
    "bio": "Hello world!",
    "avatarUrl": "https://example.com/avatar.jpg",
    "coverUrl": "https://example.com/cover.jpg",
    "phone": "0987654321",
    "dateOfBirth": "2000-01-15"
}
```

---

### 2.3 Xem profile người khác
```
GET {{base_url}}/api/users/{username}
```
**Ví dụ:** `GET {{base_url}}/api/users/testuser01`

---

## 3. 📝 POST (`/api/posts`)

### 3.1 Tạo bài viết 🔒
```
POST {{base_url}}/api/posts
Authorization: Bearer {{token}}
```
```json
{
    "content": "Đây là bài viết đầu tiên của tôi!",
    "mediaUrl": "https://example.com/image.jpg",
    "mediaType": "IMAGE",
    "visibility": "PUBLIC"
}
```
**Enum `mediaType`:** `IMAGE`, `VIDEO`, `TEXT`
**Enum `visibility`:** `PUBLIC`, `FRIENDS`, `PRIVATE`

---

### 3.2 Xem bài viết
```
GET {{base_url}}/api/posts/{postId}
```
**Ví dụ:** `GET {{base_url}}/api/posts/1`

---

### 3.3 Cập nhật bài viết 🔒
```
PUT {{base_url}}/api/posts/{postId}
Authorization: Bearer {{token}}
```
```json
{
    "content": "Nội dung đã cập nhật!",
    "mediaUrl": "https://example.com/new-image.jpg",
    "mediaType": "IMAGE",
    "visibility": "FRIENDS"
}
```

---

### 3.4 Xóa bài viết 🔒
```
DELETE {{base_url}}/api/posts/{postId}
Authorization: Bearer {{token}}
```

---

### 3.5 Xem bài viết của một user
```
GET {{base_url}}/api/posts/user/{username}
```

---

### 3.6 News Feed (Phân trang cursor-based)
```
GET {{base_url}}/api/posts/feed?size=10
GET {{base_url}}/api/posts/feed?cursor=2026-03-31T12:00:00&size=10
```
> `cursor` là timestamp ISO-8601 của bài cuối cùng trong lần load trước.

---

## 4. ❤️ INTERACTIONS (`/api`)

### 4.1 Thả cảm xúc (Reaction) 🔒
```
POST {{base_url}}/api/reactions
Authorization: Bearer {{token}}
```
```json
{
    "targetId": 1,
    "targetType": "POST",
    "reactionType": "HEART"
}
```
**Enum `targetType`:** `POST`, `COMMENT`
**Enum `reactionType`:** `LIKE`, `HEART`, `WOW`, `SAD`, `ANGRY`

> [!TIP]
> Gọi lại cùng `targetId` + `targetType` + `reactionType` sẽ **gỡ reaction** (toggle).
> Đổi `reactionType` khác sẽ **chuyển loại cảm xúc**.

---

### 4.2 Bình luận 🔒
```
POST {{base_url}}/api/comments
Authorization: Bearer {{token}}
```

**Comment cấp 1 (gốc):**
```json
{
    "postId": 1,
    "content": "Bài viết hay quá!",
    "mediaUrl": null
}
```

**Comment trả lời (threaded):**
```json
{
    "postId": 1,
    "parentId": 5,
    "content": "Mình đồng ý với bạn!",
    "mediaUrl": "https://example.com/reply-img.jpg"
}
```

---

### 4.3 Xem bình luận của bài viết
```
GET {{base_url}}/api/posts/{postId}/comments
```
**Ví dụ:** `GET {{base_url}}/api/posts/1/comments`
> Trả về danh sách comment cấp 1 (sắp xếp mới nhất trước).

---

## 5. 🎞️ STORIES (`/api/stories`)

### 5.1 Thả cảm xúc vào Story 🔒
```
POST {{base_url}}/api/stories/{storyId}/react?type=LOVE
Authorization: Bearer {{token}}
```
**Enum `type`:** `LIKE`, `HEART`, `WOW`, `SAD`, `ANGRY`

---

### 5.2 Phản hồi Story qua tin nhắn riêng 🔒
```
POST {{base_url}}/api/stories/{storyId}/reply
Authorization: Bearer {{token}}
```
```json
{
    "content": "Story đẹp quá!",
    "mediaUrl": null
}
```
> [!IMPORTANT]
> Phản hồi sẽ tự động tạo/mở cuộc chat riêng (Private) giữa bạn và chủ story.

---

## 6. 💬 CHAT / MESSAGING (`/api/chat`)

### 6.1 Xem Inbox (Danh sách cuộc trò chuyện) 🔒
```
GET {{base_url}}/api/chat/inbox
Authorization: Bearer {{token}}
```
**Response:** Danh sách `ChatRoomResponse` (sắp xếp theo tin nhắn mới nhất), kèm `unreadCount`.

---

### 6.2 Xem tin nhắn trong phòng 🔒
```
GET {{base_url}}/api/chat/rooms/{roomId}/messages
Authorization: Bearer {{token}}
```
> [!NOTE]
> Khi gọi API này, `unreadCount` của bạn trong phòng sẽ tự động reset về 0.

---

### 6.3 Gửi tin nhắn 🔒
```
POST {{base_url}}/api/chat/rooms/{roomId}/messages
Authorization: Bearer {{token}}
```
```json
{
    "content": "Xin chào!",
    "mediaUrl": null,
    "mediaType": null
}
```
**Gửi hình ảnh:**
```json
{
    "content": "Xem ảnh này nè",
    "mediaUrl": "https://example.com/photo.jpg",
    "mediaType": "IMAGE"
}
```

---

## 7. 🔔 NOTIFICATIONS (`/api/notifications`)

### 7.1 Xem danh sách thông báo 🔒
```
GET {{base_url}}/api/notifications
Authorization: Bearer {{token}}
```
**Response:** Danh sách `NotificationResponse` (sắp xếp mới nhất trước).

---

### 7.2 Đánh dấu đã đọc 🔒
```
PUT {{base_url}}/api/notifications/{id}/read
Authorization: Bearer {{token}}
```

---

## 📋 Luồng Test Đề Xuất

### Luồng 1: Auth + Profile cơ bản
```
1. POST /api/auth/signup (tạo user A)
2. POST /api/auth/signup (tạo user B)
3. POST /api/auth/signin (đăng nhập user A → lấy token)
4. GET  /api/users/me (xem profile A)
5. PUT  /api/users/me (cập nhật profile A)
6. GET  /api/users/userB (xem profile B)
```

### Luồng 2: Post + Interactions
```
1. POST /api/auth/signin (đăng nhập A → token A)
2. POST /api/posts (tạo bài viết)
3. POST /api/auth/signin (đăng nhập B → token B)
4. POST /api/reactions (B thả ❤️ bài của A)
5. POST /api/comments (B bình luận)
6. POST /api/comments (A trả lời bình luận của B - threaded)
7. GET  /api/posts/1/comments (xem comment)
8. GET  /api/notifications (A xem thông báo → thấy "B đã thích bài viết")
```

### Luồng 3: Story → Chat
```
1. Tạo Story trong DB (hiện chưa có API tạo Story)
2. POST /api/stories/1/react?type=LOVE (B thả tim story A)
3. POST /api/stories/1/reply (B phản hồi story A → tự tạo chat room)
4. GET  /api/chat/inbox (B xem inbox → thấy chat room mới)
5. GET  /api/chat/rooms/{roomId}/messages (xem tin nhắn)
6. POST /api/chat/rooms/{roomId}/messages (A gửi tin nhắn trả lời)
7. GET  /api/notifications (A xem thông báo → gộp thông báo tin nhắn)
```

### Luồng 4: Messaging stress test (Deduplication)
```
1. B gửi 5 tin nhắn liên tiếp cho A
2. GET /api/notifications (A xem) → chỉ thấy 1 thông báo unread từ B
3. PUT /api/notifications/{id}/read → đánh dấu đã đọc
```

---

## 📌 Enum Reference

| Enum | Values |
|---|---|
| `ReactionType` | `LIKE`, `HEART`, `WOW`, `SAD`, `ANGRY` |
| `TargetType` | `POST`, `COMMENT`, `CHAT_ROOM`, `USER` |
| `MediaType` | `IMAGE`, `VIDEO`, `TEXT` |
| `NotificationType` | `LIKE_POST`, `LIKE_COMMENT`, `COMMENT`, `FRIEND_REQ`, `NEW_MSG` |
| `RoomType` | `PRIVATE`, `GROUP` |

---

## ⚠️ Chưa triển khai (Backlog)
- [ ] API tạo/xóa Story
- [ ] Friendships (Gửi/Chấp nhận/Chặn)
- [ ] Group Chat
- [ ] Search (ElasticSearch)
- [ ] WebSocket real-time notifications
- [ ] File upload (Cloudinary/S3)

---

*Ghi chú: 🔒 = Cần JWT Token trong header `Authorization: Bearer {{token}}`*
