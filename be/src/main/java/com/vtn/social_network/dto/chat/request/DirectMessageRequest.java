package com.vtn.social_network.dto.chat.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DirectMessageRequest {
    @NotNull(message = "Target User ID không được để trống")
    private Long targetUserId;
}
