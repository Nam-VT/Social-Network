package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.notification.response.NotificationResponse;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.NotificationService;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

        private final NotificationService notificationService;
        private final UserRepository userRepository;

        /**
         * Lấy danh sách thông báo của tôi (đã qua NotificationResponse DTO — không lộ
         * Password).
         */
        @GetMapping
        public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getMyNotifications(
                        Authentication authentication,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                User user = userRepository.findByUsername(authentication.getName())
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Page<NotificationResponse> data = notificationService
                                .getMyNotifications(user, page, size);

                return ResponseEntity
                                .ok(ApiResponse.<Page<NotificationResponse>>builder()
                                                .status(ErrorCode.SUCCESS.getStatus())
                                                .message(ErrorCode.SUCCESS.getMessage())
                                                .data(data)
                                                .build());
        }

        /**
         * Đánh dấu thông báo đã đọc.
         */
        @PutMapping("/{id}/read")
        public ResponseEntity<ApiResponse<Object>> markAsRead(@PathVariable Long id) {
                notificationService.markAsRead(id);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã đánh dấu đã đọc")
                                .build());
        }

        /**
         * Đếm số thông báo chưa đọc — dùng cho badge icon chuông trên Frontend.
         */
        @GetMapping("/unread-count")
        public ResponseEntity<ApiResponse<Long>> getUnreadCount(Authentication authentication) {
                User user = userRepository.findByUsername(authentication.getName())
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                long count = notificationService.getUnreadCount(user);
                return ResponseEntity.ok(ApiResponse.<Long>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(count)
                                .build());
        }

        /**
         * Đánh dấu tất cả thông báo là đã đọc.
         */
        @PutMapping("/read-all")
        public ResponseEntity<ApiResponse<Object>> markAllAsRead(Authentication authentication) {
                User user = userRepository.findByUsername(authentication.getName())
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                notificationService.markAllAsRead(user);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã đánh dấu tất cả đã đọc")
                                .build());
        }
}
