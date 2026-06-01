package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.chat.request.AddMembersRequest;
import com.vtn.social_network.dto.chat.request.CreateGroupRequest;
import com.vtn.social_network.dto.chat.request.EditMessageRequest;
import com.vtn.social_network.dto.chat.request.ReactionRequest;
import com.vtn.social_network.dto.chat.request.SendMessageRequest;
import com.vtn.social_network.dto.chat.request.UpdateGroupRequest;
import com.vtn.social_network.dto.chat.request.DirectMessageRequest;
import com.vtn.social_network.dto.chat.response.ChatMessageResponse;
import com.vtn.social_network.dto.chat.response.ChatRoomResponse;
import com.vtn.social_network.dto.chat.response.GroupMemberResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

        private final ChatService chatService;

        // ==================== INBOX & MESSAGES ====================

        @GetMapping("/inbox")
        public ResponseEntity<ApiResponse<Page<ChatRoomResponse>>> getInbox(
                        Authentication authentication,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                Page<ChatRoomResponse> data = chatService
                                .getInbox(authentication.getName(), page, size);
                return ResponseEntity.ok(ApiResponse.<Page<ChatRoomResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        @GetMapping("/rooms/{roomId}")
        public ResponseEntity<ApiResponse<ChatRoomResponse>> getRoom(
                        Authentication authentication,
                        @PathVariable Long roomId) {
                ChatRoomResponse data = chatService.getRoom(authentication.getName(), roomId);
                return ResponseEntity.ok(ApiResponse.<ChatRoomResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(data)
                                .build());
        }

        @GetMapping("/unread-count")
        public ResponseEntity<ApiResponse<Long>> getUnreadRoomCount(Authentication authentication) {
                return ResponseEntity.ok(ApiResponse.<Long>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(chatService.getUnreadRoomCount(authentication.getName()))
                                .build());
        }

        @GetMapping("/rooms/{roomId}/messages")
        public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getMessages(
                        Authentication authentication,
                        @PathVariable Long roomId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                Page<ChatMessageResponse> data = chatService.getMessages(authentication.getName(), roomId, page, size);
                return ResponseEntity.ok(ApiResponse.<Page<ChatMessageResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        /**
         * Gửi tin nhắn (hỗ trợ text, image, video). Hoạt động cho cả PRIVATE và GROUP.
         */
        @PostMapping("/rooms/{roomId}/messages")
        public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
                        Authentication authentication,
                        @PathVariable Long roomId,
                        @Valid @RequestBody SendMessageRequest request) {
                ChatMessageResponse data = chatService.sendMessage(authentication.getName(), roomId, request);
                return ResponseEntity.ok(ApiResponse.<ChatMessageResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Tin nhắn đã gửi")
                                .data(data)
                                .build());
        }

        // ==================== DIRECT MESSAGE ====================
        @PostMapping("/direct")
        public ResponseEntity<ApiResponse<ChatRoomResponse>> getOrCreateDirectRoom(
                        Authentication authentication,
                        @Valid @RequestBody DirectMessageRequest request) {
                ChatRoomResponse data = chatService.getOrCreateDirectRoom(authentication.getName(), request.getTargetUserId());
                return ResponseEntity.ok(ApiResponse.<ChatRoomResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        // ==================== GROUP CHAT ====================

        /**
         * Tạo nhóm chat mới.
         */
        @PostMapping("/groups")
        public ResponseEntity<ApiResponse<ChatRoomResponse>> createGroup(
                        Authentication authentication,
                        @Valid @RequestBody CreateGroupRequest request) {
                ChatRoomResponse data = chatService.createGroup(authentication.getName(), request);
                return ResponseEntity.ok(ApiResponse.<ChatRoomResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Tạo nhóm thành công")
                                .data(data)
                                .build());
        }

        /**
         * Thêm thành viên vào nhóm.
         */
        @PostMapping("/groups/{roomId}/members")
        public ResponseEntity<ApiResponse<Object>> addMembers(
                        Authentication authentication,
                        @PathVariable Long roomId,
                        @Valid @RequestBody AddMembersRequest request) {
                chatService.addMembers(authentication.getName(), roomId, request);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã thêm thành viên")
                                .build());
        }

        /**
         * Xóa thành viên khỏi nhóm.
         */
        @DeleteMapping("/groups/{roomId}/members/{userId}")
        public ResponseEntity<ApiResponse<Object>> removeMember(
                        Authentication authentication,
                        @PathVariable Long roomId,
                        @PathVariable Long userId) {
                chatService.removeMember(authentication.getName(), roomId, userId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã xóa thành viên")
                                .build());
        }

        /**
         * Rời nhóm.
         */
        @PostMapping("/groups/{roomId}/leave")
        public ResponseEntity<ApiResponse<Object>> leaveGroup(
                        Authentication authentication,
                        @PathVariable Long roomId) {
                chatService.leaveGroup(authentication.getName(), roomId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã rời nhóm")
                                .build());
        }

        /**
         * Cập nhật thông tin nhóm (tên, avatar).
         */
        @PutMapping("/groups/{roomId}")
        public ResponseEntity<ApiResponse<ChatRoomResponse>> updateGroupInfo(
                        Authentication authentication,
                        @PathVariable Long roomId,
                        @Valid @RequestBody UpdateGroupRequest request) {
                ChatRoomResponse data = chatService.updateGroupInfo(authentication.getName(), roomId, request);
                return ResponseEntity.ok(ApiResponse.<ChatRoomResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã cập nhật thông tin nhóm")
                                .data(data)
                                .build());
        }

        /**
         * Danh sách thành viên nhóm.
         */
        @GetMapping("/groups/{roomId}/members")
        public ResponseEntity<ApiResponse<List<GroupMemberResponse>>> getGroupMembers(
                        Authentication authentication,
                        @PathVariable Long roomId) {
                List<GroupMemberResponse> data = chatService.getGroupMembers(authentication.getName(), roomId);
                return ResponseEntity.ok(ApiResponse.<List<GroupMemberResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        // ==================== REACTIONS ====================

        @PostMapping("/messages/{messageId}/reactions")
        public ResponseEntity<ApiResponse<ChatMessageResponse>> reactToMessage(
                        Authentication authentication,
                        @PathVariable Long messageId,
                        @Valid @RequestBody ReactionRequest request) {
                ChatMessageResponse data = chatService.reactToMessage(
                                authentication.getName(), messageId, request.getReactionType());
                return ResponseEntity.ok(ApiResponse.<ChatMessageResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã thả cảm xúc")
                                .data(data)
                                .build());
        }

        @DeleteMapping("/messages/{messageId}/reactions")
        public ResponseEntity<ApiResponse<Object>> removeReaction(
                        Authentication authentication,
                        @PathVariable Long messageId) {
                chatService.removeReaction(authentication.getName(), messageId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã gỡ cảm xúc")
                                .build());
        }

        // ==================== MEDIA GALLERY ====================

        @GetMapping("/rooms/{roomId}/media")
        public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMediaGallery(
                        Authentication authentication,
                        @PathVariable Long roomId) {
                List<ChatMessageResponse> data = chatService.getMediaGallery(authentication.getName(), roomId);
                return ResponseEntity.ok(ApiResponse.<List<ChatMessageResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        // ==================== READ RECEIPTS ====================

        @PostMapping("/rooms/{roomId}/messages/{messageId}/read")
        public ResponseEntity<ApiResponse<Object>> markAsRead(
                        Authentication authentication,
                        @PathVariable Long roomId,
                        @PathVariable Long messageId) {
                chatService.markAsRead(authentication.getName(), roomId, messageId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã đánh dấu đã đọc")
                                .build());
        }

        // ==================== EDIT & RECALL ====================

        @PutMapping("/messages/{messageId}")
        public ResponseEntity<ApiResponse<ChatMessageResponse>> editMessage(
                        Authentication authentication,
                        @PathVariable Long messageId,
                        @Valid @RequestBody EditMessageRequest request) {
                ChatMessageResponse data = chatService.editMessage(
                                authentication.getName(), messageId, request.getContent());
                return ResponseEntity.ok(ApiResponse.<ChatMessageResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã sửa tin nhắn")
                                .data(data)
                                .build());
        }

        @DeleteMapping("/messages/{messageId}")
        public ResponseEntity<ApiResponse<Object>> recallMessage(
                        Authentication authentication,
                        @PathVariable Long messageId) {
                chatService.recallMessage(authentication.getName(), messageId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Tin nhắn đã bị gỡ")
                                .build());
        }
}
