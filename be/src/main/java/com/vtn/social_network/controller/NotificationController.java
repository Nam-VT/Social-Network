package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.notification.response.NotificationResponse;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.NotificationService;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
                        Authentication authentication) {
                User user = userRepository.findByUsername(authentication.getName())
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                List<NotificationResponse> data = notificationService.getMyNotifications(user);

                return ResponseEntity.ok(ApiResponse.<List<NotificationResponse>>builder()
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
}
