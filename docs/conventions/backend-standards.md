# 📘 BACKEND DEVELOPMENT STANDARDS & BEST PRACTICES

Tài liệu này quy định các tiêu chuẩn kỹ thuật chung nhằm đảm bảo tính nhất quán, hiệu năng và bảo mật cho phần Backend của dự án.

---

## 🏗️ 1. KIẾN TRÚC HỆ THỐNG (ARCHITECTURE)
Hệ thống tuân thủ cấu trúc thư mục được quy định tại `be_architecture.txt`:
- `config/`: Cấu hình hệ thống (Security, WebSocket, ElasticSearch, Kafka).
- `controller/`: Điểm tiếp nhận request từ Client.
- `service/`: Xử lý logic nghiệp vụ (triển khai trực tiếp trong class, không cần interface/impl nếu không cần thiết).
- `repository/`: Truy vấn MySQL (JPA).
- `search/`: Truy vấn ElasticSearch.
- `entity/`: Ánh xạ trực tiếp với bảng trong MySQL.
- `dto/`: Bao gồm `request/` (validate đầu vào) và `response/` (định dạng đầu ra).
- `security/`: Xử lý bảo mật, JWT.
- `exception/`: Xử lý lỗi tập trung.
- `util/`: Các hàm bổ trợ.
- `enums/`: Các enum sử dụng trong hệ thống.

---

## 🚦 2. RESTFUL API & NAMING CONVENTIONS
- **URL**: Sử dụng danh từ số nhiều, phân tách bằng kebab-case. 
    - Base Path: `/api` (Ví dụ: `/api/users`, `/api/posts`).
    - **Không sử dụng versioning** (không dùng `v1`, `v2`) trong URL.
- **HTTP Methods**: Sử dụng đúng mục đích (GET, POST, PUT, PATCH, DELETE).

---

## 📦 3. CẤU TRÚC PHẢN HỒI (API RESPONSE)
Tất cả API phải trả về định dạng thống nhất thông qua `ApiResponse<T>`:

```java
public class ApiResponse<T> {
    private int status;            // HTTP Status Code
    private String message;        // Thông báo cho người dùng
    private T data;                // Dữ liệu trả về (Object hoặc List)
    private LocalDateTime timestamp;
}
```

---

## 🔐 4. BẢO MẬT & XÁC THỰC (SECURITY)
- **JWT (JSON Web Token)**: Cơ chế xác thực chính.
- **Spring Security**: Cấu hình lọc request, phân quyền và Cors.
- **Google OAuth2**: Tích hợp đăng nhập Gmail.
- **Password Hashing**: Sử dụng `BCryptPasswordEncoder`.

---

## 🛠️ 5. TIÊU CHUẨN CODE (CODING STANDARDS)
- **Lombok**: Sử dụng tối đa `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Slf4j`.
- **Validation**: Kiểm tra dữ liệu đầu vào bằng `jakarta.validation`.
- **Mapping (Entity & DTO)**: 
    - **Sử dụng thủ công các hàm get/set** để chuyển đổi giữa Entity và DTO.
    - **Không sử dụng** các thư viện mapping tự động như MapStruct.
- **Exception Handling**: Sử dụng `@RestControllerAdvice` để trả về lỗi định dạng `ApiResponse` chuẩn.

---

## ⚡ 6. HIỆU NĂNG & ĐỒNG BỘ DỮ LIỆU
- **Database (MySQL)**: 
    - Tên bảng/cột dùng `snake_case`. Hỗ trợ Auditing (`created_at`, `updated_at`).
- **Elastic Search (ES)**: Phục vụ tìm kiếm Full-text search tốc độ cao.
- **Pagination**: Sử dụng Cursor-based pagination cho News Feed và Chat.
- **Message Broker (Kafka)**: 
    - Sử dụng **Kafka** để xử lý hàng đợi và đồng bộ dữ liệu không đồng bộ giữa các thành phần hệ thống (ví dụ: gửi thông báo, đẩy dữ liệu sang ES).

---

## 📡 7. GIAO TIẾP THỜI GIAN THỰC (REAL-TIME)
- **WebSocket (STOMP)**: Xử lý chat và thông báo thời gian thực.
- **Kafka Integration**: Kết hợp Kafka để phân phối tin nhắn hiệu quả trong các cụm server.

---

**Ghi chú cho AI & Developer:** *Tuân thủ nghiêm ngặt cấu trúc thư mục và các quy định về mapping/versioning. Hãy đọc kỹ `be_architecture.txt` trước khi viết code.*