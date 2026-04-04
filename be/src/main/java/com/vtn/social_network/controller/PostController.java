package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.post.request.CreatePostRequest;
import com.vtn.social_network.dto.post.request.UpdatePostRequest;
import com.vtn.social_network.dto.post.response.PostResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

        private final PostService postService;

        @PostMapping
        public ResponseEntity<ApiResponse<PostResponse>> createPost(
                        Authentication authentication,
                        @Valid @RequestBody CreatePostRequest request) {
                PostResponse data = postService.createPost(authentication.getName(), request);
                return ResponseEntity.ok(ApiResponse.<PostResponse>builder()
                                .status(ErrorCode.CREATED.getStatus())
                                .message(ErrorCode.CREATED.getMessage())
                                .data(data)
                                .build());
        }

        @GetMapping("/{postId}")
        public ResponseEntity<ApiResponse<PostResponse>> getPost(
                        Authentication authentication, @PathVariable Long postId) {
                PostResponse data = postService.getPost(authentication.getName(), postId);
                return ResponseEntity.ok(ApiResponse.<PostResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        @PutMapping("/{postId}")
        public ResponseEntity<ApiResponse<PostResponse>> updatePost(
                        Authentication authentication,
                        @PathVariable Long postId,
                        @Valid @RequestBody UpdatePostRequest request) {
                PostResponse data = postService.updatePost(authentication.getName(), postId, request);
                return ResponseEntity.ok(ApiResponse.<PostResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Cập nhật bài viết thành công")
                                .data(data)
                                .build());
        }

        @DeleteMapping("/{postId}")
        public ResponseEntity<ApiResponse<Object>> deletePost(
                        Authentication authentication,
                        @PathVariable Long postId) {
                postService.deletePost(authentication.getName(), postId);
                return ResponseEntity.ok(ApiResponse.<Object>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã xóa bài viết")
                                .build());
        }

        /**
         * Lấy bài viết của một user.
         */
        @GetMapping("/user/{username}")
        public ResponseEntity<ApiResponse<List<PostResponse>>> getUserPosts(
                        Authentication authentication, @PathVariable String username) {
                List<PostResponse> data = postService.getUserPosts(authentication.getName(), username);
                return ResponseEntity.ok(ApiResponse.<List<PostResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }

        /**
         * News Feed (cursor-based pagination).
         * Params: cursor (ISO datetime), size (default 10).
         */
        @GetMapping("/feed")
        public ResponseEntity<ApiResponse<List<PostResponse>>> getNewsFeed(
                        Authentication authentication,
                        @RequestParam(required = false) LocalDateTime cursor,
                        @RequestParam(defaultValue = "10") int size) {
                List<PostResponse> data = postService.getNewsFeed(authentication.getName(), cursor, size);
                return ResponseEntity.ok(ApiResponse.<List<PostResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(data)
                                .build());
        }
}
