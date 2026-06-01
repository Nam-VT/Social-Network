package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.post.response.PostResponse;
import com.vtn.social_network.dto.user.response.UserProfileResponse;
import com.vtn.social_network.service.SocialGroupService;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.repository.UserRepository;
import com.vtn.social_network.service.SearchService;
import com.vtn.social_network.service.SearchIndexingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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
        private final SearchIndexingService searchIndexingService;

        /**
         * Tìm kiếm người dùng theo keyword.
         * GET /api/search/users?q=keyword&page=0&size=20
         */
        @GetMapping("/users")
        public ResponseEntity<ApiResponse<Page<UserProfileResponse>>> searchUsers(
                        @RequestParam("q") String keyword,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        Authentication authentication) {

                User currentUser = userRepository.findByUsername(authentication.getName())
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Page<UserProfileResponse> results = searchService.searchUsers(keyword, currentUser, page, size);

                return ResponseEntity.ok(ApiResponse.<Page<UserProfileResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(results)
                                .build());
        }

        /**
         * Tìm kiếm bài viết theo keyword.
         * GET /api/search/posts?q=keyword&page=0&size=20
         */
        @GetMapping("/posts")
        public ResponseEntity<ApiResponse<Page<PostResponse>>> searchPosts(
                        @RequestParam("q") String keyword,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        Authentication authentication) {

                User currentUser = userRepository.findByUsername(authentication.getName())
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Page<PostResponse> results = searchService.searchPosts(keyword, currentUser, page, size);

                return ResponseEntity.ok(ApiResponse.<Page<PostResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(results)
                                .build());
        }

        /**
         * Gợi ý tìm kiếm nhanh (autocomplete).
         * GET /api/search/suggest?q=keyword
         */
        @GetMapping("/suggest")
        public ResponseEntity<ApiResponse<List<SearchService.SuggestItem>>> suggest(
                        @RequestParam("q") String keyword,
                        Authentication authentication) {
                User currentUser = null;
                if (authentication != null && authentication.getName() != null) {
                        currentUser = userRepository.findByUsername(authentication.getName()).orElse(null);
                }

                List<SearchService.SuggestItem> results = searchService.suggest(keyword, currentUser);
                return ResponseEntity.ok(ApiResponse.<List<SearchService.SuggestItem>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(results)
                                .build());
        }

        /**
         * Tìm kiếm nhóm theo keyword.
         * GET /api/search/groups?q=keyword&page=0&size=20
         */
        @GetMapping("/groups")
        public ResponseEntity<ApiResponse<Page<SocialGroupService.GroupResponse>>> searchGroups(
                        @RequestParam("q") String keyword,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        Authentication authentication) {
                
                User currentUser = null;
                if (authentication != null && authentication.getName() != null) {
                        currentUser = userRepository.findByUsername(authentication.getName()).orElse(null);
                }
                
                Page<SocialGroupService.GroupResponse> results = searchService.searchGroups(keyword, currentUser, page, size);

                return ResponseEntity.ok(ApiResponse.<Page<SocialGroupService.GroupResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message(ErrorCode.SUCCESS.getMessage())
                                .data(results)
                                .build());
        }

        @PostMapping("/sync-posts")
        public ResponseEntity<ApiResponse<String>> syncPosts() {
                searchIndexingService.syncAllPostsToES();
                return ResponseEntity.ok(ApiResponse.<String>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data("Đã đồng bộ thành công tất cả bài viết sang Elasticsearch")
                                .build());
        }
}
