package com.vtn.social_network.service;

import com.vtn.social_network.dto.post.request.CreatePostRequest;
import com.vtn.social_network.dto.post.request.UpdatePostRequest;
import com.vtn.social_network.dto.post.response.PostResponse;
import com.vtn.social_network.entity.*;
import com.vtn.social_network.enums.*;
import com.vtn.social_network.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final SearchIndexingService searchIndexingService;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final PostShareRepository postShareRepository;
    private final SavedPostRepository savedPostRepository;
    private final SocialGroupRepository socialGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final HashtagRepository hashtagRepository;
    private final PostHashtagRepository postHashtagRepository;
    private final PostMediaRepository postMediaRepository;
    private final NotificationService notificationService;

    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#(\\w+)");
    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w+)");

    @Transactional
    public PostResponse createPost(String username, CreatePostRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        Post post = Post.builder()
                .user(user)
                .content(request.getContent())
                .visibility(request.getVisibility() != null ? request.getVisibility() : Visibility.PUBLIC)
                .build();

        // Group post
        if (request.getGroupId() != null) {
            SocialGroup group = socialGroupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm"));
            GroupMember member = groupMemberRepository.findByGroupAndUser(group, user)
                    .orElseThrow(() -> new RuntimeException("Bạn không phải thành viên nhóm"));
            if (!member.isApproved()) {
                throw new RuntimeException("Yêu cầu tham gia nhóm chưa được duyệt");
            }
            post.setGroup(group);
            post.setGroupPostStatus(group.isRequirePostApproval() ? GroupPostStatus.PENDING : GroupPostStatus.APPROVED);
        }

        // Thêm media nếu có
        if (request.getMediaList() != null && !request.getMediaList().isEmpty()) {
            List<PostMedia> mediaList = new ArrayList<>();
            for (int i = 0; i < request.getMediaList().size(); i++) {
                CreatePostRequest.MediaItem item = request.getMediaList().get(i);
                PostMedia media = PostMedia.builder()
                        .post(post)
                        .mediaUrl(item.getMediaUrl())
                        .mediaType(item.getMediaType())
                        .position(i)
                        .build();
                mediaList.add(media);
            }
            post.setMediaList(mediaList);
        }

        postRepository.save(post);
        extractAndSaveHashtags(post);
        extractAndNotifyMentions(post);
        searchIndexingService.sendSearchIndexEvent("POST_CREATED", post.getId());
        log.info("User {} đã tạo bài viết id={}", username, post.getId());

        // Bắn event realtime qua WebSocket để client báo "Có bài viết mới"
        if (post.getVisibility() == Visibility.PUBLIC || post.getVisibility() == Visibility.FRIENDS) {
            if (post.getGroup() == null || post.getGroupPostStatus() == GroupPostStatus.APPROVED) {
                Object payload = Map.of("postId", post.getId(), "author", username);
                messagingTemplate.convertAndSend("/topic/newsfeed/new", payload);
            }
        }

        return toPostResponse(post, user);
    }

    public PostResponse getPost(String currentUsername, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        checkPostVisibility(currentUser, post);

        return toPostResponse(post, currentUser);
    }

    @Transactional
    public PostResponse updatePost(String username, Long postId, UpdatePostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        if (!post.getUser().getUsername().equals(username) && user.getRole() != UserRole.ADMIN) {
            throw new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage());
        }

        if (request.getContent() != null) {
            post.setContent(request.getContent());
        }
        if (request.getVisibility() != null) {
            post.setVisibility(request.getVisibility());
        }

        postRepository.save(post);
        extractAndSaveHashtags(post);
        extractAndNotifyMentions(post);
        searchIndexingService.sendSearchIndexEvent("POST_UPDATED", post.getId());
        log.info("User {} đã cập nhật bài viết id={}", username, postId);

        return toPostResponse(post, user);
    }

    @Transactional
    public void deletePost(String username, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        if (!post.getUser().getUsername().equals(username) && user.getRole() != UserRole.ADMIN) {
            throw new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage());
        }

        // Hibernate cascade CascadeType.ALL sẽ tự xóa post_hashtags và post_media
        postRepository.delete(post);
        searchIndexingService.sendSearchIndexEvent("POST_DELETED", post.getId());
        log.info("User {} đã xóa bài viết id={}", username, postId);
    }

    /**
     * Lấy danh sách bài viết của một user.
     * Lọc bài viết trong Group private nếu viewer không phải thành viên.
     */
    public Page<PostResponse> getUserPosts(String currentUsername,
            String targetUsername, int page, int size) {
        User targetUser = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        Pageable pageable = PageRequest.of(page, size);

        Page<Post> postPage = postRepository.findProfilePostsForUser(targetUser, currentUser, pageable);
        return toPostResponsePage(postPage, currentUser);
    }

    /**
     * News Feed: Cursor-based pagination.
     * Trả về bài viết của mình, PUBLIC, FRIENDS (nếu là bạn bè), và bài từ Groups.
     */
    public List<PostResponse> getNewsFeed(String currentUsername, LocalDateTime cursor, int size) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        LocalDateTime effectiveCursor = (cursor != null) ? cursor : LocalDateTime.now();

        List<Post> posts = postRepository
                .findNewsFeedForUser(currentUser, currentUser.getId(), effectiveCursor, PageRequest.of(0, size));

        return toPostResponseList(posts, currentUser);
    }

    // ====================== Group Feed ======================

    // Only Pageable method now

    public Page<PostResponse> getGroupFeed(String username, Long groupId, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        SocialGroup group = socialGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group không tồn tại"));

        // Nhóm PRIVATE: chỉ thành viên được xem feed
        // Nhóm PUBLIC: ai cũng được xem
        if (group.getPrivacy() == GroupPrivacy.PRIVATE) {
            requireGroupMember(group, user);
        }

        Pageable pageable = PageRequest.of(page, size);

        Page<Post> postPage = postRepository
                .findByGroupAndGroupPostStatusOrderByCreatedAtDesc(group, GroupPostStatus.APPROVED, pageable);
        return toPostResponsePage(postPage, user);
    }

    /**
     * Admin/Mod xem bài chờ duyệt.
     */
    public Page<PostResponse> getGroupPendingPosts(String username, Long groupId, Pageable pageable) {
        SocialGroup group = socialGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        requireGroupAdminOrMod(group, user);

        Page<Post> postPage = postRepository.findByGroupAndGroupPostStatusOrderByCreatedAtDesc(group, GroupPostStatus.PENDING, pageable);
        return toPostResponsePage(postPage, user);
    }

    /**
     * Admin/Mod từ chối bài viết.
     */
    @Transactional
    public void rejectGroupPost(String username, Long groupId, Long postId) {
        SocialGroup group = socialGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        requireGroupAdminOrMod(group, user);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));
        if (post.getGroup() == null || !post.getGroup().getId().equals(groupId)) {
            throw new RuntimeException("Bài viết không thuộc nhóm này");
        }
        post.setGroupPostStatus(GroupPostStatus.REJECTED);
        postRepository.save(post);
        log.info("Admin {} đã từ chối bài viết {} trong nhóm {}", username, postId, groupId);
    }

    // ====================== Real-time Count Push ======================

    /**
     * Gửi count mới qua WebSocket khi có like/comment/share.
     * Client subscribe: /topic/posts/{postId}/counts
     */
    public void pushPostCounts(Long postId) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null)
            return;

        java.util.Map<ReactionType, Long> reactionCounts = new java.util.HashMap<>();
        for (Object[] row : reactionRepository.countReactionsByType(postId, TargetType.POST)) {
            reactionCounts.put((ReactionType) row[0], (Long) row[1]);
        }

        PostCountUpdate counts = PostCountUpdate.builder()
                .postId(postId)
                .likeCount(reactionRepository.countByTargetIdAndTargetType(postId, TargetType.POST))
                .commentCount(commentRepository.countByPost(post))
                .shareCount(postShareRepository.countByOriginalPost(post))
                .reactionCounts(reactionCounts)
                .build();

        messagingTemplate.convertAndSend("/topic/posts/" + postId + "/counts", counts);
    }

    // ====================== Helper ======================

    private void checkPostVisibility(User viewer, Post post) {
        if (!isPostVisibleToUser(viewer, post)) {
            throw new RuntimeException("Bạn không có quyền xem bài viết này");
        }
    }

    private boolean isPostVisibleToUser(User viewer, Post post) {
        User author = post.getUser();
        if (author.getId().equals(viewer.getId()))
            return true;

        // Blocked check
        if (friendshipRepository.findFriendshipBetween(viewer, author)
                .map(f -> f.getStatus() == FriendshipStatus.BLOCKED).orElse(false)) {
            return false;
        }

        // Group post visibility
        if (post.getGroup() != null) {
            if (post.getGroup().getPrivacy() == GroupPrivacy.PRIVATE) {
                return groupMemberRepository.existsByGroupAndUser(post.getGroup(), viewer);
            }
            return true; // Public group posts visible to all
        }

        if (post.getVisibility() == Visibility.PRIVATE)
            return false;
        if (post.getVisibility() == Visibility.PUBLIC)
            return true;

        if (post.getVisibility() == Visibility.FRIENDS) {
            return friendshipRepository.findFriendshipBetween(viewer, author)
                    .map(f -> f.getStatus() == FriendshipStatus.ACCEPTED)
                    .orElse(false);
        }

        return false;
    }

    /**
     * Kiểm tra user là thành viên nhóm (đã approved).
     */
    public boolean isGroupMember(SocialGroup group, User user) {
        return groupMemberRepository.findByGroupAndUser(group, user)
                .map(GroupMember::isApproved)
                .orElse(false);
    }

    private void requireGroupMember(SocialGroup group, User user) {
        if (!isGroupMember(group, user)) {
            throw new RuntimeException("Bạn không phải thành viên nhóm");
        }
    }

    private void requireGroupAdminOrMod(SocialGroup group, User user) {
        GroupMember member = groupMemberRepository.findByGroupAndUser(group, user)
                .orElseThrow(() -> new RuntimeException("Bạn không phải thành viên nhóm"));
        if (member.getRole() != MemberRole.ADMIN && member.getRole() != MemberRole.MODERATOR) {
            throw new RuntimeException("Chỉ Admin hoặc Moderator mới có quyền thực hiện");
        }
    }

    // ====================== Mapper ======================

    /**
     * Batch convert danh sách Post → PostResponse với chỉ ~6 queries thay vì 8×N.
     */
    public List<PostResponse> toPostResponseList(List<Post> posts, User currentUser) {
        if (posts == null || posts.isEmpty()) return List.of();

        List<Long> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());

        // 1. Batch: like counts
        java.util.Map<Long, Long> likeCountMap = new java.util.HashMap<>();
        reactionRepository.countBatchByPostIds(postIds, TargetType.POST)
                .forEach(row -> likeCountMap.put((Long) row[0], (Long) row[1]));

        // 2. Batch: comment counts
        java.util.Map<Long, Long> commentCountMap = new java.util.HashMap<>();
        commentRepository.countBatchByPostIds(postIds)
                .forEach(row -> commentCountMap.put((Long) row[0], (Long) row[1]));

        // 3. Batch: share counts
        java.util.Map<Long, Long> shareCountMap = new java.util.HashMap<>();
        postShareRepository.countBatchByPostIds(postIds)
                .forEach(row -> shareCountMap.put((Long) row[0], (Long) row[1]));

        // 4. Batch: reaction counts by type per post
        java.util.Map<Long, java.util.Map<ReactionType, Long>> reactionTypeMap = new java.util.HashMap<>();
        reactionRepository.countBatchByTypeAndPostIds(postIds, TargetType.POST)
                .forEach(row -> {
                    Long postId = (Long) row[0];
                    ReactionType type = (ReactionType) row[1];
                    Long count = (Long) row[2];
                    reactionTypeMap.computeIfAbsent(postId, k -> new java.util.HashMap<>()).put(type, count);
                });

        // 5. Batch: user reactions + saved (if logged in)
        java.util.Map<Long, ReactionType> userReactionMap = new java.util.HashMap<>();
        java.util.Set<Long> savedPostIds = new java.util.HashSet<>();
        if (currentUser != null) {
            reactionRepository.findBatchByUserAndPostIds(currentUser, postIds, TargetType.POST)
                    .forEach(r -> userReactionMap.put(r.getTargetId(), r.getReactionType()));
            savedPostIds = savedPostRepository.findPostIdsSavedByUser(currentUser, postIds);
        }

        // 6. Batch: media per post (fix N+1)
        java.util.Map<Long, List<PostMedia>> mediaMap = new java.util.HashMap<>();
        postMediaRepository.findByPostIdInOrderByPositionAsc(postIds)
                .forEach(m -> mediaMap.computeIfAbsent(m.getPost().getId(), k -> new ArrayList<>()).add(m));

        // 7. Batch: collect all @mention usernames, resolve in ONE query
        java.util.Set<String> allMentions = new java.util.HashSet<>();
        posts.forEach(p -> {
            if (p.getContent() != null) {
                java.util.regex.Matcher m = MENTION_PATTERN.matcher(p.getContent());
                while (m.find()) allMentions.add(m.group(1));
            }
        });
        java.util.Map<String, String> globalMentionMap = allMentions.isEmpty()
                ? java.util.Collections.emptyMap()
                : userRepository.findByUsernameIn(allMentions).stream()
                        .collect(Collectors.toMap(User::getUsername, User::getFullName));

        final java.util.Set<Long> finalSavedIds = savedPostIds;

        return posts.stream().map(post -> {
            PostResponse r = new PostResponse();
            Long pid = post.getId();

            r.setId(pid);
            r.setContent(post.getContent());
            r.setVisibility(post.getVisibility());
            r.setCreatedAt(post.getCreatedAt());

            User author = post.getUser();
            r.setAuthorId(author.getId());
            r.setAuthorUsername(author.getUsername());
            r.setAuthorFullName(author.getFullName());
            r.setAuthorAvatarUrl(author.getAvatarUrl());

            // Dùng batch map thay vì lazy load per post
            List<PostMedia> mediaItems = mediaMap.getOrDefault(pid, List.of());
            r.setMediaList(mediaItems.stream()
                    .map(m -> PostResponse.MediaItem.builder()
                            .id(m.getId()).mediaUrl(m.getMediaUrl())
                            .mediaType(m.getMediaType()).position(m.getPosition()).build())
                    .collect(Collectors.toList()));

            r.setLikeCount(likeCountMap.getOrDefault(pid, 0L));
            r.setCommentCount(commentCountMap.getOrDefault(pid, 0L));
            r.setShareCount(shareCountMap.getOrDefault(pid, 0L));
            r.setReactionCounts(reactionTypeMap.getOrDefault(pid, java.util.Collections.emptyMap()));

            if (currentUser != null) {
                ReactionType myReaction = userReactionMap.get(pid);
                r.setLiked(myReaction != null);
                r.setMyReaction(myReaction);
                r.setSaved(finalSavedIds.contains(pid));
            }

            if (post.getGroup() != null) {
                r.setGroupId(post.getGroup().getId());
                r.setGroupName(post.getGroup().getName());
                r.setGroupPostStatus(post.getGroupPostStatus());
            }

            // Resolve mentions từ pre-fetched globalMentionMap
            if (post.getContent() != null && !allMentions.isEmpty()) {
                java.util.regex.Matcher m = MENTION_PATTERN.matcher(post.getContent());
                java.util.Map<String, String> postMentions = new java.util.LinkedHashMap<>();
                while (m.find()) {
                    String u = m.group(1);
                    if (globalMentionMap.containsKey(u)) postMentions.put(u, globalMentionMap.get(u));
                }
                r.setMentionedUsers(postMentions.isEmpty() ? null : postMentions);
            }

            return r;
        }).collect(Collectors.toList());
    }

    private Page<PostResponse> toPostResponsePage(Page<Post> postPage, User currentUser) {
        List<PostResponse> responseList = toPostResponseList(postPage.getContent(), currentUser);
        return new org.springframework.data.domain.PageImpl<>(responseList, postPage.getPageable(), postPage.getTotalElements());
    }

    public PostResponse toPostResponse(Post post, User currentUser) {
        PostResponse response = new PostResponse();
        response.setId(post.getId());
        response.setContent(post.getContent());
        response.setVisibility(post.getVisibility());
        response.setCreatedAt(post.getCreatedAt());

        // Author info
        User author = post.getUser();
        response.setAuthorId(author.getId());
        response.setAuthorUsername(author.getUsername());
        response.setAuthorFullName(author.getFullName());
        response.setAuthorAvatarUrl(author.getAvatarUrl());

        // Media list
        if (post.getMediaList() != null) {
            List<PostResponse.MediaItem> mediaItems = post.getMediaList().stream()
                    .map(m -> PostResponse.MediaItem.builder()
                            .id(m.getId())
                            .mediaUrl(m.getMediaUrl())
                            .mediaType(m.getMediaType())
                            .position(m.getPosition())
                            .build())
                    .collect(Collectors.toList());
            response.setMediaList(mediaItems);
        }

        // Interaction counts
        response.setLikeCount(reactionRepository.countByTargetIdAndTargetType(post.getId(), TargetType.POST));
        response.setCommentCount(commentRepository.countByPost(post));
        response.setShareCount(postShareRepository.countByOriginalPost(post));

        java.util.Map<ReactionType, Long> reactionCounts = new java.util.HashMap<>();
        for (Object[] row : reactionRepository.countReactionsByType(post.getId(), TargetType.POST)) {
            reactionCounts.put((ReactionType) row[0], (Long) row[1]);
        }
        response.setReactionCounts(reactionCounts);

        // Personalized flags
        if (currentUser != null) {
            java.util.Optional<Reaction> userReaction = reactionRepository
                    .findByUserAndTargetIdAndTargetType(currentUser, post.getId(), TargetType.POST);
            response.setLiked(userReaction.isPresent());
            if (userReaction.isPresent()) {
                response.setMyReaction(userReaction.get().getReactionType());
            }
            response.setSaved(savedPostRepository.existsByUserAndPost(currentUser, post));
        }

        // Group info
        if (post.getGroup() != null) {
            response.setGroupId(post.getGroup().getId());
            response.setGroupName(post.getGroup().getName());
            response.setGroupPostStatus(post.getGroupPostStatus());
        }

        // Parse Mentions
        response.setMentionedUsers(extractMentionedUsersMap(post.getContent()));

        return response;
    }

    private java.util.Map<String, String> extractMentionedUsersMap(String content) {
        if (content == null) return null;
        java.util.regex.Matcher matcher = MENTION_PATTERN.matcher(content);
        java.util.Set<String> usernames = new java.util.HashSet<>();
        while (matcher.find()) {
            usernames.add(matcher.group(1));
        }
        if (usernames.isEmpty()) return null;
        
        return userRepository.findByUsernameIn(usernames).stream()
                .collect(Collectors.toMap(
                        User::getUsername, 
                        u -> u.getFullName() != null ? u.getFullName() : u.getUsername(),
                        (u1, u2) -> u1
                ));
    }

    // ====================== DTOs ======================

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PostCountUpdate {
        private Long postId;
        private long likeCount;
        private long commentCount;
        private long shareCount;
        private java.util.Map<ReactionType, Long> reactionCounts;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class HashtagResponse {
        private Long id;
        private String name;
        private long postCount;
    }

    // ====================== HASHTAG ======================

    /**
     * Trích xuất #hashtag từ nội dung bài viết, lưu vào DB, cập nhật postCount.
     */
    private void extractAndSaveHashtags(Post post) {
        if (post.getContent() == null) return;

        // Xóa hashtag cũ (cho update)
        postHashtagRepository.deleteByPost(post);

        Matcher matcher = HASHTAG_PATTERN.matcher(post.getContent());
        Set<String> tags = new java.util.LinkedHashSet<>();
        while (matcher.find()) {
            tags.add(matcher.group(1).toLowerCase());
        }

        for (String tag : tags) {
            Hashtag hashtag = hashtagRepository.findByName(tag)
                    .orElseGet(() -> hashtagRepository.save(
                            Hashtag.builder().name(tag).postCount(0).build()));

            postHashtagRepository.save(PostHashtag.builder()
                    .post(post)
                    .hashtag(hashtag)
                    .build());

            hashtag.setPostCount(hashtag.getPostCount() + 1);
            hashtagRepository.save(hashtag);
        }
    }

    /**
     * Trích xuất @username từ bài viết và gửi thông báo MENTION.
     */
    private void extractAndNotifyMentions(Post post) {
        if (post.getContent() == null) return;
        
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            Matcher matcher = MENTION_PATTERN.matcher(post.getContent());
            java.util.Set<String> tags = new java.util.LinkedHashSet<>();
            while (matcher.find()) {
                tags.add(matcher.group(1));
            }

            for (String username : tags) {
                userRepository.findByUsername(username).ifPresent(mentionedUser -> {
                    if (mentionedUser.getId().equals(post.getUser().getId())) return;
                    notificationService.sendNotification(
                        mentionedUser, post.getUser(), NotificationType.MENTION,
                        post.getId(), TargetType.POST, "/posts/" + post.getId()
                    );
                });
            }
        });
    }

    /**
     * Lấy bài viết theo hashtag (phân trang).
     */
    @Transactional(readOnly = true)
    public Page<PostResponse> getPostsByHashtag(String currentUsername, String tag, int page, int size) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postHashtagRepository.findPostsByHashtagName(tag.toLowerCase(), currentUser, pageable);
        return toPostResponsePage(postPage, currentUser);
    }

    /**
     * Top hashtag trending (nhiều bài viết nhất).
     */
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "trending-hashtags", key = "#limit")
    public List<HashtagResponse> getTrendingHashtags(int limit) {
        return hashtagRepository.findAllByOrderByPostCountDesc(PageRequest.of(0, limit))
                .stream()
                .map(h -> HashtagResponse.builder()
                        .id(h.getId())
                        .name(h.getName())
                        .postCount(h.getPostCount())
                        .build())
                .collect(Collectors.toList());
    }
}
