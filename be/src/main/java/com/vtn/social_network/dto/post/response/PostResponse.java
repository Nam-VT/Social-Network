package com.vtn.social_network.dto.post.response;

import com.vtn.social_network.enums.GroupPostStatus;
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
public class PostResponse {
    private Long id;
    private String content;
    private String highlightedContent;
    private Visibility visibility;
    private LocalDateTime createdAt;

    // Thông tin tác giả
    private Long authorId;
    private String authorUsername;
    private String authorFullName;
    private String authorAvatarUrl;

    // Danh sách media
    private List<MediaItem> mediaList;

    // Interaction counts (real-time updated)
    private long likeCount;
    private long commentCount;
    private long shareCount;
    private java.util.Map<com.vtn.social_network.enums.ReactionType, Long> reactionCounts;

    // Trạng thái cá nhân của currentUser
    private boolean isLiked;
    private com.vtn.social_network.enums.ReactionType myReaction;
    private boolean isSaved;

    // Group info (null nếu bài cá nhân)
    private Long groupId;
    private String groupName;
    private GroupPostStatus groupPostStatus;

    // Lưu trữ mapping từ username -> fullName để UI render tên thật
    private java.util.Map<String, String> mentionedUsers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaItem {
        private Long id;
        private String mediaUrl;
        private MediaType mediaType;
        private Integer position;
    }
}
