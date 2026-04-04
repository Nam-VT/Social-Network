package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.interaction.request.CommentRequest;
import com.vtn.social_network.dto.interaction.request.ReactionRequest;
import com.vtn.social_network.dto.interaction.response.CommentResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.InteractionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;

    /**
     * Thả cảm xúc vào Post hoặc Comment.
     */
    @PostMapping("/reactions")
    public ResponseEntity<ApiResponse<Object>> toggleReaction(
            Authentication authentication,
            @Valid @RequestBody ReactionRequest request) {
        interactionService.toggleReaction(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Phản hồi đã được ghi nhận")
                .build());
    }

    /**
     * Thêm bình luận mới (hỗ trợ threaded).
     */
    @PostMapping("/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            Authentication authentication,
            @Valid @RequestBody CommentRequest request) {
        CommentResponse data = interactionService.addComment(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.<CommentResponse>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Bình luận thành công")
                .data(data)
                .build());
    }

    /**
     * Lấy danh sách bình luận của bài viết.
     */
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(@PathVariable Long postId) {
        List<CommentResponse> data = interactionService.getComments(postId);
        return ResponseEntity.ok(ApiResponse.<List<CommentResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(data)
                .build());
    }
}
