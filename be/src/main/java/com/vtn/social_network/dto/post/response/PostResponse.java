package com.vtn.social_network.dto.post.response;

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
    private Visibility visibility;
    private LocalDateTime createdAt;

    // Thông tin tác giả
    private Long authorId;
    private String authorUsername;
    private String authorFullName;
    private String authorAvatarUrl;

    // Danh sách media
    private List<MediaItem> mediaList;

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
