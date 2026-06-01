package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.SavedPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class SavedPostController {

    private final SavedPostService savedPostService;

    @PostMapping("/{postId}/save")
    public ResponseEntity<ApiResponse<Object>> savePost(
            Authentication authentication, @PathVariable Long postId) {
        savedPostService.savePost(authentication.getName(), postId);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã lưu bài viết")
                .build());
    }

    @DeleteMapping("/{postId}/save")
    public ResponseEntity<ApiResponse<Object>> unsavePost(
            Authentication authentication, @PathVariable Long postId) {
        savedPostService.unsavePost(authentication.getName(), postId);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã bỏ lưu bài viết")
                .build());
    }

    @GetMapping("/saved")
    public ResponseEntity<ApiResponse<Page<SavedPostService.SavedPostResponse>>> getSavedPosts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SavedPostService.SavedPostResponse> data = savedPostService.getSavedPosts(
                authentication.getName(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.<Page<SavedPostService.SavedPostResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .data(data)
                .build());
    }
}
