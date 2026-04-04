package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.dto.user.response.FriendResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    /** Follow một người dùng theo userId */
    @PostMapping("/{userId}/follow")
    public ResponseEntity<ApiResponse<Void>> follow(
            Authentication authentication, @PathVariable Long userId) {
        followService.follow(authentication.getName(), userId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã theo dõi thành công")
                .build());
    }

    /** Bỏ theo dõi */
    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<ApiResponse<Void>> unfollow(
            Authentication authentication, @PathVariable Long userId) {
        followService.unfollow(authentication.getName(), userId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã bỏ theo dõi thành công")
                .build());
    }

    /** Danh sách Followers của user (người đang theo dõi user đó) */
    @GetMapping("/{userId}/followers")
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getFollowers(@PathVariable Long userId) {
        List<FriendResponse> data = followService.getFollowers(userId);
        return ResponseEntity.ok(ApiResponse.<List<FriendResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(data)
                .build());
    }

    /** Danh sách Following của user (user đó đang theo dõi ai) */
    @GetMapping("/{userId}/following")
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getFollowing(@PathVariable Long userId) {
        List<FriendResponse> data = followService.getFollowing(userId);
        return ResponseEntity.ok(ApiResponse.<List<FriendResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(data)
                .build());
    }

    /** Cập nhật quyền riêng tư: Cho phép / không cho phép người lạ follow */
    @PutMapping("/me/follow-privacy")
    public ResponseEntity<ApiResponse<Void>> updateFollowPrivacy(
            Authentication authentication,
            @RequestParam boolean allowPublicFollowers) {
        followService.updateFollowPrivacy(authentication.getName(), allowPublicFollowers);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã cập nhật cài đặt theo dõi")
                .build());
    }
}
