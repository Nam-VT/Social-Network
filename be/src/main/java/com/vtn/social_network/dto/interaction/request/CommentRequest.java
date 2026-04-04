package com.vtn.social_network.dto.interaction.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequest {
    @NotNull(message = "ID bài viết không được để trống")
    private Long postId;

    private Long parentId; // null nếu là comment cấp 1

    @NotBlank(message = "Nội dung bình luận không được để trống")
    private String content;

    private String mediaUrl;
}
