package com.vtn.social_network.dto.user.response;

import com.vtn.social_network.enums.Gender;
import com.vtn.social_network.enums.Visibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String coverUrl;
    private String bio;
    private String location;
    private String website;
    private LocalDate birthDate;
    private Gender gender;
    private String relationshipStatus;
    private Visibility friendListVisibility;
    private LocalDateTime createdAt;

    // === Computed fields (view-dependent) ===
    private String friendshipStatus;   // NONE | PENDING_SENT | PENDING_RECEIVED | FRIEND
    private long friendCount;
    private long followerCount;
    private long followingCount;
    private boolean isFollowing;
    private boolean isBlocked;
    private boolean isOnline;
}
