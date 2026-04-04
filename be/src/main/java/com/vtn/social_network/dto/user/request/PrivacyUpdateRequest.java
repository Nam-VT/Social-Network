package com.vtn.social_network.dto.user.request;

import com.vtn.social_network.enums.Visibility;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrivacyUpdateRequest {

    @NotNull(message = "friendListVisibility không được để trống")
    private Visibility friendListVisibility;

}
