package com.vtn.social_network.dto.chat.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload đẩy qua WebSocket kênh Chat (/user/{username}/queue/chat).
 * Chứa đủ dữ liệu để Frontend:
 * 1. Render bong bóng tin nhắn mới (message).
 * 2. Cập nhật số tin chưa đọc + sắp xếp Inbox (room).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatNotificationPayload {
    private ChatMessageResponse message;
    private ChatRoomResponse room;
}
