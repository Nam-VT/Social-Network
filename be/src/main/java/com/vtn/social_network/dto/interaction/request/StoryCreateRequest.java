package com.vtn.social_network.dto.interaction.request;

import com.vtn.social_network.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryCreateRequest {
    private String mediaUrl;

    // Loại media: IMAGE, VIDEO, TEXT
    private MediaType mediaType;

    private String caption;
    private String bgColor;
    private com.vtn.social_network.enums.Visibility visibility;

    // Mặc định story sống 24h, hoặc tuỳ chọn
    private Integer durationHours = 24;
}
