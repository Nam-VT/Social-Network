package com.vtn.social_network.dto.chat.response;

import com.vtn.social_network.enums.MediaType;
import com.vtn.social_network.enums.ReactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private Long id;
    private Long senderId;
    private String senderUsername;
    private String senderFullName;
    private String senderAvatarUrl;

    private String content;
    private String mediaUrl;
    private MediaType mediaType;
    private boolean isEdited;
    private boolean isRecalled;
    private boolean isPinned;
    private LocalDateTime createdAt;

    private Long replyToMessageId;
    private String replyToMessageContent;
    private String replyToSenderName;

    private List<ReactionSummary> reactions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReactionSummary {
        private ReactionType reactionType;
        private int count;
        private List<String> usernames;
    }
}
