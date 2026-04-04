package com.vtn.social_network.service;

import com.vtn.social_network.dto.user.response.FriendResponse;
import com.vtn.social_network.entity.Friendship;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.FriendshipStatus;
import com.vtn.social_network.enums.NotificationType;
import com.vtn.social_network.enums.TargetType;
import com.vtn.social_network.enums.Visibility;
import com.vtn.social_network.repository.FriendshipRepository;
import com.vtn.social_network.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final FollowService followService;

    @Autowired
    public FriendshipService(FriendshipRepository friendshipRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            @Lazy FollowService followService) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.followService = followService;
    }

    @Transactional
    public void sendFriendRequest(String senderUsername, Long targetUserId) {
        User sender = getUserByUsername(senderUsername);
        User target = getUserById(targetUserId);

        if (sender.getId().equals(target.getId())) {
            throw new RuntimeException("Không thể tự kết bạn với chính mình");
        }

        Optional<Friendship> existingOpt = friendshipRepository.findFriendshipBetween(sender, target);
        if (existingOpt.isPresent()) {
            Friendship existing = existingOpt.get();
            if (existing.getStatus() == FriendshipStatus.BLOCKED) {
                throw new RuntimeException("Không thể gửi lời mời kết bạn");
            } else if (existing.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new RuntimeException("Hai người đã là bạn bè");
            } else if (existing.getStatus() == FriendshipStatus.PENDING) {
                if (existing.getRequester().getId().equals(sender.getId())) {
                    throw new RuntimeException("Bạn đã gửi yêu cầu kết bạn rồi, đang chờ đợi phản hồi");
                } else {
                    throw new RuntimeException("Người này đã gửi yêu cầu kết bạn cho bạn rồi, hãy chấp nhận nó");
                }
            } else if (existing.getStatus() == FriendshipStatus.BLOCKED) {
                throw new RuntimeException("Không thể thực hiện hành động này");
            }
        }

        Friendship friendship = Friendship.builder()
                .requester(sender)
                .addressee(target)
                .status(FriendshipStatus.PENDING)
                .build();
        friendshipRepository.save(friendship);

        notificationService.sendNotification(target, sender, NotificationType.FRIEND_REQ, sender.getId(),
                TargetType.USER, "/users/" + sender.getUsername());
        log.info("User {} đã gửi lời mời kết bạn cho User ID {}", senderUsername, targetUserId);
    }

    @Transactional
    public void acceptFriendRequest(String approverUsername, Long senderUserId) {
        User approver = getUserByUsername(approverUsername);
        User sender = getUserById(senderUserId);

        Friendship friendship = friendshipRepository.findFriendshipBetween(sender, approver)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời kết bạn"));

        if (friendship.getStatus() == FriendshipStatus.ACCEPTED) {
            throw new RuntimeException("Hai người đã là bạn bè");
        }

        // Đảm bảo người chấp nhận phải là Addressee
        if (!friendship.getAddressee().getId().equals(approver.getId())) {
            throw new RuntimeException("Bạn không thể chấp nhận yêu cầu này");
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendshipRepository.save(friendship);

        // Auto-follow cả 2 chiều khi chấp nhận kết bạn
        followService.autoFollowBothWays(sender, approver);

        notificationService.sendNotification(sender, approver, NotificationType.FRIEND_ACCEPT, approver.getId(),
                TargetType.USER, "/users/" + approver.getUsername());
        log.info("User {} đã chấp nhận lời mời kết bạn của User ID {}", approverUsername, senderUserId);
    }

    @Transactional
    public void rejectFriendRequest(String rejectorUsername, Long senderUserId) {
        User rejector = getUserByUsername(rejectorUsername);
        User sender = getUserById(senderUserId);

        Friendship friendship = friendshipRepository.findFriendshipBetween(sender, rejector)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời kết bạn"));

        if (!friendship.getAddressee().getId().equals(rejector.getId())
                || friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new RuntimeException("Không thể huỷ lời mời kết bạn này");
        }

        friendshipRepository.delete(friendship);
        log.info("User {} đã từ chối lời mời kết bạn của User ID {}", rejectorUsername, senderUserId);
    }

    @Transactional
    public void unfriend(String currentUsername, Long friendUserId) {
        User currentUser = getUserByUsername(currentUsername);
        User friendUser = getUserById(friendUserId);

        Friendship friendship = friendshipRepository.findFriendshipBetween(currentUser, friendUser)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quan hệ bạn bè"));

        if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new RuntimeException("Hai người chưa phải là bạn bè");
        }

        friendshipRepository.delete(friendship);
        // Xóa follow 2 chiều khi hủy kết bạn
        followService.removeFollowBothWays(currentUser, friendUser);
        log.info("User {} đã huỷ kết bạn với User ID {}", currentUsername, friendUserId);
    }

    public List<FriendResponse> getPendingRequests(String currentUsername) {
        User currentUser = getUserByUsername(currentUsername);
        List<Friendship> pendings = friendshipRepository.findByAddresseeAndStatus(currentUser,
                FriendshipStatus.PENDING);
        return pendings.stream()
                .map(f -> toFriendResponse(f.getRequester()))
                .collect(Collectors.toList());
    }

    public List<FriendResponse> getFriendsList(String requesterUsername, String targetUsername) {
        User requester = getUserByUsername(requesterUsername);
        User targetUser = getUserByUsername(targetUsername);

        // Security Check: Quyền riêng tư danh sách bạn bè
        Visibility privacy = targetUser.getFriendListVisibility();
        boolean isOwner = requester.getId().equals(targetUser.getId());

        if (!isOwner) {
            if (privacy == Visibility.PRIVATE) {
                throw new RuntimeException("Người dùng đã thiết lập danh sách bạn bè riêng tư");
            } else if (privacy == Visibility.FRIENDS) {
                boolean areFriends = isFriend(requester, targetUser);
                if (!areFriends) {
                    throw new RuntimeException("Chỉ bạn bè mới có thể xem danh sách này");
                }
            }
        }

        List<Friendship> acceptedFriendships = friendshipRepository.findFriendsByUserAndStatus(targetUser,
                FriendshipStatus.ACCEPTED);

        return acceptedFriendships.stream()
                .map(f -> {
                    // Extract the other user from the friendship
                    return f.getRequester().getId().equals(targetUser.getId()) ? f.getAddressee() : f.getRequester();
                })
                .map(this::toFriendResponse)
                .collect(Collectors.toList());
    }

    public boolean isFriend(User u1, User u2) {
        return friendshipRepository.findFriendshipBetween(u1, u2)
                .map(f -> f.getStatus() == FriendshipStatus.ACCEPTED)
                .orElse(false);
    }

    @Transactional
    public void blockUser(String currentUsername, Long targetUserId) {
        User currentUser = getUserByUsername(currentUsername);
        User targetUser = getUserById(targetUserId);

        if (currentUser.getId().equals(targetUser.getId())) {
            throw new RuntimeException("Bạn không thể chặn chính mình");
        }

        Optional<Friendship> existingOpt = friendshipRepository.findFriendshipBetween(currentUser, targetUser);

        if (existingOpt.isPresent()) {
            Friendship existing = existingOpt.get();
            if (existing.getStatus() == FriendshipStatus.BLOCKED
                    && existing.getRequester().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Người dùng này đã bị bạn chặn");
            }
            // Nếu đã tồn tại bất kỳ quan hệ nào (PENDING, ACCEPTED, hoặc đang bị người kia
            // chặn),
            // xoá record cũ và ghi đè record mới do mình làm requester (người chủ động
            // chặn).
            friendshipRepository.delete(existing);
            friendshipRepository.flush();
        }

        Friendship blockedRelation = Friendship.builder()
                .requester(currentUser)
                .addressee(targetUser)
                .status(FriendshipStatus.BLOCKED)
                .build();
        friendshipRepository.save(blockedRelation);
        // Xóa follow 2 chiều khi Block
        followService.removeFollowBothWays(currentUser, targetUser);
        log.info("User {} đã chặn User ID {}", currentUsername, targetUserId);
    }

    @Transactional
    public void unblockUser(String currentUsername, Long targetUserId) {
        User currentUser = getUserByUsername(currentUsername);
        User targetUser = getUserById(targetUserId);

        Friendship existing = friendshipRepository.findFriendshipBetween(currentUser, targetUser)
                .orElseThrow(() -> new RuntimeException("Người dùng chưa bị chặn"));

        if (existing.getStatus() != FriendshipStatus.BLOCKED
                || !existing.getRequester().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Bạn không thể bỏ chặn người này (hoặc người này đang chặn bạn)");
        }

        friendshipRepository.delete(existing);
        log.info("User {} đã BỎ chặn User ID {}", currentUsername, targetUserId);
    }

    public List<FriendResponse> getBlockedUsers(String currentUsername) {
        User currentUser = getUserByUsername(currentUsername);

        return friendshipRepository.findByRequesterAndStatus(currentUser, FriendshipStatus.BLOCKED)
                .stream()
                .map(f -> toFriendResponse(f.getAddressee()))
                .collect(Collectors.toList());
    }

    public boolean isBlocked(User viewer, User target) {
        return friendshipRepository.findFriendshipBetween(viewer, target)
                .map(f -> f.getStatus() == FriendshipStatus.BLOCKED)
                .orElse(false);
    }

    public List<FriendResponse> getFriendSuggestions(String currentUsername) {
        User currentUser = getUserByUsername(currentUsername);
        List<Object[]> results = userRepository.findFriendSuggestions(currentUser.getId(), 10);

        List<FriendResponse> suggestions = new java.util.ArrayList<>();
        for (Object[] row : results) {
            Long id = ((Number) row[0]).longValue();
            String username = (String) row[1];
            String fullName = (String) row[2];
            String avatarUrl = (String) row[3];
            Integer mutualFriendsCount = ((Number) row[4]).intValue();

            suggestions.add(FriendResponse.builder()
                    .id(id)
                    .username(username)
                    .fullName(fullName)
                    .avatarUrl(avatarUrl)
                    .mutualFriendsCount(mutualFriendsCount)
                    .build());
        }
        return suggestions;
    }

    // Helper methods
    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
    }

    private User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
    }

    private FriendResponse toFriendResponse(User user) {
        return FriendResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .mutualFriendsCount(0) // TODO: Phase sau xử lý sau
                .build();
    }
}
