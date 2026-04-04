package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.interaction.request.StoryReplyRequest;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.ReactionType;
import com.vtn.social_network.service.StoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;

    /**
     * Tạo Story mới.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Object>> createStory(
            Authentication authentication,
            @Valid @RequestBody com.vtn.social_network.dto.interaction.request.StoryCreateRequest request) {
        storyService.createStory(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.CREATED.getStatus())
                .message("Tạo Story thành công")
                .build());
    }

    /**
     * Thả cảm xúc vào Story.
     */
    @PostMapping("/{storyId}/react")
    public ResponseEntity<ApiResponse<Object>> reactToStory(
            Authentication authentication,
            @PathVariable Long storyId,
            @RequestParam ReactionType type) {
        storyService.reactToStory(authentication.getName(), storyId, type);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Phản hồi Story thành công")
                .build());
    }

    /**
     * Phản hồi Story qua tin nhắn riêng.
     */
    @PostMapping("/{storyId}/reply")
    public ResponseEntity<ApiResponse<Object>> replyToStory(
            Authentication authentication,
            @PathVariable Long storyId,
            @Valid @RequestBody StoryReplyRequest request) {
        storyService.replyToStory(authentication.getName(), storyId, request);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã gửi phản hồi qua tin nhắn")
                .build());
    }
}
