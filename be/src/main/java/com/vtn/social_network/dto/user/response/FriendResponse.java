package com.vtn.social_network.dto.user.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendResponse {
    private Long id; // userId
    private String username;
    private String fullName;
    private String avatarUrl;
    private Integer mutualFriendsCount; // Mặc định 0 cho phase sau làm
}
