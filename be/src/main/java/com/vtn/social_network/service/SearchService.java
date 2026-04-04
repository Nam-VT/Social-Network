package com.vtn.social_network.service;

import com.vtn.social_network.dto.post.response.PostResponse;
import com.vtn.social_network.dto.user.response.UserProfileResponse;

import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.FriendshipStatus;
import com.vtn.social_network.enums.Visibility;
import com.vtn.social_network.repository.FriendshipRepository;
import com.vtn.social_network.search.PostDocument;
import com.vtn.social_network.search.PostSearchRepository;
import com.vtn.social_network.search.UserDocument;
import com.vtn.social_network.search.UserSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final UserSearchRepository userSearchRepository;
    private final PostSearchRepository postSearchRepository;
    private final FriendshipRepository friendshipRepository;

    /**
     * Tìm kiếm người dùng theo keyword (username hoặc họ tên).
     * Loại bỏ những user bị Block bởi người tìm kiếm.
     */
    public List<UserProfileResponse> searchUsers(String keyword, User currentUser) {
        List<UserDocument> results = userSearchRepository
                .findByUsernameContainingOrFullNameContaining(keyword, keyword);

        // Lấy danh sách userId bị Block (cả 2 chiều)
        Set<Long> blockedUserIds = getBlockedUserIds(currentUser);

        return results.stream()
                .filter(doc -> !blockedUserIds.contains(doc.getId()))
                .map(this::toUserProfileResponse)
                .collect(Collectors.toList());
    }

    /**
     * Tìm kiếm bài viết theo keyword (nội dung).
     * Lọc Visibility: chỉ trả về bài PUBLIC hoặc bài FRIENDS nếu đang là bạn bè.
     * Loại bỏ bài của user bị Block.
     */
    public List<PostResponse> searchPosts(String keyword, User currentUser) {
        List<PostDocument> results = postSearchRepository.findByContentContaining(keyword);

        Set<Long> blockedUserIds = getBlockedUserIds(currentUser);
        Set<Long> friendIds = getFriendIds(currentUser);

        return results.stream()
                .filter(doc -> !blockedUserIds.contains(doc.getAuthorId()))
                .filter(doc -> {
                    // Bài của chính mình → luôn hiện
                    if (doc.getAuthorId().equals(currentUser.getId()))
                        return true;
                    // Bài PUBLIC → hiện cho tất cả
                    if ("PUBLIC".equals(doc.getVisibility()))
                        return true;
                    // Bài FRIENDS → chỉ hiện nếu đang là bạn bè
                    if ("FRIENDS".equals(doc.getVisibility()))
                        return friendIds.contains(doc.getAuthorId());
                    // Bài PRIVATE → chỉ chủ bài thấy
                    return false;
                })
                .map(this::toPostResponse)
                .collect(Collectors.toList());
    }

    // ========== Helpers ==========

    private Set<Long> getBlockedUserIds(User currentUser) {
        // Lấy tất cả quan hệ BLOCKED mà user này là requester
        return friendshipRepository.findByRequesterAndStatus(currentUser, FriendshipStatus.BLOCKED)
                .stream()
                .map(f -> f.getAddressee().getId())
                .collect(Collectors.toSet());
    }

    private Set<Long> getFriendIds(User currentUser) {
        return friendshipRepository.findFriendsByUserAndStatus(currentUser, FriendshipStatus.ACCEPTED)
                .stream()
                .map(f -> {
                    // Trả về ID của người kia (không phải chính mình)
                    if (f.getRequester().getId().equals(currentUser.getId())) {
                        return f.getAddressee().getId();
                    }
                    return f.getRequester().getId();
                })
                .collect(Collectors.toSet());
    }

    private UserProfileResponse toUserProfileResponse(UserDocument doc) {
        return UserProfileResponse.builder()
                .id(doc.getId())
                .username(doc.getUsername())
                .fullName(doc.getFullName())
                .bio(doc.getBio())
                .avatarUrl(doc.getAvatarUrl())
                .build();
    }

    private PostResponse toPostResponse(PostDocument doc) {
        return PostResponse.builder()
                .id(doc.getId())
                .content(doc.getContent())
                .authorId(doc.getAuthorId())
                .authorUsername(doc.getAuthorUsername())
                .authorFullName(doc.getAuthorFullName())
                .visibility(Visibility.valueOf(doc.getVisibility()))
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
