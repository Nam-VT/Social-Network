package com.vtn.social_network.dto.chat.request;

import com.vtn.social_network.enums.ReactionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReactionRequest {
    private ReactionType reactionType;
}
