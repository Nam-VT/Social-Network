package com.vtn.social_network.dto.interaction.response;

import com.vtn.social_network.enums.ReactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryViewResponse {
    private String username;
    private String userFullName;
    private String userAvatar;
    private ReactionType reactionType;
    private LocalDateTime viewedAt;
}
