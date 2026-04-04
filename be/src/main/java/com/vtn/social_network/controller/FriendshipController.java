package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.user.response.FriendResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendshipController {

        private final FriendshipService friendshipService;

        @PostMapping("/request/{userId}")
        public ResponseEntity<ApiResponse<Object>> sendFriendRequest(
                        Authentication authentication, @PathVariable Long userId) {
                friendshipService.sendFriendRequest(authentication.getName(), userId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã gửi lời mời kết bạn")
                                .build());
        }

        @PostMapping("/accept/{userId}")
        public ResponseEntity<ApiResponse<Object>> acceptFriendRequest(
                        Authentication authentication, @PathVariable Long userId) {
                friendshipService.acceptFriendRequest(authentication.getName(), userId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã chấp nhận lời mời kết bạn")
                                .build());
        }

        @DeleteMapping("/request/{userId}")
        public ResponseEntity<ApiResponse<Object>> rejectFriendRequest(
                        Authentication authentication, @PathVariable Long userId) {
                friendshipService.rejectFriendRequest(authentication.getName(), userId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã từ chối lời mời kết bạn")
                                .build());
        }

        @DeleteMapping("/{userId}")
        public ResponseEntity<ApiResponse<Object>> unfriend(
                        Authentication authentication, @PathVariable Long userId) {
                friendshipService.unfriend(authentication.getName(), userId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã huỷ kết bạn")
                                .build());
        }

        @GetMapping("/requests/pending")
        public ResponseEntity<ApiResponse<List<FriendResponse>>> getPendingRequests(
                        Authentication authentication) {
                List<FriendResponse> data = friendshipService.getPendingRequests(authentication.getName());
                return ResponseEntity.ok(ApiResponse.<List<FriendResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        @GetMapping("/{username}")
        public ResponseEntity<ApiResponse<List<FriendResponse>>> getFriendsList(
                        Authentication authentication, @PathVariable String username) {
                List<FriendResponse> data = friendshipService.getFriendsList(authentication.getName(), username);
                return ResponseEntity.ok(ApiResponse.<List<FriendResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        @GetMapping("/suggestions")
        public ResponseEntity<ApiResponse<List<FriendResponse>>> getFriendSuggestions(
                        Authentication authentication) {
                List<FriendResponse> data = friendshipService.getFriendSuggestions(authentication.getName());
                return ResponseEntity.ok(ApiResponse.<List<FriendResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }
}
