package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.post.request.CreatePostRequest;
import com.vtn.social_network.dto.post.request.UpdatePostRequest;
import com.vtn.social_network.dto.post.response.PostResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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
        public ResponseEntity<ApiResponse<Page<PostResponse>>> getUserPosts(
                        Authentication authentication,
                        @PathVariable String username,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                Page<PostResponse> data = postService
                                .getUserPosts(authentication.getName(), username, page, size);
                return ResponseEntity.ok(ApiResponse.<Page<PostResponse>>builder()
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

        /**
         * Lấy bài viết theo hashtag.
         * GET /api/posts/hashtag/{tag}?page=0&size=10
         */
        @GetMapping("/hashtag/{tag}")
        public ResponseEntity<ApiResponse<Page<PostResponse>>> getPostsByHashtag(
                        Authentication authentication,
                        @PathVariable String tag,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                Page<PostResponse> data = postService.getPostsByHashtag(authentication.getName(), tag, page, size);
                return ResponseEntity.ok(ApiResponse.<Page<PostResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(data)
                                .build());
        }

        /**
         * Top hashtag trending.
         * GET /api/posts/hashtags/trending?limit=10
         */
        @GetMapping("/hashtags/trending")
        public ResponseEntity<ApiResponse<List<PostService.HashtagResponse>>> getTrendingHashtags(
                        @RequestParam(defaultValue = "10") int limit) {
                List<PostService.HashtagResponse> data = postService.getTrendingHashtags(limit);
                return ResponseEntity.ok(ApiResponse.<List<PostService.HashtagResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(data)
                                .build());
        }
}
