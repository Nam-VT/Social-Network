package com.vtn.social_network.service;

import com.vtn.social_network.dto.interaction.request.CommentRequest;
import com.vtn.social_network.dto.interaction.request.ReactionRequest;
import com.vtn.social_network.dto.interaction.response.CommentResponse;
import com.vtn.social_network.entity.*;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InteractionService {

    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public void toggleReaction(String username, ReactionRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        reactionRepository.findByUserAndTargetIdAndTargetType(user, request.getTargetId(), request.getTargetType())
                .ifPresentOrElse(
                        existing -> {
                            if (existing.getReactionType().equals(request.getReactionType())) {
                                reactionRepository.delete(existing);
                                log.info("User {} đã gỡ reaction khỏi {} id={}", username, request.getTargetType(),
                                        request.getTargetId());
                            } else {
                                existing.setReactionType(request.getReactionType());
                                reactionRepository.save(existing);
                                log.info("User {} đã đổi reaction thành {} cho {} id={}", username,
                                        request.getReactionType(), request.getTargetType(), request.getTargetId());
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
                            log.info("User {} đã thêm reaction {} vào {} id={}", username, request.getReactionType(),
                                    request.getTargetType(), request.getTargetId());

                            // Notify (simple for now)
                            User targetOwner = null;
                            if (request.getTargetType() == com.vtn.social_network.enums.TargetType.POST) {
                                targetOwner = postRepository.findById(request.getTargetId()).map(Post::getUser)
                                        .orElse(null);
                            } else if (request.getTargetType() == com.vtn.social_network.enums.TargetType.COMMENT) {
                                targetOwner = commentRepository.findById(request.getTargetId()).map(Comment::getUser)
                                        .orElse(null);
                            }

                            if (targetOwner != null) {
                                notificationService.sendNotification(
                                        targetOwner, user,
                                        request.getTargetType() == com.vtn.social_network.enums.TargetType.POST
                                                ? com.vtn.social_network.enums.NotificationType.LIKE_POST
                                                : com.vtn.social_network.enums.NotificationType.LIKE_COMMENT,
                                        request.getTargetId(), request.getTargetType(), "");
                            }
                        });
    }

    @Transactional
    public CommentResponse addComment(String username, CommentRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));

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
        log.info("User {} đã bình luận vào bài viết {}. ID bình luận: {}", username, post.getId(), comment.getId());

        // Notify
        notificationService.sendNotification(
                post.getUser(), user, com.vtn.social_network.enums.NotificationType.COMMENT,
                post.getId(), com.vtn.social_network.enums.TargetType.POST, "/posts/" + post.getId());

        if (parent != null && !parent.getUser().getId().equals(post.getUser().getId())) {
            notificationService.sendNotification(
                    parent.getUser(), user, com.vtn.social_network.enums.NotificationType.COMMENT,
                    post.getId(), com.vtn.social_network.enums.TargetType.POST, "/posts/" + post.getId());
        }

        return toCommentResponse(comment);
    }

    public List<CommentResponse> getComments(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));

        // Chỉ lấy comment cấp 1 (không có parent)
        return commentRepository.findByPostAndParentIsNullOrderByCreatedAtDesc(post)
                .stream()
                .map(this::toCommentResponse)
                .collect(Collectors.toList());
    }

    // ========== Helper ==========

    private CommentResponse toCommentResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .authorId(comment.getUser().getId())
                .authorUsername(comment.getUser().getUsername())
                .authorFullName(comment.getUser().getFullName())
                .authorAvatarUrl(comment.getUser().getAvatarUrl())
                .content(comment.getContent())
                .mediaUrl(comment.getMediaUrl())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
