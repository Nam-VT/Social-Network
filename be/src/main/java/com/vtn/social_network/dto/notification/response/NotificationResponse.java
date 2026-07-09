package com.vtn.social_network.dto.notification.response;

import com.vtn.social_network.enums.NotificationType;
import com.vtn.social_network.enums.TargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private Long actorId;
    private String actorUsername;
    private String actorFullName;
    private String actorAvatarUrl;

    private NotificationType type;
    private Long targetId;
    private TargetType targetType;
    private String deepLink;
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;
}
