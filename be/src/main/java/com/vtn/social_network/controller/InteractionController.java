package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.interaction.request.CommentRequest;
import com.vtn.social_network.dto.interaction.request.EditCommentRequest;
import com.vtn.social_network.dto.interaction.request.ReactionRequest;
import com.vtn.social_network.dto.interaction.response.CommentResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.InteractionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
         * Lấy danh sách reactions cho bài viết.
         */
        @GetMapping("/posts/{postId}/reactions")
        public ResponseEntity<ApiResponse<Page<InteractionService.ReactionResponse>>> getReactions(
                        @PathVariable Long postId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                return ResponseEntity
                                .ok(ApiResponse.<Page<InteractionService.ReactionResponse>>builder()
                                                .status(ErrorCode.SUCCESS.getStatus())
                                                .data(interactionService.getReactions(postId, page, size))
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
         * Xóa bình luận.
         */
        @DeleteMapping("/posts/{postId}/comments/{commentId}")
        public ResponseEntity<ApiResponse<Object>> deleteComment(
                        Authentication authentication,
                        @PathVariable Long postId,
                        @PathVariable Long commentId) {
                interactionService.deleteComment(authentication.getName(), postId, commentId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã xóa bình luận")
                                .build());
        }

        /**
         * Sửa bình luận (trong 15 phút, không notification).
         */
        @PutMapping("/posts/{postId}/comments/{commentId}")
        public ResponseEntity<ApiResponse<CommentResponse>> editComment(
                        Authentication authentication,
                        @PathVariable Long postId,
                        @PathVariable Long commentId,
                        @RequestBody EditCommentRequest request) {
                CommentResponse data = interactionService.editComment(
                                authentication.getName(), postId, commentId, request);
                return ResponseEntity.ok(ApiResponse.<CommentResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Sửa bình luận thành công")
                                .data(data)
                                .build());
        }

        /**
         * Lấy danh sách bình luận cấp 1 của bài viết (kèm replies).
         */
        @GetMapping("/posts/{postId}/comments")
        public ResponseEntity<ApiResponse<Page<CommentResponse>>> getComments(
                        @PathVariable Long postId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                Page<CommentResponse> data = interactionService.getComments(postId, page, size);
                return ResponseEntity.ok(ApiResponse.<Page<CommentResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        /**
         * Lấy replies của một comment.
         */
        @GetMapping("/comments/{commentId}/replies")
        public ResponseEntity<ApiResponse<Page<CommentResponse>>> getCommentReplies(
                        @PathVariable Long commentId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "5") int size) {
                Page<CommentResponse> data = interactionService.getCommentReplies(commentId, page, size);
                return ResponseEntity.ok(ApiResponse.<Page<CommentResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(data)
                                .build());
        }
}
