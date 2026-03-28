package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.user.request.UpdateProfileRequest;
import com.vtn.social_network.dto.user.response.UserProfileResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Xem profile của chính mình (dựa trên JWT).
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(Authentication authentication) {
        UserProfileResponse data = userService.getProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.<UserProfileResponse>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(data)
                .build());
    }

    /**
     * Cập nhật thông tin cá nhân.
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse data = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.<UserProfileResponse>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Cập nhật hồ sơ thành công")
                .data(data)
                .build());
    }

    /**
     * Xem profile của người dùng khác theo username.
     */
    @GetMapping("/{username}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserProfile(@PathVariable String username) {
        UserProfileResponse data = userService.getProfile(username);
        return ResponseEntity.ok(ApiResponse.<UserProfileResponse>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(data)
                .build());
    }
}
