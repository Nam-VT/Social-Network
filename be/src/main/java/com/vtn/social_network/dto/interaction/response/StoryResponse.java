package com.vtn.social_network.dto.interaction.response;

import com.vtn.social_network.enums.MediaType;
import com.vtn.social_network.enums.Visibility;
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
public class StoryResponse {
    private Long id;
    private Long authorId;
    private String username;
    private String userFullName;
    private String userAvatar;
    private String mediaUrl;
    private MediaType mediaType;
    private String caption;
    private String bgColor;
    private Visibility visibility;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean isViewed; // User hiện tại đã xem chưa
    private int viewCount;
    private List<StoryViewResponse> views;

    // Archive
    private boolean isArchived;
    private Visibility archiveVisibility;
}
