package com.vtn.social_network.dto.chat.response;

import com.vtn.social_network.enums.RoomType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomResponse {
    private Long id;
    private String roomName;
    private String avatarUrl;
    private RoomType roomType;
    private LocalDateTime lastMessageAt;
    private Integer unreadCount;
    private String otherUsername; // Username of the other user in PRIVATE rooms

    // Preview last message
    private String lastMessageContent;
}
