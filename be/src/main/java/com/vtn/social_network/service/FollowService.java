package com.vtn.social_network.service;

import com.vtn.social_network.dto.user.response.FriendResponse;
import com.vtn.social_network.entity.Follow;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.NotificationType;
import com.vtn.social_network.enums.TargetType;
import com.vtn.social_network.repository.FollowRepository;
import com.vtn.social_network.repository.FriendshipRepository;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Follow một user.
     * - Kiểm tra tài khoản có cho phép public followers không
     * (allowPublicFollowers).
     * - Kiểm tra block hai chiều.
     * - Tránh duplicate bằng existsBy.
     */
    @Transactional
    public void follow(String followerUsername, Long targetUserId) {
        User follower = getUserByUsername(followerUsername);
        User following = getUserById(targetUserId);

        if (follower.getId().equals(following.getId())) {
            throw new RuntimeException("Bạn không thể tự theo dõi chính mình");
        }

        // Kiểm tra bị block (cả 2 chiều)
        boolean isBlocked = friendshipRepository.findFriendshipBetween(follower, following)
                .map(f -> f.getStatus() == com.vtn.social_network.enums.FriendshipStatus.BLOCKED)
                .orElse(false);
        if (isBlocked) {
            throw new RuntimeException("Không thể theo dõi người dùng này");
        }

        // Kiểm tra tài khoản riêng tư
        if (!following.isAllowPublicFollowers()) {
            throw new RuntimeException("Tài khoản này không cho phép người lạ theo dõi. Hãy kết bạn trước.");
        }

        // Tránh follow trùng lặp
        if (followRepository.existsByFollowerAndFollowing(follower, following)) {
            throw new RuntimeException("Bạn đã theo dõi người dùng này rồi");
        }

        followRepository.save(Follow.builder().follower(follower).following(following).build());

        // Gửi thông báo
        notificationService.sendNotification(
                following, follower,
                NotificationType.FOLLOWED, following.getId(),
                TargetType.USER, "/profile/" + following.getUsername());

        log.info("User {} đã theo dõi user {}", follower.getUsername(), following.getUsername());
    }

    /**
     * Bỏ theo dõi một user.
     */
    @Transactional
    public void unfollow(String followerUsername, Long targetUserId) {
        User follower = getUserByUsername(followerUsername);
        User following = getUserById(targetUserId);

        if (!followRepository.existsByFollowerAndFollowing(follower, following)) {
            throw new RuntimeException("Bạn chưa theo dõi người dùng này");
        }

        followRepository.deleteByFollowerAndFollowing(follower, following);
        log.info("User {} đã bỏ theo dõi user {}", follower.getUsername(), following.getUsername());
    }

    /**
     * Danh sách Followers của một user (những ai đang theo dõi user đó).
     */
    public List<FriendResponse> getFollowers(Long userId) {
        User user = getUserById(userId);
        return followRepository.findByFollowing(user)
                .stream()
                .map(f -> toResponse(f.getFollower()))
                .collect(Collectors.toList());
    }

    /**
     * Danh sách Following của một user (user đó đang theo dõi ai).
     */
    public List<FriendResponse> getFollowing(Long userId) {
        User user = getUserById(userId);
        return followRepository.findByFollower(user)
                .stream()
                .map(f -> toResponse(f.getFollowing()))
                .collect(Collectors.toList());
    }

    /**
     * Cập nhật cài đặt tài khoản: Cho phép / không cho phép public follow.
     */
    @Transactional
    public void updateFollowPrivacy(String username, boolean allowPublicFollowers) {
        User user = getUserByUsername(username);
        user.setAllowPublicFollowers(allowPublicFollowers);
        userRepository.save(user);
        log.info("User {} đã cập nhật allowPublicFollowers = {}", username, allowPublicFollowers);
    }

    // ==================== Internal Helpers (used by FriendshipService)
    // ====================

    /**
     * Dùng nội bộ khi Accept Friend Request để auto-follow 2 chiều.
     */
    @Transactional
    public void autoFollowBothWays(User userA, User userB) {
        if (!followRepository.existsByFollowerAndFollowing(userA, userB)) {
            followRepository.save(Follow.builder().follower(userA).following(userB).build());
        }
        if (!followRepository.existsByFollowerAndFollowing(userB, userA)) {
            followRepository.save(Follow.builder().follower(userB).following(userA).build());
        }
    }

    /**
     * Dùng nội bộ khi Unfriend hoặc Block để xóa follow 2 chiều.
     */
    @Transactional
    public void removeFollowBothWays(User userA, User userB) {
        followRepository.deleteByFollowerAndFollowing(userA, userB);
        followRepository.deleteByFollowerAndFollowing(userB, userA);
    }

    // ==================== Private Helpers ====================

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
    }

    private User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
    }

    private FriendResponse toResponse(User user) {
        return FriendResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
