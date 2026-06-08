package com.vtn.social_network.service;

import com.vtn.social_network.entity.Post;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.ReportStatus;
import com.vtn.social_network.enums.UserRole;
import com.vtn.social_network.enums.UserStatus;
import com.vtn.social_network.repository.PostRepository;
import com.vtn.social_network.repository.ReportRepository;
import com.vtn.social_network.repository.SocialGroupRepository;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final SocialGroupRepository socialGroupRepository;
    private final ReportRepository reportRepository;
    private final AuditLogService auditLogService;

    // ==================== STATS ====================

    @Transactional(readOnly = true)
    @Cacheable(value = "admin-stats", key = "'system'")
    public StatsResponse getSystemStats() {
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        long totalGroups = socialGroupRepository.count();
        long totalReports = reportRepository.count();
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);

        return StatsResponse.builder()
                .totalUsers(totalUsers)
                .totalPosts(totalPosts)
                .totalGroups(totalGroups)
                .totalReports(totalReports)
                .pendingReports(pendingReports)
                .build();
    }

    // ==================== USER MANAGEMENT ====================

    @Transactional(readOnly = true)
    public Page<UserAdminResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::toUserAdminResponse);
    }

    @Transactional
    @CacheEvict(value = "admin-stats", allEntries = true)
    public void banUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        if (user.getRole() == UserRole.ADMIN) {
            throw new RuntimeException("Không thể ban tài khoản Admin");
        }

        user.setStatus(UserStatus.BANNED);
        userRepository.save(user);
        auditLogService.logAction("ADMIN", "BAN_USER", "USER", userId,
                "Đã cấm người dùng: " + user.getUsername());
        log.info("Admin đã ban user #{} ({})", userId, user.getUsername());
    }

    @Transactional
    @CacheEvict(value = "admin-stats", allEntries = true)
    public void unbanUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        auditLogService.logAction("ADMIN", "UNBAN_USER", "USER", userId,
                "Đã bỏ cấm người dùng: " + user.getUsername());
        log.info("Admin đã unban user #{} ({})", userId, user.getUsername());
    }

    // ==================== POST MANAGEMENT ====================

    @Transactional(readOnly = true)
    public Page<PostAdminResponse> getAllPosts(String keyword, Pageable pageable) {
        Page<Post> posts;
        if (keyword != null && !keyword.isBlank()) {
            posts = postRepository.findByContentContainingIgnoreCase(keyword, pageable);
        } else {
            posts = postRepository.findAll(pageable);
        }
        return posts.map(this::toPostAdminResponse);
    }

    @Transactional
    public void adminDeletePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));

        postRepository.delete(post);
        auditLogService.logAction("ADMIN", "DELETE_POST", "POST", postId,
                "Đã xóa bài viết của user: " + post.getUser().getUsername());
        log.info("Admin đã xóa bài viết #{} của user {}", postId, post.getUser().getUsername());
    }

    // ==================== GROUP MANAGEMENT ====================

    @Transactional(readOnly = true)
    public Page<GroupAdminResponse> getAllGroups(String keyword, Pageable pageable) {
        Page<com.vtn.social_network.entity.SocialGroup> groups;
        if (keyword != null && !keyword.isBlank()) {
            groups = socialGroupRepository.findByNameContainingIgnoreCase(keyword, pageable);
        } else {
            groups = socialGroupRepository.findAll(pageable);
        }
        return groups.map(this::toGroupAdminResponse);
    }

    @Transactional
    public void adminDeleteGroup(Long groupId) {
        com.vtn.social_network.entity.SocialGroup group = socialGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Nhóm không tồn tại"));
        String groupName = group.getName();
        socialGroupRepository.delete(group);
        auditLogService.logAction("ADMIN", "DELETE_GROUP", "GROUP", groupId, "Đã xóa nhóm: " + groupName);
        log.info("Admin đã xóa nhóm #{} ({})", groupId, groupName);
    }

    // ==================== MAPPERS ====================

    private UserAdminResponse toUserAdminResponse(User user) {
        return UserAdminResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .lastSeenAt(user.getLastSeenAt())
                .build();
    }

    private PostAdminResponse toPostAdminResponse(Post post) {
        return PostAdminResponse.builder()
                .id(post.getId())
                .content(post.getContent() != null && post.getContent().length() > 200
                        ? post.getContent().substring(0, 200) + "..." : post.getContent())
                .authorUsername(post.getUser().getUsername())
                .authorFullName(post.getUser().getFullName())
                .authorAvatarUrl(post.getUser().getAvatarUrl())
                .visibility(post.getVisibility() != null ? post.getVisibility().name() : "PUBLIC")
                .createdAt(post.getCreatedAt())
                .build();
    }

    private GroupAdminResponse toGroupAdminResponse(com.vtn.social_network.entity.SocialGroup g) {
        return GroupAdminResponse.builder()
                .id(g.getId())
                .name(g.getName())
                .description(g.getDescription())
                .coverUrl(g.getCoverUrl())
                .privacy(g.getPrivacy() != null ? g.getPrivacy().name() : "PUBLIC")
                .memberCount(g.getMemberCount())
                .creatorUsername(g.getCreator() != null ? g.getCreator().getUsername() : "")
                .createdAt(g.getCreatedAt())
                .build();
    }

    // ==================== DTOs ====================

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class StatsResponse {
        private long totalUsers;
        private long totalPosts;
        private long totalGroups;
        private long totalReports;
        private long pendingReports;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UserAdminResponse {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private String avatarUrl;
        private UserStatus status;
        private UserRole role;
        private LocalDateTime createdAt;
        private LocalDateTime lastSeenAt;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PostAdminResponse {
        private Long id;
        private String content;
        private String authorUsername;
        private String authorFullName;
        private String authorAvatarUrl;
        private String visibility;
        private LocalDateTime createdAt;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GroupAdminResponse {
        private Long id;
        private String name;
        private String description;
        private String coverUrl;
        private String privacy;
        private int memberCount;
        private String creatorUsername;
        private LocalDateTime createdAt;
    }
}
