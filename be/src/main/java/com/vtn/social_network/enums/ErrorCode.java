package com.vtn.social_network.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    // Success
    SUCCESS(200, "Thành công"),
    CREATED(201, "Tạo thành công"),

    // Authentication & Authorization
    UNAUTHENTICATED(401, "Chưa xác thực"),
    UNAUTHORIZED(403, "Không có quyền truy cập"),
    BAD_CREDENTIALS(401, "Sai tên đăng nhập hoặc mật khẩu"),
    INVALID_TOKEN(401, "Token không hợp lệ"),
    TOKEN_EXPIRED(401, "Token đã hết hạn"),
    WRONG_PASSWORD(400, "Mật khẩu hiện tại không đúng"),

    // User
    USER_NOT_FOUND(404, "Không tìm thấy người dùng"),
    USERNAME_ALREADY_EXISTS(400, "Username đã tồn tại"),
    EMAIL_ALREADY_EXISTS(400, "Email đã được sử dụng"),
    USER_NOT_ACTIVE(403, "Tài khoản chưa được kích hoạt"),

    // Post
    POST_NOT_FOUND(404, "Không tìm thấy bài viết"),

    // Validation
    INVALID_INPUT(400, "Dữ liệu đầu vào không hợp lệ"),

    // Server
    INTERNAL_ERROR(500, "Đã xảy ra lỗi hệ thống");

    private final int status;
    private final String message;
}
