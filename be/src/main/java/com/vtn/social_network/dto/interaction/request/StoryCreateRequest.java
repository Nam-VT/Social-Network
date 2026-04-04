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

    // Mặc định story sống 24h, hoặc tuỳ chọn
    @Builder.Default
    private int durationHours = 24;
}
