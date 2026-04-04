package com.vtn.social_network.dto.interaction.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoryReplyRequest {
    @NotBlank(message = "Nội dung phản hồi không được để trống")
    private String content;

    private String mediaUrl;
}
