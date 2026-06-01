package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.post.response.PostResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.PostService;
import com.vtn.social_network.service.SocialGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class SocialGroupController {

        private final SocialGroupService socialGroupService;
        private final PostService postService;

        @PostMapping
        public ResponseEntity<ApiResponse<SocialGroupService.GroupResponse>> createGroup(
                        Authentication authentication,
                        @RequestBody SocialGroupService.CreateGroupRequest request) {
                return ResponseEntity.ok(ApiResponse.<SocialGroupService.GroupResponse>builder()
                                .status(ErrorCode.CREATED.getStatus())
                                .message("Tạo nhóm thành công")
                                .data(socialGroupService.createGroup(authentication.getName(), request))
                                .build());
        }

        @PutMapping("/{groupId}")
        public ResponseEntity<ApiResponse<SocialGroupService.GroupResponse>> updateGroup(
                        Authentication authentication, @PathVariable Long groupId,
                        @RequestBody SocialGroupService.UpdateGroupRequest request) {
                return ResponseEntity.ok(ApiResponse.<SocialGroupService.GroupResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(socialGroupService.updateGroup(authentication.getName(), groupId, request))
                                .build());
        }

        @DeleteMapping("/{groupId}")
        public ResponseEntity<ApiResponse<Object>> deleteGroup(
                        Authentication authentication, @PathVariable Long groupId) {
                socialGroupService.deleteGroup(authentication.getName(), groupId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã xóa nhóm")
                                .build());
        }

        @GetMapping("/{groupId}")
        public ResponseEntity<ApiResponse<SocialGroupService.GroupResponse>> getGroupById(
                        Authentication authentication, @PathVariable Long groupId) {
                return ResponseEntity.ok(ApiResponse.<SocialGroupService.GroupResponse>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(socialGroupService.getGroupById(authentication.getName(), groupId))
                                .build());
        }

        @PostMapping("/{groupId}/join")
        public ResponseEntity<ApiResponse<Object>> joinGroup(
                        Authentication authentication, @PathVariable Long groupId) {
                socialGroupService.joinGroup(authentication.getName(), groupId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Yêu cầu tham gia đã được gửi")
                                .build());
        }

        @PostMapping("/{groupId}/leave")
        public ResponseEntity<ApiResponse<Object>> leaveGroup(
                        Authentication authentication, @PathVariable Long groupId) {
                socialGroupService.leaveGroup(authentication.getName(), groupId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã rời nhóm")
                                .build());
        }

        @GetMapping("/{groupId}/members")
        public ResponseEntity<ApiResponse<Page<SocialGroupService.MemberResponse>>> getMembers(
                        @PathVariable Long groupId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                return ResponseEntity.ok(ApiResponse.<Page<SocialGroupService.MemberResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(socialGroupService.getGroupMembers(groupId, PageRequest.of(page, size)))
                                .build());
        }

        @GetMapping("/{groupId}/members/pending")
        public ResponseEntity<ApiResponse<Page<SocialGroupService.MemberResponse>>> getPendingRequests(
                        @PathVariable Long groupId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                return ResponseEntity.ok(ApiResponse.<Page<SocialGroupService.MemberResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(socialGroupService.getPendingRequests(groupId, PageRequest.of(page, size)))
                                .build());
        }

        @PostMapping("/{groupId}/members/{userId}/approve")
        public ResponseEntity<ApiResponse<Object>> approveJoinRequest(
                        Authentication authentication, @PathVariable Long groupId, @PathVariable Long userId) {
                socialGroupService.approveJoinRequest(authentication.getName(), groupId, userId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã duyệt thành viên")
                                .build());
        }

        @DeleteMapping("/{groupId}/members/{userId}")
        public ResponseEntity<ApiResponse<Object>> kickMember(
                        Authentication authentication, @PathVariable Long groupId, @PathVariable Long userId) {
                socialGroupService.kickMember(authentication.getName(), groupId, userId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã xóa thành viên khỏi nhóm")
                                .build());
        }

        @PostMapping("/{groupId}/invite")
        public ResponseEntity<ApiResponse<Object>> inviteToGroup(
                        Authentication authentication, @PathVariable Long groupId,
                        @RequestBody java.util.Map<String, Long> payload) {
                socialGroupService.inviteToGroup(authentication.getName(), groupId, payload.get("friendId"));
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã gửi lời mời")
                                .build());
        }

        @PutMapping("/{groupId}/members/{userId}/role")
        public ResponseEntity<ApiResponse<Object>> changeRole(
                        Authentication authentication, @PathVariable Long groupId, @PathVariable Long userId,
                        @RequestBody SocialGroupService.RoleChangeRequest request) {
                socialGroupService.changeRole(authentication.getName(), groupId, userId, request.getRole());
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã đổi quyền thành viên")
                                .build());
        }

        @PostMapping("/{groupId}/posts/{postId}/approve")
        public ResponseEntity<ApiResponse<Object>> approvePost(
                        Authentication authentication, @PathVariable Long groupId, @PathVariable Long postId) {
                socialGroupService.approveGroupPost(authentication.getName(), groupId, postId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã duyệt bài viết")
                                .build());
        }

        @PostMapping("/{groupId}/posts/{postId}/reject")
        public ResponseEntity<ApiResponse<Object>> rejectPost(
                        Authentication authentication, @PathVariable Long groupId, @PathVariable Long postId) {
                postService.rejectGroupPost(authentication.getName(), groupId, postId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .message("Đã từ chối bài viết")
                                .build());
        }

        @GetMapping("/{groupId}/feed")
        public ResponseEntity<ApiResponse<Page<PostResponse>>> getGroupFeed(
                        Authentication authentication,
                        @PathVariable Long groupId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                return ResponseEntity.ok(ApiResponse.<Page<PostResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(postService.getGroupFeed(authentication.getName(), groupId, page, size))
                                .build());
        }

        @GetMapping("/{groupId}/posts/pending")
        public ResponseEntity<ApiResponse<Page<PostResponse>>> getGroupPendingPosts(
                        Authentication authentication,
                        @PathVariable Long groupId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                return ResponseEntity.ok(ApiResponse.<Page<PostResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(postService.getGroupPendingPosts(authentication.getName(), groupId,
                                                PageRequest.of(page, size)))
                                .build());
        }

        @GetMapping("/search")
        public ResponseEntity<ApiResponse<Page<SocialGroupService.GroupResponse>>> searchGroups(
                        @RequestParam String q,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        org.springframework.security.core.Authentication authentication) {
                String username = (authentication != null && authentication.getName() != null) 
                        ? authentication.getName() : null;
                return ResponseEntity.ok(ApiResponse.<Page<SocialGroupService.GroupResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(socialGroupService.searchGroups(q, username, PageRequest.of(page, size)))
                                .build());
        }

        @GetMapping("/my")
        public ResponseEntity<ApiResponse<Page<SocialGroupService.GroupResponse>>> getMyGroups(
                        Authentication authentication,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                return ResponseEntity.ok(ApiResponse.<Page<SocialGroupService.GroupResponse>>builder()
                                .status(ErrorCode.SUCCESS.getStatus())
                                .data(socialGroupService.getMyGroups(authentication.getName(),
                                                PageRequest.of(page, size)))
                                .build());
        }
}
