package com.vtn.social_network.controller;

import com.vtn.social_network.dto.auth.request.*;
import com.vtn.social_network.dto.auth.response.AuthResponse;
import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.repository.UserRepository;
import com.vtn.social_network.service.AuthService;
import com.vtn.social_network.service.UserActivityLogService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

        private final AuthService authService;
        private final UserActivityLogService activityLogService;
        private final UserRepository userRepository;

        @Value("${jwt.refresh-expiration}")
        private long refreshExpiration;

        @PostMapping("/signup")
        public ResponseEntity<ApiResponse<AuthResponse>> signup(@Valid @RequestBody RegisterRequest request) {
                AuthResponse data = authService.register(request);
                return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                                .status(ErrorCode.CREATED.getStatus())
                                .message(ErrorCode.CREATED.getMessage())
                                .data(data)
                                .build());
        }

        @PostMapping("/signin")
        public ResponseEntity<ApiResponse<AuthResponse>> signin(
                        @Valid @RequestBody LoginRequest request,
                        HttpServletRequest httpRequest,
                        HttpServletResponse httpResponse) {
                AuthResponse data = authService.login(request);

                // Ghi log đăng nhập thành công
                userRepository.findByUsername(request.getUsername())
                                .ifPresent(user -> activityLogService.logActivity(user, "LOGIN",
                                                getClientIp(httpRequest),
                                                httpRequest.getHeader("User-Agent"),
                                                "Đăng nhập thành công"));

                // Đặt Refresh Token vào HttpOnly Cookie thay vì trả trong JSON
                addRefreshTokenCookie(httpResponse, data.getRefreshToken());
                data.setRefreshToken(null); // Không trả refreshToken trong body nữa

                return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        @PostMapping("/refresh-token")
        public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
                        @CookieValue(name = "refreshToken", required = false) String refreshToken,
                        HttpServletResponse httpResponse) {
                if (refreshToken == null || refreshToken.isBlank()) {
                        throw new RuntimeException(ErrorCode.INVALID_TOKEN.getMessage());
                }

                AuthResponse data = authService.refreshToken(refreshToken);

                // Cấp Cookie mới chứa Refresh Token mới
                addRefreshTokenCookie(httpResponse, data.getRefreshToken());
                data.setRefreshToken(null); // Không trả refreshToken trong body

                return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        @PostMapping("/logout")
        public ResponseEntity<ApiResponse<Object>> logout(HttpServletResponse httpResponse) {
                // Xóa Cookie refreshToken bằng cách set maxAge = 0
                Cookie cookie = new Cookie("refreshToken", "");
                cookie.setHttpOnly(true);
                cookie.setSecure(true);
                cookie.setPath("/api/auth");
                cookie.setMaxAge(0);
                httpResponse.addCookie(cookie);

                return ResponseEntity.ok(ApiResponse.<Object>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đăng xuất thành công")
                                .build());
        }

        @PostMapping("/change-password")
        public ResponseEntity<ApiResponse<Object>> changePassword(
                        Authentication authentication,
                        @Valid @RequestBody ChangePasswordRequest request,
                        HttpServletRequest httpRequest) {
                authService.changePassword(authentication.getName(), request);

                // Ghi log đổi mật khẩu
                userRepository.findByUsername(authentication.getName())
                                .ifPresent(user -> activityLogService.logActivity(user, "CHANGE_PASSWORD",
                                                getClientIp(httpRequest),
                                                httpRequest.getHeader("User-Agent"),
                                                "Đã đổi mật khẩu"));

                return ResponseEntity.ok(ApiResponse.<Object>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đổi mật khẩu thành công")
                                .build());
        }

        @PostMapping("/forgot-password")
        public ResponseEntity<ApiResponse<Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
                authService.forgotPassword(request);
                return ResponseEntity.ok(ApiResponse.<Object>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Link đặt lại mật khẩu đã được gửi tới email của bạn")
                                .build());
        }

        @PostMapping("/reset-password")
        public ResponseEntity<ApiResponse<Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
                authService.resetPassword(request);
                return ResponseEntity.ok(ApiResponse.<Object>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đặt lại mật khẩu thành công")
                                .build());
        }

        @GetMapping("/verify-email")
        public ResponseEntity<ApiResponse<Object>> verifyEmail(@RequestParam String token) {
                authService.verifyEmail(token);
                return ResponseEntity.ok(ApiResponse.<Object>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Xác thực email thành công, bạn có thể đăng nhập")
                                .build());
        }

        @PostMapping("/resend-verification")
        public ResponseEntity<ApiResponse<Object>> resendVerification(
                        @Valid @RequestBody ResendVerificationRequest request) {
                authService.resendVerification(request.getEmail());
                return ResponseEntity.ok(ApiResponse.<Object>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Email xác thực đã được gửi lại")
                                .build());
        }

        // ===== Helper =====

        /**
         * Tạo HttpOnly Cookie chứa Refresh Token.
         * - HttpOnly: Javascript không thể đọc được (chống XSS).
         * - Secure: Chỉ gửi qua HTTPS (chống nghe lén).
         * - Path=/api/auth: Cookie chỉ đính kèm khi gọi API auth (giảm diện tích tấn công).
         */
        private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
                Cookie cookie = new Cookie("refreshToken", refreshToken);
                cookie.setHttpOnly(true);
                cookie.setSecure(true);
                cookie.setPath("/api/auth");
                cookie.setMaxAge((int) (refreshExpiration / 1000)); // Đổi từ ms sang giây
                response.addCookie(cookie);
        }

        private String getClientIp(HttpServletRequest request) {
                String forwarded = request.getHeader("X-Forwarded-For");
                if (forwarded != null && !forwarded.isBlank()) {
                        return forwarded.split(",")[0].trim();
                }
                return request.getRemoteAddr();
        }
}
