package com.vtn.social_network.dto.interaction.request;

import com.vtn.social_network.enums.ReactionType;
import com.vtn.social_network.enums.TargetType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReactionRequest {
    @NotNull(message = "ID mục tiêu không được để trống")
    private Long targetId;

    @NotNull(message = "Loại mục tiêu không được để trống")
    private TargetType targetType;

    @NotNull(message = "Loại cảm xúc không được để trống")
    private ReactionType reactionType;
}
