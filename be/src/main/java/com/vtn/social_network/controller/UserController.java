package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.user.request.PrivacyUpdateRequest;
import com.vtn.social_network.dto.user.request.UpdateProfileRequest;
import com.vtn.social_network.dto.user.response.FriendResponse;
import com.vtn.social_network.dto.user.response.UserProfileResponse;
import com.vtn.social_network.dto.user.response.UserPresenceResponse;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.entity.UserActivityLog;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.repository.UserRepository;
import com.vtn.social_network.service.FriendshipService;
import com.vtn.social_network.service.PresenceService;
import com.vtn.social_network.service.StorageService;
import com.vtn.social_network.service.UserActivityLogService;
import com.vtn.social_network.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

        private final UserService userService;
        private final FriendshipService friendshipService;
        private final StorageService storageService;
        private final PresenceService presenceService;
        private final UserActivityLogService activityLogService;
        private final UserRepository userRepository;

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
                        @Valid @RequestBody PrivacyUpdateRequest request) {
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
        public ResponseEntity<ApiResponse<List<FriendResponse>>> getBlockedUsers(
                        Authentication authentication) {
                List<FriendResponse> data = friendshipService.getBlockedUsers(authentication.getName());
                return ResponseEntity.ok(ApiResponse.<List<FriendResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        /**
         * Upload avatar (anh đai diện).
         */
        @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ApiResponse<UserProfileResponse>> uploadAvatar(
                        Authentication authentication,
                        @RequestParam("file") MultipartFile file) {
                String url = storageService.upload(file, "avatars");
                UserProfileResponse data = userService.updateAvatar(authentication.getName(), url);
                return ResponseEntity.ok(ApiResponse.<UserProfileResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Cập nhật ảnh đại diện thành công")
                                .data(data)
                                .build());
        }

        /**
         * Upload ảnh bìa (cover photo).
         */
        @PostMapping(value = "/me/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ApiResponse<UserProfileResponse>> uploadCover(
                        Authentication authentication,
                        @RequestParam("file") MultipartFile file) {
                String url = storageService.upload(file, "covers");
                UserProfileResponse data = userService.updateCover(authentication.getName(), url);
                return ResponseEntity.ok(ApiResponse.<UserProfileResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Cập nhật ảnh bìa thành công")
                                .data(data)
                                .build());
        }

        /**
         * Kiểm tra trạng thái trực tuyến của user.
         */
        @GetMapping("/{username}/presence")
        public ResponseEntity<ApiResponse<UserPresenceResponse>> getPresence(@PathVariable String username) {
                UserPresenceResponse data = UserPresenceResponse.builder()
                                .username(username)
                                .isOnline(presenceService.isUserOnline(username))
                                .lastSeenAt(presenceService.getLastSeenAt(username))
                                .build();
                return ResponseEntity.ok(ApiResponse.<UserPresenceResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(data)
                                .build());
        }

        /**
         * Lấy danh sách username bạn bè đang online (dùng để hydrate PresenceStore khi FE khởi động).
         */
        @GetMapping("/online-friends")
        public ResponseEntity<ApiResponse<List<String>>> getOnlineFriends(Authentication authentication) {
                List<String> onlineUsernames = presenceService.getOnlineFriendUsernames(authentication.getName());
                return ResponseEntity.ok(ApiResponse.<List<String>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(onlineUsernames)
                                .build());
        }

        /**
         * Lịch sử hoạt động của user (đăng nhập, đổi mật khẩu...).
         */
        @GetMapping("/me/activity-log")
        public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<UserActivityLog>>> getMyActivityLog(
                        Authentication authentication,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                User user = userRepository.findByUsername(authentication.getName())
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                return ResponseEntity.ok(ApiResponse.<org.springframework.data.domain.Page<UserActivityLog>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(activityLogService.getMyActivityLog(user, page, size))
                                .build());
        }
}
