package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.ShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    @PostMapping("/{postId}/share")
    public ResponseEntity<ApiResponse<Object>> sharePost(
            Authentication authentication,
            @PathVariable Long postId,
            @RequestBody(required = false) ShareService.ShareRequest request) {
        String content = (request != null) ? request.getContent() : null;
        shareService.sharePost(authentication.getName(), postId, content);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã chia sẻ bài viết")
                .build());
    }

    @GetMapping("/{postId}/shares")
    public ResponseEntity<ApiResponse<Page<ShareService.ShareResponse>>> getShares(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.<Page<ShareService.ShareResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .data(shareService.getShares(postId, page, size))
                .build());
    }
}
