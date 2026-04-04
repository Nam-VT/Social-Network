package com.vtn.social_network.dto.chat.request;

import com.vtn.social_network.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    private String content;
    private String mediaUrl;
    private MediaType mediaType;
}
