package com.vtn.social_network.service;

import com.vtn.social_network.entity.Post;
import com.vtn.social_network.entity.PostShare;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.NotificationType;
import com.vtn.social_network.enums.TargetType;
import com.vtn.social_network.repository.PostRepository;
import com.vtn.social_network.repository.PostShareRepository;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShareService {

    private final PostShareRepository postShareRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PostService postService;

    @Transactional
    public void sharePost(String username, Long postId, String content) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        PostShare share = PostShare.builder()
                .user(user)
                .originalPost(post)
                .content(content)
                .build();
        postShareRepository.save(share);

        // CREATE A NEW POST IN THE FEED SO IT APPEARS ON THE WALL
        String shareContent = "";
        if (content != null && !content.trim().isEmpty()) {
            shareContent = content + "\n\n";
        }
        shareContent += "🔄 Đã chia sẻ bài viết của " + post.getUser().getFullName() 
                + "\n👉 Xem bài viết gốc tại: https://vutiennam-20225055.id.vn/post/" + post.getId();

        Post newFeedPost = Post.builder()
                .user(user)
                .content(shareContent)
                .build();
        postRepository.save(newFeedPost);

        // Notify tác giả bài gốc
        if (!post.getUser().getId().equals(user.getId())) {
            notificationService.sendNotification(
                    post.getUser(), user, NotificationType.SHARE_POST,
                    post.getId(), TargetType.POST, "/posts/" + post.getId());
        }

        log.info("User {} đã chia sẻ bài viết {}", username, postId);

        // Push real-time count update
        postService.pushPostCounts(postId);
    }

    @Transactional(readOnly = true)
    public Page<ShareResponse> getShares(Long postId, int page, int size) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        Pageable pageable = PageRequest.of(page, size);
        return postShareRepository.findByOriginalPostOrderByCreatedAtDesc(post, pageable)
                .map(this::toShareResponse);
    }

    @Transactional(readOnly = true)
    public long getShareCount(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));
        return postShareRepository.countByOriginalPost(post);
    }

    private ShareResponse toShareResponse(PostShare share) {
        User user = share.getUser();
        return ShareResponse.builder()
                .id(share.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .content(share.getContent())
                .createdAt(share.getCreatedAt())
                .build();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ShareResponse {
        private Long id;
        private String username;
        private String fullName;
        private String avatarUrl;
        private String content;
        private LocalDateTime createdAt;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ShareRequest {
        private String content;
    }
}
