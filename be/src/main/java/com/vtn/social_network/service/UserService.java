package com.vtn.social_network.service;

import com.vtn.social_network.dto.user.request.UpdateProfileRequest;
import com.vtn.social_network.dto.user.response.UserProfileResponse;
import com.vtn.social_network.entity.Friendship;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.FriendshipStatus;
import com.vtn.social_network.repository.FollowRepository;
import com.vtn.social_network.repository.FriendshipRepository;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final FollowRepository followRepository;
    private final PresenceService presenceService;

    public UserProfileResponse getProfile(String viewerUsername, String targetUsername) {
        User viewer = userRepository.findByUsername(viewerUsername)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        // Kiểm tra block
        Optional<Friendship> friendshipOpt = friendshipRepository.findFriendshipBetween(viewer, target);
        boolean isBlocked = friendshipOpt
                .map(f -> f.getStatus() == FriendshipStatus.BLOCKED)
                .orElse(false);
        if (isBlocked) {
            throw new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage());
        }

        return toProfileResponse(viewer, target, friendshipOpt);
    }

    public UserProfileResponse updateProfile(String currentUsername, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        // Manual mapping: chỉ cập nhật field nào client gửi lên (không null)
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
        }
        if (request.getWebsite() != null) {
            user.setWebsite(request.getWebsite());
        }
        if (request.getBirthDate() != null) {
            user.setBirthDate(request.getBirthDate());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getRelationshipStatus() != null) {
            user.setRelationshipStatus(request.getRelationshipStatus());
        }

        userRepository.save(user);
        log.info("Đã cập nhật profile cho user: {}", currentUsername);

        return toProfileResponse(user);
    }

    public UserProfileResponse updatePrivacy(String currentUsername,
            com.vtn.social_network.dto.user.request.PrivacyUpdateRequest request) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        if (request.getFriendListVisibility() != null) {
            user.setFriendListVisibility(request.getFriendListVisibility());
        }

        userRepository.save(user);
        log.info("Đã cập nhật quyền riêng tư cho user: {}", currentUsername);

        return toProfileResponse(user);
    }

    // ========== Upload ==========

    public UserProfileResponse updateAvatar(String username, String avatarUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        log.info("Đã cập nhật avatar cho user: {}", username);
        return toProfileResponse(user);
    }

    public UserProfileResponse updateCover(String username, String coverUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        user.setCoverUrl(coverUrl);
        userRepository.save(user);
        log.info("Đã cập nhật cover cho user: {}", username);
        return toProfileResponse(user);
    }

    // ========== Helper ==========

    private UserProfileResponse toProfileResponse(User viewer, User target, Optional<Friendship> friendshipOpt) {
        // --- friendshipStatus tính từ góc nhìn của viewer ---
        String friendshipStatus = "NONE";
        boolean isBlocked = false;

        if (friendshipOpt.isPresent()) {
            Friendship f = friendshipOpt.get();
            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                friendshipStatus = "FRIEND";
            } else if (f.getStatus() == FriendshipStatus.PENDING) {
                // Nếu viewer là requester → viewer đã gửi, target nhận
                if (f.getRequester().getId().equals(viewer.getId())) {
                    friendshipStatus = "PENDING_SENT";
                } else {
                    // viewer là addressee → target gửi cho viewer, viewer cần chấp nhận
                    friendshipStatus = "PENDING_RECEIVED";
                }
            } else if (f.getStatus() == FriendshipStatus.BLOCKED) {
                isBlocked = true;
            }
        }

        // --- Counts ---
        long friendCount = friendshipRepository
                .findFriendsByUserAndStatus(target, FriendshipStatus.ACCEPTED)
                .size();
        long followerCount = followRepository.countByFollowing(target);
        long followingCount = followRepository.countByFollower(target);

        // --- isFollowing (viewer có đang follow target không) ---
        boolean isFollowing = !viewer.getId().equals(target.getId())
                && followRepository.existsByFollowerAndFollowing(viewer, target);

        // --- isOnline ---
        boolean isOnline = presenceService.isUserOnline(target.getUsername());

        return UserProfileResponse.builder()
                .id(target.getId())
                .username(target.getUsername())
                .email(target.getEmail())
                .fullName(target.getFullName())
                .avatarUrl(target.getAvatarUrl())
                .coverUrl(target.getCoverUrl())
                .bio(target.getBio())
                .location(target.getLocation())
                .website(target.getWebsite())
                .birthDate(target.getBirthDate())
                .gender(target.getGender())
                .relationshipStatus(target.getRelationshipStatus() != null ? target.getRelationshipStatus().name() : null)
                .friendListVisibility(target.getFriendListVisibility())
                .createdAt(target.getCreatedAt())
                // computed
                .friendshipStatus(friendshipStatus)
                .friendCount(friendCount)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .isFollowing(isFollowing)
                .isBlocked(isBlocked)
                .isOnline(isOnline)
                .build();
    }

    // Overload: dùng khi không cần context viewer (gọi nội bộ như updateProfile)
    private UserProfileResponse toProfileResponse(User user) {
        return toProfileResponse(user, user, Optional.empty());
    }
}
