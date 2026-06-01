package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.interaction.request.StoryCreateRequest;
import com.vtn.social_network.dto.interaction.request.StoryReplyRequest;
import com.vtn.social_network.dto.interaction.response.StoryGroupResponse;
import com.vtn.social_network.dto.interaction.response.StoryResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.ReactionType;
import com.vtn.social_network.enums.Visibility;
import com.vtn.social_network.service.StoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
                        @Valid @RequestBody StoryCreateRequest request) {
                storyService.createStory(authentication.getName(), request);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.CREATED.getStatus())
                                .message("Tạo Story thành công")
                                .build());
        }

        /**
         * Xóa Story (chỉ chủ story).
         */
        @DeleteMapping("/{storyId}")
        public ResponseEntity<ApiResponse<Object>> deleteStory(
                        Authentication authentication,
                        @PathVariable Long storyId) {
                storyService.deleteStory(authentication.getName(), storyId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã xóa Story")
                                .build());
        }

        /**
         * Lưu trữ Story (highlight). Lưu vĩnh viễn cho đến khi user gỡ.
         */
        @PostMapping("/{storyId}/archive")
        public ResponseEntity<ApiResponse<Object>> archiveStory(
                        Authentication authentication,
                        @PathVariable Long storyId,
                        @RequestParam(defaultValue = "PUBLIC") Visibility visibility) {
                storyService.archiveStory(authentication.getName(), storyId, visibility);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã lưu trữ Story")
                                .build());
        }

        /**
         * Bỏ lưu trữ Story.
         */
        @DeleteMapping("/{storyId}/archive")
        public ResponseEntity<ApiResponse<Object>> unarchiveStory(
                        Authentication authentication,
                        @PathVariable Long storyId) {
                storyService.unarchiveStory(authentication.getName(), storyId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã bỏ lưu trữ Story")
                                .build());
        }

        /**
         * Xem kho lưu trữ story (highlights) của user.
         */
        @GetMapping("/archive/{username}")
        public ResponseEntity<ApiResponse<List<StoryResponse>>> getArchivedStories(
                        Authentication authentication,
                        @PathVariable String username) {
                return ResponseEntity.ok(ApiResponse.<List<StoryResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(storyService.getArchivedStories(authentication.getName(), username))
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

        /**
         * Lấy feed Story từ bạn bè.
         */
        @GetMapping("/active")
        public ResponseEntity<ApiResponse<List<StoryGroupResponse>>> getActiveStories(Authentication authentication) {
                return ResponseEntity.ok(ApiResponse.<List<StoryGroupResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(storyService.getActiveStoriesFromFriends(authentication.getName()))
                                .build());
        }

        /**
         * Lấy danh sách Story của chính mình.
         */
        @GetMapping("/me")
        public ResponseEntity<ApiResponse<List<StoryResponse>>> getMyStories(Authentication authentication) {
                return ResponseEntity.ok(ApiResponse.<List<StoryResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(storyService.getMyActiveStories(authentication.getName()))
                                .build());
        }

        /**
         * Đánh dấu đã xem Story.
         */
        @PostMapping("/{storyId}/view")
        public ResponseEntity<ApiResponse<Object>> viewStory(
                        Authentication authentication,
                        @PathVariable Long storyId) {
                storyService.viewStory(authentication.getName(), storyId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã xem Story")
                                .build());
        }
}

