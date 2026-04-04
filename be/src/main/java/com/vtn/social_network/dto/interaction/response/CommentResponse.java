package com.vtn.social_network.dto.interaction.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long postId;
    private Long parentId;

    private Long authorId;
    private String authorUsername;
    private String authorFullName;
    private String authorAvatarUrl;

    private String content;
    private String mediaUrl;
    private LocalDateTime createdAt;

    private Long replyCount;
    private List<CommentResponse> replies; // Optional: gửi kèm tầng 1 của reply
}
