package com.vtn.social_network.dto.interaction.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EditCommentRequest {
    private String content;
    private String mediaUrl;
}
