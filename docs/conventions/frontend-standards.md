## 1. Naming Convention & Cấu trúc Thư mục
- **Component File:** `PascalCase.jsx` (VD: `PostCard.jsx`, `NavBar.jsx`).
- **Hook Custom:** Bắt đầu bằng chữ `use` + `camelCase` (VD: `useInfiniteScroll.js`, `useWebSocket.js`).
- **Absolute Import:** Cấu hình Vite/Webpack để import từ gốc (VD: `import Button from '@/components/Button'`), cấm dùng relative path dài dòng `../../../../components/Button`.

## 2. Phân tách Trách nhiệm (Single Responsibility)
- **Smart Components (Pages/Containers):** Chịu trách nhiệm gọi API, quản lý State phức tạp, tương tác Redux.
- **Dumb Components (UI Components):** Chỉ nhận `props` và render giao diện (VD: Nút bấm, Avatar, Form input). Không chứa logic gọi API.

## 3. Quản lý State (Trạng thái)
- **Global State (Redux Toolkit):** Chỉ lưu thông tin User đang đăng nhập, Access Token, Theme (Dark/Light mode), hoặc Dữ liệu thông báo (Notification socket).
- **Local State (useState/useReducer):** Dùng cho các trạng thái đóng/mở Modal, nội dung đang gõ trong ô Input, trạng thái Loading của một nút bấm.

## 4. Quy chuẩn Giao tiếp API & Token
- Gom toàn bộ API vào thư mục `src/services/`.
- **Axios Interceptor:** - Mọi Request gửi đi tự động đính kèm `Bearer {accessToken}`.
  - Mọi Response lỗi `401 Unauthorized` sẽ tự động kích hoạt tiến trình gọi API `/refresh-token` một cách ngầm định, sau đó gửi lại request cũ để UX không bị gián đoạn.

## 5. Hiệu năng (Performance)
- Các danh sách dài (News Feed, Danh sách bạn bè) phải tích hợp kỹ thuật **Infinite Scroll** kết hợp với **Virtualization** (nếu DOM quá lớn) để tránh lag trình duyệt.
- Xử lý debounce/throttle cho các sự kiện gõ tìm kiếm (Search) hoặc cuộn chuột (Scroll).