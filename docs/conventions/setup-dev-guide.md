# 🛠️ HƯỚNG DẪN CẤU HÌNH MÔI TRƯỜNG DEV (SETUP GUIDE)

Tài liệu này hướng dẫn cách điền các thông số trong file `application-dev.yaml` để chạy dự án ở môi trường local.

---

## 1. Cơ sở dữ liệu (MySQL)
- **url**: `jdbc:mysql://localhost:3306/social_network?createDatabaseIfNotExist=true`
    - Đổi `localhost:3306` nếu bạn dùng port khác.
    - Dự án sẽ tự động tạo DB `social_network` nếu chưa có.
- **username**: Tài khoản MySQL của bạn (mặc định thường là `root`).
- **password**: Mật khẩu MySQL của bạn.

## 2. Message Broker (Kafka)
- **bootstrap-servers**: `localhost:9092`
    - Cần cài đặt Kafka và chạy Zookeeper + Kafka Server trước khi start Backend.
    - Các topic sẽ được tự động tạo dựa trên cấu hình trong `KafkaConfig.java`.

## 3. Search Engine (ElasticSearch)
- **uris**: `http://localhost:9200`
    - Cần cài đặt và chạy ElasticSearch server (phiên bản 8.x được khuyến nghị).

## 4. Google OAuth2 (Đăng nhập Google)
Để lấy các thông số này:
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo một Project mới.
3. Vào **APIs & Services > Credentials**.
4. Tạo **OAuth 2.0 Client ID** (chọn loại Web Application).
5. Thêm `http://localhost:8080/login/oauth2/code/google` vào **Authorized redirect URIs**.
6. Copy **Client ID** và **Client Secret** dán vào:
    - `client-id`: Dán ID vào đây.
    - `client-secret`: Dán Secret vào đây.

## 5. Cấu hình Email (Mail)
Hệ thống hỗ trợ 2 chế độ:

### A. Chế độ Test Local (Khuyên dùng)
- Giữ nguyên `host: localhost` và `port: 1025`.
- **Kết quả**: Email sẽ **không gửi đi thật** mà sẽ được in link Reset Password trực tiếp ra **Console/Terminal** của IDE để bạn copy và test.

### B. Chế độ Gửi Email thật (Dùng Gmail)
Nếu muốn test gửi mail thật qua Gmail:
- `host: smtp.gmail.com`
- `port: 587`
- `username`: Email của bạn.
- `password`: **App Password** (Lấy từ Google Account > Security > 2-Step Verification > App Passwords).
- `properties.mail.smtp.auth`: `true`
- `properties.mail.smtp.starttls.enable`: `true`

## 6. Bảo mật JWT
- **secret**: Một chuỗi ký tự dài và ngẫu nhiên (Base64). Bạn có thể giữ nguyên chuỗi mặc định khi dev.
- **expiration**: Thời gian hết hạn của Access Token (ms). Mặc định là 24h.
- **refresh-expiration**: Thời gian hết hạn của Refresh Token (ms). Mặc định là 7 ngày.

---
*Lưu ý: Đừng bao giờ commit Client Secret hoặc Mật khẩu thật lên GitHub (File này đã được đưa vào .gitignore hoặc chỉ nên dùng cho môi trường local).*
