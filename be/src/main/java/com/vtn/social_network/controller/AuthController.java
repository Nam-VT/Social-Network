package com.vtn.social_network.controller;

import com.vtn.social_network.dto.auth.request.*;
import com.vtn.social_network.dto.auth.response.AuthResponse;
import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.repository.UserRepository;
import com.vtn.social_network.service.AuthService;
import com.vtn.social_network.service.UserActivityLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
                        HttpServletRequest httpRequest) {
                AuthResponse data = authService.login(request);

                // Ghi log đăng nhập thành công
                userRepository.findByUsername(request.getUsername())
                                .ifPresent(user -> activityLogService.logActivity(user, "LOGIN",
                                                getClientIp(httpRequest),
                                                httpRequest.getHeader("User-Agent"),
                                                "Đăng nhập thành công"));

                return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        @PostMapping("/refresh-token")
        public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
                AuthResponse data = authService.refreshToken(request);
                return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
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

        private String getClientIp(HttpServletRequest request) {
                String forwarded = request.getHeader("X-Forwarded-For");
                if (forwarded != null && !forwarded.isBlank()) {
                        return forwarded.split(",")[0].trim();
                }
                return request.getRemoteAddr();
        }
}
