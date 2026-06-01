package com.vtn.social_network.dto.post.request;

import com.vtn.social_network.enums.MediaType;
import com.vtn.social_network.enums.Visibility;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {

    @Size(max = 5000, message = "Nội dung bài viết không được quá 5000 ký tự")
    private String content;

    private Visibility visibility;

    private Long groupId; // nullable — nếu null = bài cá nhân

    private List<MediaItem> mediaList;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaItem {
        private String mediaUrl;
        private MediaType mediaType;
    }
}
