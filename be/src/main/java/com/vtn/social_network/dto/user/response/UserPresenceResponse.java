package com.vtn.social_network.dto.user.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPresenceResponse {
    private String username;
    private boolean isOnline;
    private LocalDateTime lastSeenAt;
}
