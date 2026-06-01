package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.post.response.PostResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hashtags")
@RequiredArgsConstructor
public class HashtagController {

    private final PostService postService;

    /**
     * Lấy danh sách hashtag đang thịnh hành.
     */
    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<PostService.HashtagResponse>>> getTrendingHashtags(
            @RequestParam(defaultValue = "10") int limit) {
        List<PostService.HashtagResponse> results = postService.getTrendingHashtags(limit);
        return ResponseEntity.ok(ApiResponse.<List<PostService.HashtagResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .data(results)
                .build());
    }

    /**
     * Lấy danh sách bài viết theo hashtag.
     */
    @GetMapping("/{tag}/posts")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getPostsByHashtag(
            @PathVariable String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        Page<PostResponse> results = postService.getPostsByHashtag(authentication.getName(), tag, page, size);
        return ResponseEntity.ok(ApiResponse.<Page<PostResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .data(results)
                .build());
    }
}
