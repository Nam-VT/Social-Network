package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.post.response.PostResponse;
import com.vtn.social_network.dto.user.response.UserProfileResponse;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.repository.UserRepository;
import com.vtn.social_network.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;
    private final UserRepository userRepository;

    /**
     * Tìm kiếm người dùng theo keyword.
     * GET /api/search/users?q=keyword
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> searchUsers(
            @RequestParam("q") String keyword,
            Authentication authentication) {

        User currentUser = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        List<UserProfileResponse> results = searchService.searchUsers(keyword, currentUser);

        return ResponseEntity.ok(ApiResponse.<List<UserProfileResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(results)
                .build());
    }

    /**
     * Tìm kiếm bài viết theo keyword.
     * GET /api/search/posts?q=keyword
     */
    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<List<PostResponse>>> searchPosts(
            @RequestParam("q") String keyword,
            Authentication authentication) {

        User currentUser = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        List<PostResponse> results = searchService.searchPosts(keyword, currentUser);

        return ResponseEntity.ok(ApiResponse.<List<PostResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(results)
                .build());
    }
}
