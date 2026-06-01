package com.vtn.social_network.dto.interaction.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryGroupResponse {
    private Long userId;
    private String username;
    private String userFullName;
    private String userAvatar;
    private List<StoryResponse> stories;
}
