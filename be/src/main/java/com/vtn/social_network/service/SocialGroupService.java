package com.vtn.social_network.service;

import com.vtn.social_network.entity.*;
import com.vtn.social_network.enums.*;
import com.vtn.social_network.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SocialGroupService {

    private final SocialGroupRepository socialGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;

    // ==================== GROUP CRUD ====================

    @Transactional
    public GroupResponse createGroup(String username, CreateGroupRequest request) {
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        SocialGroup group = SocialGroup.builder()
                .name(request.getName())
                .description(request.getDescription())
                .coverUrl(request.getCoverUrl())
                .avatarUrl(request.getAvatarUrl())
                .creator(creator)
                .privacy(request.getPrivacy() != null ? request.getPrivacy() : GroupPrivacy.PUBLIC)
                .requirePostApproval(request.isRequirePostApproval())
                .memberCount(1)
                .build();
        socialGroupRepository.save(group);

        // Creator = ADMIN
        groupMemberRepository.save(GroupMember.builder()
                .group(group).user(creator).role(MemberRole.ADMIN).approved(true).build());

        log.info("User {} đã tạo nhóm '{}'", username, request.getName());
        return toGroupResponse(group, creator);
    }

    @Transactional
    public GroupResponse updateGroup(String username, Long groupId, UpdateGroupRequest request) {
        SocialGroup group = getGroupOrThrow(groupId);
        User user = getUserOrThrow(username);
        requireAdminOrMod(group, user);

        if (request.getName() != null)
            group.setName(request.getName());
        if (request.getDescription() != null)
            group.setDescription(request.getDescription());
        if (request.getCoverUrl() != null)
            group.setCoverUrl(request.getCoverUrl());
        if (request.getAvatarUrl() != null)
            group.setAvatarUrl(request.getAvatarUrl());
        if (request.getPrivacy() != null)
            group.setPrivacy(request.getPrivacy());
        group.setRequirePostApproval(request.isRequirePostApproval());

        socialGroupRepository.save(group);
        return toGroupResponse(group, user);
    }

    @Transactional
    public void deleteGroup(String username, Long groupId) {
        SocialGroup group = getGroupOrThrow(groupId);
        User user = getUserOrThrow(username);
        requireAdmin(group, user);
        socialGroupRepository.delete(group);
        log.info("User {} đã xóa nhóm '{}'", username, group.getName());
    }

    // ==================== MEMBER MANAGEMENT ====================

    @Transactional
    @CacheEvict(value = "group-details", key = "#groupId + ':' + #username")
    public void joinGroup(String username, Long groupId) {
        SocialGroup group = getGroupOrThrow(groupId);
        User user = getUserOrThrow(username);

        if (groupMemberRepository.existsByGroupAndUser(group, user)) {
            throw new RuntimeException("Bạn đã là thành viên hoặc đang chờ duyệt");
        }

        boolean autoApprove = group.getPrivacy() == GroupPrivacy.PUBLIC;
        groupMemberRepository.save(GroupMember.builder()
                .group(group).user(user).role(MemberRole.MEMBER).approved(autoApprove).build());

        if (autoApprove) {
            group.setMemberCount(group.getMemberCount() + 1);
            socialGroupRepository.save(group);
            log.info("User {} đã tham gia nhóm '{}'", username, group.getName());
        } else {
            log.info("User {} đã gửi yêu cầu tham gia nhóm '{}'", username, group.getName());
        }
    }

    @Transactional
    @CacheEvict(value = "group-details", allEntries = true)
    public void leaveGroup(String username, Long groupId) {
        SocialGroup group = getGroupOrThrow(groupId);
        User user = getUserOrThrow(username);
        groupMemberRepository.deleteByGroupAndUser(group, user);
        group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
        socialGroupRepository.save(group);
        log.info("User {} đã rời nhóm '{}'", username, group.getName());
    }

    @Transactional
    @CacheEvict(value = "group-details", allEntries = true)
    public void approveJoinRequest(String adminUsername, Long groupId, Long userId) {
        SocialGroup group = getGroupOrThrow(groupId);
        User admin = getUserOrThrow(adminUsername);
        requireAdminOrMod(group, admin);

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        GroupMember member = groupMemberRepository.findByGroupAndUser(group, targetUser)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu tham gia"));

        member.setApproved(true);
        groupMemberRepository.save(member);
        group.setMemberCount(group.getMemberCount() + 1);
        socialGroupRepository.save(group);

        notificationService.sendNotification(
                targetUser, admin, NotificationType.GROUP_JOIN_ACCEPT,
                group.getId(), TargetType.GROUP, "/groups/" + group.getId());

        log.info("Admin {} đã duyệt {} vào nhóm '{}'", adminUsername, targetUser.getUsername(), group.getName());
    }

    @Transactional
    @CacheEvict(value = "group-details", allEntries = true)
    public void kickMember(String adminUsername, Long groupId, Long userId) {
        SocialGroup group = getGroupOrThrow(groupId);
        User admin = getUserOrThrow(adminUsername);
        requireAdminOrMod(group, admin);

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        groupMemberRepository.deleteByGroupAndUser(group, targetUser);
        group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
        socialGroupRepository.save(group);

        notificationService.sendNotification(
                targetUser, admin, NotificationType.GROUP_KICK,
                group.getId(), TargetType.GROUP, "/groups/" + group.getId());

        log.info("Admin {} đã xóa {} khỏi nhóm '{}'", adminUsername, targetUser.getUsername(), group.getName());
    }

    @Transactional
    public void inviteToGroup(String username, Long groupId, Long friendId) {
        SocialGroup group = getGroupOrThrow(groupId);
        User user = getUserOrThrow(username);

        // Kiểm tra xem user có phải thành viên của nhóm không (hoặc là admin)
        boolean isMember = groupMemberRepository.findByGroupAndUser(group, user)
                .map(GroupMember::isApproved).orElse(false);
        if (!isMember) {
            throw new RuntimeException("Bạn phải là thành viên để mời người khác");
        }

        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Kiểm tra xem bạn bè đã trong nhóm chưa
        boolean friendInGroup = groupMemberRepository.findByGroupAndUser(group, friend).isPresent();
        if (friendInGroup) {
            throw new RuntimeException("Người này đã tham gia hoặc gửi yêu cầu vào nhóm");
        }

        notificationService.sendNotification(
                friend, user, NotificationType.GROUP_INVITE,
                group.getId(), TargetType.GROUP, "/groups/" + group.getId());

        log.info("User {} đã mời {} vào nhóm '{}'", username, friend.getUsername(), group.getName());
    }

    @Transactional
    public void changeRole(String adminUsername, Long groupId, Long userId, MemberRole newRole) {
        SocialGroup group = getGroupOrThrow(groupId);
        User admin = getUserOrThrow(adminUsername);
        requireAdmin(group, admin);

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        GroupMember member = groupMemberRepository.findByGroupAndUser(group, targetUser)
                .orElseThrow(() -> new RuntimeException("User không phải thành viên nhóm"));

        member.setRole(newRole);
        groupMemberRepository.save(member);
        log.info("Admin {} đã đổi quyền {} thành {} trong nhóm '{}'",
                adminUsername, targetUser.getUsername(), newRole, group.getName());
    }

    // ==================== GROUP FEED & POST APPROVAL ====================

    @Transactional
    public void approveGroupPost(String adminUsername, Long groupId, Long postId) {
        SocialGroup group = getGroupOrThrow(groupId);
        User admin = getUserOrThrow(adminUsername);
        requireAdminOrMod(group, admin);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        if (post.getGroup() == null || !post.getGroup().getId().equals(groupId)) {
            throw new RuntimeException("Bài viết không thuộc nhóm này");
        }

        post.setGroupPostStatus(GroupPostStatus.APPROVED);
        postRepository.save(post);

        notificationService.sendNotification(
                post.getUser(), admin, NotificationType.GROUP_POST_APPROVED,
                group.getId(), TargetType.GROUP, "/groups/" + group.getId());
    }

    // ==================== QUERIES ====================

    @Transactional(readOnly = true)
    public Page<MemberResponse> getGroupMembers(Long groupId, Pageable pageable) {
        SocialGroup group = getGroupOrThrow(groupId);
        return groupMemberRepository.findByGroupAndApprovedTrue(group, pageable)
                .map(this::toMemberResponse);
    }

    @Transactional(readOnly = true)
    public Page<MemberResponse> getPendingRequests(Long groupId, Pageable pageable) {
        SocialGroup group = getGroupOrThrow(groupId);
        return groupMemberRepository.findByGroupAndApprovedFalse(group, pageable)
                .map(this::toMemberResponse);
    }

    @Transactional(readOnly = true)
    public Page<GroupResponse> getMyGroups(String username, Pageable pageable) {
        User user = getUserOrThrow(username);
        return groupMemberRepository.findByUserAndApprovedTrue(user, pageable)
                .map(m -> toGroupResponse(m.getGroup(), user));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "group-details", key = "#groupId + ':' + #username")
    public GroupResponse getGroupById(String username, Long groupId) {
        SocialGroup group = getGroupOrThrow(groupId);
        User currentUser = getUserOrThrow(username);
        return toGroupResponse(group, currentUser);
    }

    @Transactional(readOnly = true)
    public Page<GroupResponse> searchGroups(String keyword, String username, Pageable pageable) {
        Page<SocialGroup> groupsPage = socialGroupRepository
                .findByNameContainingIgnoreCaseOrderByMemberCountDesc(keyword, pageable);

        if (groupsPage.isEmpty()) {
            return Page.empty(pageable);
        }

        User currentUser = null;
        java.util.Map<Long, GroupMember> membershipMap = new java.util.HashMap<>();

        if (username != null) {
            currentUser = userRepository.findByUsername(username).orElse(null);
            if (currentUser != null) {
                List<SocialGroup> groupsList = groupsPage.getContent();
                List<GroupMember> memberships = groupMemberRepository.findByUserAndGroupIn(currentUser, groupsList);
                for (GroupMember m : memberships) {
                    membershipMap.put(m.getGroup().getId(), m);
                }
            }
        }

        User finalCurrentUser = currentUser;
        return groupsPage.map(group -> {
            GroupResponse.GroupResponseBuilder builder = GroupResponse.builder()
                    .id(group.getId())
                    .name(group.getName())
                    .description(group.getDescription())
                    .coverUrl(group.getCoverUrl())
                    .avatarUrl(group.getAvatarUrl())
                    .privacy(group.getPrivacy())
                    .requirePostApproval(group.isRequirePostApproval())
                    .memberCount(group.getMemberCount())
                    .creatorUsername(group.getCreator().getUsername())
                    .createdAt(group.getCreatedAt());

            if (finalCurrentUser != null) {
                GroupMember member = membershipMap.get(group.getId());
                builder.isMember(member != null);
                builder.isApprovedMember(member != null && member.isApproved());
            } else {
                builder.isMember(false);
                builder.isApprovedMember(false);
            }
            return builder.build();
        });
    }

    // ==================== HELPERS ====================

    private SocialGroup getGroupOrThrow(Long groupId) {
        return socialGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm"));
    }

    private User getUserOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
    }

    private void requireAdmin(SocialGroup group, User user) {
        GroupMember member = groupMemberRepository.findByGroupAndUser(group, user)
                .orElseThrow(() -> new RuntimeException("Bạn không phải thành viên nhóm"));
        if (member.getRole() != MemberRole.ADMIN) {
            throw new RuntimeException("Chỉ Admin mới có quyền thực hiện");
        }
    }

    private void requireAdminOrMod(SocialGroup group, User user) {
        GroupMember member = groupMemberRepository.findByGroupAndUser(group, user)
                .orElseThrow(() -> new RuntimeException("Bạn không phải thành viên nhóm"));
        if (member.getRole() != MemberRole.ADMIN && member.getRole() != MemberRole.MODERATOR) {
            throw new RuntimeException("Chỉ Admin hoặc Moderator mới có quyền thực hiện");
        }
    }

    // ==================== MAPPERS ====================

    private GroupResponse toGroupResponse(SocialGroup group, User currentUser) {
        GroupResponse.GroupResponseBuilder builder = GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .coverUrl(group.getCoverUrl())
                .avatarUrl(group.getAvatarUrl())
                .privacy(group.getPrivacy())
                .requirePostApproval(group.isRequirePostApproval())
                .memberCount(group.getMemberCount())
                .creatorUsername(group.getCreator().getUsername())
                .createdAt(group.getCreatedAt());

        if (currentUser != null) {
            var memberOpt = groupMemberRepository.findByGroupAndUser(group, currentUser);
            builder.isMember(memberOpt.isPresent());
            builder.isApprovedMember(memberOpt.map(GroupMember::isApproved).orElse(false));
        }
        return builder.build();
    }

    private MemberResponse toMemberResponse(GroupMember member) {
        User user = member.getUser();
        return MemberResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }

    // ==================== DTOs ====================

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CreateGroupRequest {
        private String name;
        private String description;
        private String coverUrl;
        private String avatarUrl;
        private GroupPrivacy privacy;
        private boolean requirePostApproval;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UpdateGroupRequest {
        private String name;
        private String description;
        private String coverUrl;
        private String avatarUrl;
        private GroupPrivacy privacy;
        private boolean requirePostApproval;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GroupResponse {
        private Long id;
        private String name;
        private String description;
        private String coverUrl;
        private String avatarUrl;
        private GroupPrivacy privacy;
        private Boolean requirePostApproval;
        private int memberCount;
        private String creatorUsername;
        private Boolean isMember; // true nếu đã gửi yêu cầu hoặc đã vào nhóm
        private Boolean isApprovedMember; // true chỉ khi đã được duyệt
        private LocalDateTime createdAt;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class MemberResponse {
        private Long userId;
        private String username;
        private String fullName;
        private String avatarUrl;
        private MemberRole role;
        private LocalDateTime joinedAt;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RoleChangeRequest {
        private MemberRole role;
    }
}
