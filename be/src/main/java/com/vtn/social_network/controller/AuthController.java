package com.vtn.social_network.controller;

import com.vtn.social_network.dto.auth.request.*;
import com.vtn.social_network.dto.auth.response.AuthResponse;
import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
    public ResponseEntity<ApiResponse<AuthResponse>> signin(@Valid @RequestBody LoginRequest request) {
        AuthResponse data = authService.login(request);
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
    public ResponseEntity<ApiResponse<Object>> changePassword(Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(authentication.getName(), request);
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
}
