package com.vtn.social_network.service;

import com.vtn.social_network.dto.interaction.request.CommentRequest;
import com.vtn.social_network.dto.interaction.request.EditCommentRequest;
import com.vtn.social_network.dto.interaction.request.ReactionRequest;
import com.vtn.social_network.dto.interaction.response.CommentResponse;
import com.vtn.social_network.entity.*;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.GroupPrivacy;
import com.vtn.social_network.enums.NotificationType;
import com.vtn.social_network.enums.ReactionType;
import com.vtn.social_network.enums.TargetType;
import com.vtn.social_network.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InteractionService {

        private static final java.util.regex.Pattern MENTION_PATTERN = java.util.regex.Pattern.compile("@(\\w+)");

        private final ReactionRepository reactionRepository;
        private final CommentRepository commentRepository;
        private final PostRepository postRepository;
        private final UserRepository userRepository;
        private final NotificationService notificationService;
        private final GroupMemberRepository groupMemberRepository;
        private final PostService postService;

        @Transactional
        public void toggleReaction(String username, ReactionRequest request) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                // Group permission check cho POST reactions
                if (request.getTargetType() == TargetType.POST) {
                        Post post = postRepository.findById(request.getTargetId()).orElse(null);
                        if (post != null && post.getGroup() != null) {
                                if (post.getGroup().getPrivacy() != GroupPrivacy.PUBLIC) {
                                        checkGroupMembership(post.getGroup(), user);
                                }
                        }
                }

                reactionRepository
                                .findByUserAndTargetIdAndTargetType(user, request.getTargetId(),
                                                request.getTargetType())
                                .ifPresentOrElse(
                                                existing -> {
                                                        if (existing.getReactionType()
                                                                        .equals(request.getReactionType())) {
                                                                reactionRepository.delete(existing);
                                                                log.info("User {} đã gỡ reaction khỏi {} id={}",
                                                                                username, request.getTargetType(),
                                                                                request.getTargetId());
                                                        } else {
                                                                existing.setReactionType(request.getReactionType());
                                                                reactionRepository.save(existing);
                                                                log.info("User {} đã đổi reaction thành {} cho {} id={}",
                                                                                username,
                                                                                request.getReactionType(),
                                                                                request.getTargetType(),
                                                                                request.getTargetId());
                                                                // Push real-time count update only on Add/Change
                                                                if (request.getTargetType() == TargetType.POST) {
                                                                        postService.pushPostCounts(
                                                                                        request.getTargetId());
                                                                }
                                                        }
                                                },
                                                () -> {
                                                        Reaction reaction = Reaction.builder()
                                                                        .user(user)
                                                                        .targetId(request.getTargetId())
                                                                        .targetType(request.getTargetType())
                                                                        .reactionType(request.getReactionType())
                                                                        .build();
                                                        reactionRepository.save(reaction);
                                                        log.info("User {} đã thêm reaction {} vào {} id={}", username,
                                                                        request.getReactionType(),
                                                                        request.getTargetType(), request.getTargetId());

                                                        // Notify
                                                        User targetOwner = null;
                                                        if (request.getTargetType() == TargetType.POST) {
                                                                targetOwner = postRepository
                                                                                .findById(request.getTargetId())
                                                                                .map(Post::getUser)
                                                                                .orElse(null);
                                                        } else if (request.getTargetType() == TargetType.COMMENT) {
                                                                targetOwner = commentRepository
                                                                                .findById(request.getTargetId())
                                                                                .map(Comment::getUser)
                                                                                .orElse(null);
                                                        }

                                                        if (targetOwner != null) {
                                                                String deepLink = "";
                                                                if (request.getTargetType() == TargetType.POST) {
                                                                        deepLink = "/posts/" + request.getTargetId();
                                                                } else if (request.getTargetType() == TargetType.COMMENT) {
                                                                        deepLink = commentRepository.findById(request.getTargetId())
                                                                                        .map(c -> "/posts/" + c.getPost().getId())
                                                                                        .orElse("");
                                                                }
                                                                notificationService.sendNotification(
                                                                                targetOwner, user,
                                                                                request.getTargetType() == TargetType.POST
                                                                                                ? NotificationType.LIKE_POST
                                                                                                : NotificationType.LIKE_COMMENT,
                                                                                request.getTargetId(),
                                                                                request.getTargetType(), deepLink);
                                                        }

                                                        // Push real-time count update only on Add/Change
                                                        if (request.getTargetType() == TargetType.POST) {
                                                                postService.pushPostCounts(request.getTargetId());
                                                        }
                                                });

                // Removed global push (now handled inside Add/Change blocks)
        }

        @Transactional
        public CommentResponse addComment(String username, CommentRequest request) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Post post = postRepository.findById(request.getPostId())
                                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));

                // Group permission check: chỉ thành viên mới được comment
                if (post.getGroup() != null) {
                        checkGroupMembership(post.getGroup(), user);
                }

                Comment parent = null;
                if (request.getParentId() != null) {
                        parent = commentRepository.findById(request.getParentId())
                                        .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận gốc"));
                }

                Comment comment = Comment.builder()
                                .user(user)
                                .post(post)
                                .parent(parent)
                                .content(request.getContent())
                                .mediaUrl(request.getMediaUrl())
                                .build();

                commentRepository.save(comment);
                log.info("User {} đã bình luận vào bài viết {}. ID bình luận: {}", username, post.getId(),
                                comment.getId());

                // Notify
                notificationService.sendNotification(
                                post.getUser(), user, NotificationType.COMMENT,
                                post.getId(), TargetType.POST, "/posts/" + post.getId());

                if (parent != null && !parent.getUser().getId().equals(post.getUser().getId())) {
                        notificationService.sendNotification(
                                        parent.getUser(), user, NotificationType.COMMENT,
                                        post.getId(), TargetType.POST, "/posts/" + post.getId());
                }

                // Mention Parsing
                if (request.getContent() != null) {
                        java.util.regex.Matcher matcher = MENTION_PATTERN.matcher(request.getContent());
                        java.util.Set<String> mentionedUsernames = new java.util.HashSet<>();
                        while (matcher.find()) {
                                mentionedUsernames.add(matcher.group(1));
                        }

                        // Vì dùng trong lambda, cần gán ra biến final để compiler không báo lỗi
                        final Comment finalParent = parent;

                        for (String mentionedUsername : mentionedUsernames) {
                                userRepository.findByUsername(mentionedUsername).ifPresent(mentionedUser -> {
                                        // Không tự gửi thông báo cho mình
                                        if (mentionedUser.getId().equals(user.getId())) return;
                                        // Không gửi lại thông báo nếu người này đã nhận thông báo bài viết/phản hồi
                                        if (post.getUser().getId().equals(mentionedUser.getId())) return;
                                        if (finalParent != null && finalParent.getUser().getId().equals(mentionedUser.getId())) return;

                                        notificationService.sendNotification(
                                                        mentionedUser, user, NotificationType.MENTION,
                                                        post.getId(), TargetType.POST, "/posts/" + post.getId());
                                });
                        }
                }

                // Push real-time count update
                postService.pushPostCounts(post.getId());

                return toCommentResponse(comment);
        }

        /**
         * Xóa comment — chỉ tác giả comment hoặc chủ bài post mới được xóa.
         */
        @Transactional
        public void deleteComment(String username, Long postId, Long commentId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Post post = postRepository.findById(postId)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));

                Comment comment = commentRepository.findById(commentId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

                boolean isCommentAuthor = comment.getUser().getId().equals(user.getId());
                boolean isPostOwner = post.getUser().getId().equals(user.getId());

                if (!isCommentAuthor && !isPostOwner) {
                        throw new RuntimeException("Bạn không có quyền xóa bình luận này");
                }

                commentRepository.delete(comment);
                log.info("User {} đã xóa comment {} trong bài viết {}", username, commentId, postId);

                // Push real-time count update
                postService.pushPostCounts(postId);
        }

        /**
         * Sửa comment — chỉ tác giả, trong vòng 15 phút, không gửi notification.
         */
        @Transactional
        public CommentResponse editComment(String username, Long postId, Long commentId, EditCommentRequest request) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Post post = postRepository.findById(postId)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));

                Comment comment = commentRepository.findById(commentId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

                // Chỉ tác giả mới được sửa
                if (!comment.getUser().getId().equals(user.getId())) {
                        throw new RuntimeException("Bạn không có quyền sửa bình luận này");
                }

                // Check thời gian: chỉ cho phép sửa trong 15 phút
                Duration elapsed = Duration.between(comment.getCreatedAt(), LocalDateTime.now());
                if (elapsed.toMinutes() > 15) {
                        throw new RuntimeException("Đã quá thời gian cho phép sửa bình luận (15 phút)");
                }

                // Cập nhật
                if (request.getContent() != null) {
                        comment.setContent(request.getContent());
                }
                comment.setMediaUrl(request.getMediaUrl());
                comment.setEdited(true);
                comment.setEditedAt(LocalDateTime.now());

                commentRepository.save(comment);
                log.info("User {} đã sửa comment {} trong bài viết {}", username, commentId, postId);

                // KHÔNG gửi notification khi sửa
                return toCommentResponse(comment);
        }

        /**
         * Lấy comment cấp 1 (parent = null) với replyCount + top replies.
         */
        public Page<CommentResponse> getComments(Long postId, int page, int size) {
                Post post = postRepository.findById(postId)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));

                Pageable pageable = PageRequest.of(page, size);
                return commentRepository.findByPostAndParentIsNullOrderByCreatedAtAsc(post, pageable)
                                .map(this::toCommentResponse);
        }

        /**
         * Lấy replies của một comment.
         */
        public Page<CommentResponse> getCommentReplies(Long commentId, int page, int size) {
                Comment parent = commentRepository.findById(commentId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy comment gốc"));

                Pageable pageable = PageRequest.of(page, size);
                return commentRepository.findByParentOrderByCreatedAtAsc(parent, pageable)
                                .map(this::toReplyResponse);
        }

        /**
         * Lấy danh sách reactions cho bài viết.
         */
        public Page<ReactionResponse> getReactions(Long postId, int page, int size) {
                Pageable pageable = PageRequest.of(page, size);
                return reactionRepository.findByTargetIdAndTargetType(postId, TargetType.POST, pageable)
                                .map(r -> {
                                        User u = r.getUser();
                                        ReactionResponse res = new ReactionResponse();
                                        res.setId(u.getId());
                                        res.setUsername(u.getUsername());
                                        res.setFullName(u.getFullName());
                                        res.setAvatarUrl(u.getAvatarUrl());
                                        res.setReactionType(r.getReactionType());
                                        return res;
                                });
        }

        // ========== Helper ==========

        private void checkGroupMembership(SocialGroup group, User user) {
                boolean isMember = groupMemberRepository.findByGroupAndUser(group, user)
                                .map(GroupMember::isApproved)
                                .orElse(false);
                if (!isMember) {
                        throw new RuntimeException("Chỉ thành viên nhóm mới được tương tác");
                }
        }

        private CommentResponse toCommentResponse(Comment comment) {
                long replyCount = commentRepository.countByParent(comment);

                // Aggregate reaction counts for this comment
                Map<ReactionType, Long> reactionCounts = buildReactionCounts(comment.getId());
                long likeCount = reactionCounts.values().stream().mapToLong(Long::longValue).sum();

                CommentResponse.AuthorInfo authorInfo = CommentResponse.AuthorInfo.builder()
                                .id(comment.getUser().getId())
                                .username(comment.getUser().getUsername())
                                .fullName(comment.getUser().getFullName())
                                .avatarUrl(comment.getUser().getAvatarUrl())
                                .build();

                return CommentResponse.builder()
                                .id(comment.getId())
                                .postId(comment.getPost().getId())
                                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                                .author(authorInfo)
                                .authorId(comment.getUser().getId())
                                .authorUsername(comment.getUser().getUsername())
                                .authorFullName(comment.getUser().getFullName())
                                .authorAvatarUrl(comment.getUser().getAvatarUrl())
                                .content(comment.getContent())
                                .mediaUrl(comment.getMediaUrl())
                                .createdAt(comment.getCreatedAt())
                                .isEdited(comment.isEdited())
                                .editedAt(comment.getEditedAt())
                                .likeCount(likeCount)
                                .reactionCounts(reactionCounts)
                                .replyCount(replyCount)
                                .replies(new java.util.ArrayList<>())
                                .mentionedUsers(extractMentionedUsers(comment.getContent()))
                                .build();
        }

        private CommentResponse toReplyResponse(Comment reply) {
                Map<ReactionType, Long> reactionCounts = buildReactionCounts(reply.getId());
                long likeCount = reactionCounts.values().stream().mapToLong(Long::longValue).sum();

                CommentResponse.AuthorInfo authorInfo = CommentResponse.AuthorInfo.builder()
                                .id(reply.getUser().getId())
                                .username(reply.getUser().getUsername())
                                .fullName(reply.getUser().getFullName())
                                .avatarUrl(reply.getUser().getAvatarUrl())
                                .build();

                return CommentResponse.builder()
                                .id(reply.getId())
                                .postId(reply.getPost().getId())
                                .parentId(reply.getParent() != null ? reply.getParent().getId() : null)
                                .author(authorInfo)
                                .authorId(reply.getUser().getId())
                                .authorUsername(reply.getUser().getUsername())
                                .authorFullName(reply.getUser().getFullName())
                                .authorAvatarUrl(reply.getUser().getAvatarUrl())
                                .content(reply.getContent())
                                .mediaUrl(reply.getMediaUrl())
                                .createdAt(reply.getCreatedAt())
                                .isEdited(reply.isEdited())
                                .editedAt(reply.getEditedAt())
                                .likeCount(likeCount)
                                .reactionCounts(reactionCounts)
                                .replyCount(0L)
                                .mentionedUsers(extractMentionedUsers(reply.getContent()))
                                .build();
        }

        private Map<String, String> extractMentionedUsers(String content) {
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

        private Map<ReactionType, Long> buildReactionCounts(Long commentId) {
                List<Reaction> reactions = reactionRepository
                                .findByTargetIdAndTargetType(commentId, TargetType.COMMENT);
                return reactions.stream()
                                .collect(Collectors.groupingBy(Reaction::getReactionType, Collectors.counting()));
        }

        // ========== DTOs ==========

        @lombok.Data
        @lombok.Builder
        @lombok.NoArgsConstructor
        @lombok.AllArgsConstructor
        public static class ReactionResponse {
                private Long id;
                private String username;
                private String fullName;
                private String avatarUrl;
                private ReactionType reactionType;
        }
}
