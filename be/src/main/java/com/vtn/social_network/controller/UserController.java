package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.user.request.UpdateProfileRequest;
import com.vtn.social_network.dto.user.response.FriendResponse;
import com.vtn.social_network.dto.user.response.UserProfileResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.FriendshipService;
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
        private final FriendshipService friendshipService;

        /**
         * Xem profile của chính mình (dựa trên JWT).
         */
        @GetMapping("/me")
        public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(Authentication authentication) {
                UserProfileResponse data = userService.getProfile(authentication.getName(), authentication.getName());
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
         * Cập nhật quyền riêng tư (Friend List Visibility, etc.)
         */
        @PutMapping("/me/privacy")
        public ResponseEntity<ApiResponse<UserProfileResponse>> updatePrivacy(
                        Authentication authentication,
                        @Valid @RequestBody com.vtn.social_network.dto.user.request.PrivacyUpdateRequest request) {
                UserProfileResponse data = userService.updatePrivacy(authentication.getName(), request);
                return ResponseEntity.ok(ApiResponse.<UserProfileResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Cập nhật quyền riêng tư thành công")
                                .data(data)
                                .build());
        }

        /**
         * Xem profile của người dùng khác theo username.
         */
        @GetMapping("/{username}")
        public ResponseEntity<ApiResponse<UserProfileResponse>> getUserProfile(
                        Authentication authentication, @PathVariable String username) {
                UserProfileResponse data = userService.getProfile(authentication.getName(), username);
                return ResponseEntity.ok(ApiResponse.<UserProfileResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        /**
         * Block người dùng
         */
        @PostMapping("/block/{userId}")
        public ResponseEntity<ApiResponse<Object>> blockUser(
                        Authentication authentication, @PathVariable Long userId) {
                friendshipService.blockUser(authentication.getName(), userId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã chặn người dùng")
                                .build());
        }

        /**
         * Bỏ block người dùng
         */
        @DeleteMapping("/block/{userId}")
        public ResponseEntity<ApiResponse<Object>> unblockUser(
                        Authentication authentication, @PathVariable Long userId) {
                friendshipService.unblockUser(authentication.getName(), userId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã bỏ chặn người dùng")
                                .build());
        }

        /**
         * Lấy danh sách bị chặn
         */
        @GetMapping("/block")
        public ResponseEntity<ApiResponse<java.util.List<FriendResponse>>> getBlockedUsers(
                        Authentication authentication) {
                java.util.List<FriendResponse> data = friendshipService.getBlockedUsers(authentication.getName());
                return ResponseEntity.ok(ApiResponse.<java.util.List<FriendResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }
}
