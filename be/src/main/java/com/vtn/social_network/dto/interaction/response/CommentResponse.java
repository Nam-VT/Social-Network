package com.vtn.social_network.dto.interaction.response;

import com.vtn.social_network.enums.ReactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long postId;
    private Long parentId;

    // Nested author object for FE consistency
    private AuthorInfo author;

    // Keep flat fields for backward compat (populated by mapper)
    private Long authorId;
    private String authorUsername;
    private String authorFullName;
    private String authorAvatarUrl;

    private String content;
    private String mediaUrl;
    private LocalDateTime createdAt;

    private boolean isEdited;
    private LocalDateTime editedAt;

    // Reaction support
    private long likeCount;
    private Map<ReactionType, Long> reactionCounts;
    private ReactionType myReaction;

    private Long replyCount;
    private List<CommentResponse> replies;
    
    // Lưu trữ mapping từ username -> fullName để UI render tên thật
    private Map<String, String> mentionedUsers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthorInfo {
        private Long id;
        private String username;
        private String fullName;
        private String avatarUrl;
    }
}
