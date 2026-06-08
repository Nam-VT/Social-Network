package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.entity.AuditLog;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.AdminService;
import com.vtn.social_network.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;

    /** Thống kê tổng quan hệ thống. */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminService.StatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.<AdminService.StatsResponse>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .data(adminService.getSystemStats())
                .build());
    }

    /** Danh sách tất cả users (phân trang). */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<AdminService.UserAdminResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.<Page<AdminService.UserAdminResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .data(adminService.getAllUsers(PageRequest.of(page, size, Sort.by("createdAt").descending())))
                .build());
    }

    /** Ban user. */
    @PutMapping("/users/{userId}/ban")
    public ResponseEntity<ApiResponse<Object>> banUser(@PathVariable Long userId) {
        adminService.banUser(userId);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã cấm người dùng")
                .build());
    }

    /** Unban user. */
    @PutMapping("/users/{userId}/unban")
    public ResponseEntity<ApiResponse<Object>> unbanUser(@PathVariable Long userId) {
        adminService.unbanUser(userId);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã bỏ cấm người dùng")
                .build());
    }

    /** Danh sách tất cả bài viết (admin). */
    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Page<AdminService.PostAdminResponse>>> getAllPosts(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.<Page<AdminService.PostAdminResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .data(adminService.getAllPosts(keyword, PageRequest.of(page, size, Sort.by("createdAt").descending())))
                .build());
    }

    /** Xóa bài viết vi phạm. */
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<Object>> deletePost(@PathVariable Long postId) {
        adminService.adminDeletePost(postId);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã xóa bài viết")
                .build());
    }

    /** Danh sách tất cả nhóm (admin). */
    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<Page<AdminService.GroupAdminResponse>>> getAllGroups(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.<Page<AdminService.GroupAdminResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .data(adminService.getAllGroups(keyword, PageRequest.of(page, size, Sort.by("createdAt").descending())))
                .build());
    }

    /** Xóa nhóm vi phạm (admin). */
    @DeleteMapping("/groups/{groupId}")
    public ResponseEntity<ApiResponse<Object>> deleteGroup(@PathVariable Long groupId) {
        adminService.adminDeleteGroup(groupId);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã xóa nhóm")
                .build());
    }

    /** Lịch sử hành động Admin (Audit Log). */
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.<Page<AuditLog>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .data(auditLogService.getAuditLogs(page, size))
                .build());
    }
}
