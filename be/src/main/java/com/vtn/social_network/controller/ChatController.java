package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.chat.request.SendMessageRequest;
import com.vtn.social_network.dto.chat.response.ChatMessageResponse;
import com.vtn.social_network.dto.chat.response.ChatRoomResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * Lấy danh sách Inbox (các phòng chat và số tin chưa đọc).
     */
    @GetMapping("/inbox")
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> getInbox(Authentication authentication) {
        List<ChatRoomResponse> data = chatService.getInbox(authentication.getName());
        return ResponseEntity.ok(ApiResponse.<List<ChatRoomResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(data)
                .build());
    }

    /**
     * Lấy tin nhắn trong một phòng cụ thể.
     */
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            Authentication authentication,
            @PathVariable Long roomId) {
        List<ChatMessageResponse> data = chatService.getMessages(authentication.getName(), roomId);
        return ResponseEntity.ok(ApiResponse.<List<ChatMessageResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(data)
                .build());
    }

    /**
     * Gửi tin nhắn.
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
}
