package com.vtn.social_network.service;

import com.vtn.social_network.dto.chat.request.SendMessageRequest;
import com.vtn.social_network.dto.chat.response.ChatMessageResponse;
import com.vtn.social_network.dto.chat.response.ChatNotificationPayload;
import com.vtn.social_network.dto.chat.response.ChatRoomResponse;
import com.vtn.social_network.entity.ChatMessage;
import com.vtn.social_network.entity.ChatRoom;
import com.vtn.social_network.entity.Member;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.repository.ChatMessageRepository;
import com.vtn.social_network.repository.ChatRoomRepository;
import com.vtn.social_network.repository.FriendshipRepository;
import com.vtn.social_network.repository.MemberRepository;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

        private final ChatRoomRepository chatRoomRepository;
        private final ChatMessageRepository chatMessageRepository;
        private final MemberRepository memberRepository;
        private final UserRepository userRepository;
        private final FriendshipRepository friendshipRepository;
        private final SimpMessagingTemplate messagingTemplate;

        /**
         * Lấy danh sách hộp thư (Inbox), sắp xếp theo tin nhắn mới nhất.
         */
        public List<ChatRoomResponse> getInbox(String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                return memberRepository.findByUserOrderByChatRoomLastMessageAtDesc(user)
                                .stream()
                                .map(this::toChatRoomResponse)
                                .collect(Collectors.toList());
        }

        /**
         * Lấy tin nhắn trong phòng và RESET số lượng tin chưa đọc.
         */
        @Transactional
        public List<ChatMessageResponse> getMessages(String username, Long roomId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));

                // Kiểm tra quyền (phải là member)
                Member member = memberRepository.findByChatRoomAndUser(room, user)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage()));

                // Reset unread count
                member.setUnreadCount(0);
                memberRepository.save(member);

                return chatMessageRepository.findByChatRoomOrderByCreatedAtDesc(room, PageRequest.of(0, 20))
                                .stream()
                                .map(this::toChatMessageResponse)
                                .collect(Collectors.toList());
        }

        /**
         * Gửi tin nhắn mới.
         * - Lưu DB.
         * - Tăng unreadCount cho mỗi member không phải sender.
         * - Đẩy ChatNotificationPayload qua STOMP kênh /user/{username}/queue/chat
         * để Frontend có đủ dữ liệu: render bong bóng + cập nhật badge + kéo Inbox lên
         * đầu.
         */
        @Transactional
        public ChatMessageResponse sendMessage(String username, Long roomId, SendMessageRequest request) {
                User sender = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));

                // Kiểm tra xem sender có trong room không
                memberRepository.findByChatRoomAndUser(room, sender)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage()));

                // Lấy thông tin member khác và kiểm tra Block
                List<Member> others = memberRepository.findByChatRoom(room).stream()
                                .filter(m -> !m.getUser().getId().equals(sender.getId()))
                                .collect(Collectors.toList());

                for (Member m : others) {
                        boolean isBlocked = friendshipRepository.findFriendshipBetween(sender, m.getUser())
                                        .map(f -> f.getStatus() == com.vtn.social_network.enums.FriendshipStatus.BLOCKED)
                                        .orElse(false);
                        if (isBlocked) {
                                throw new RuntimeException(
                                                "Không thể gửi tin nhắn. Tồn tại người dùng đã chặn bạn hoặc bị bạn chặn trong cuộc trò chuyện này.");
                        }
                }

                // Lưu tin nhắn
                ChatMessage message = ChatMessage.builder()
                                .chatRoom(room)
                                .sender(sender)
                                .content(request.getContent())
                                .mediaUrl(request.getMediaUrl())
                                .mediaType(request.getMediaType())
                                .build();
                chatMessageRepository.save(message);

                // Cập nhật lastMessageAt cho room
                room.setLastMessageAt(LocalDateTime.now());
                chatRoomRepository.save(room);

                ChatMessageResponse messageResponse = toChatMessageResponse(message);

                // Tăng unread count + đẩy WebSocket cho từng member còn lại
                others.forEach(m -> {
                        m.setUnreadCount(m.getUnreadCount() + 1);
                        memberRepository.save(m);

                        // Build ChatRoomResponse với unreadCount mới nhất của từng người
                        ChatRoomResponse roomResponse = toChatRoomResponse(m);
                        roomResponse.setLastMessageContent(request.getContent());

                        ChatNotificationPayload payload = ChatNotificationPayload.builder()
                                        .message(messageResponse)
                                        .room(roomResponse)
                                        .build();

                        // Bắn Real-time vào kênh Chat riêng — không ảnh hưởng chuông Notification
                        messagingTemplate.convertAndSendToUser(
                                        m.getUser().getUsername(),
                                        "/queue/chat",
                                        payload);
                });

                log.info("User {} gửi tin nhắn vào room {}", username, roomId);
                return messageResponse;
        }

        // ========== Helpers ==========

        private ChatRoomResponse toChatRoomResponse(Member member) {
                ChatRoom room = member.getChatRoom();
                return ChatRoomResponse.builder()
                                .id(room.getId())
                                .roomName(room.getRoomName())
                                .avatarUrl(room.getAvatarUrl())
                                .roomType(room.getRoomType())
                                .lastMessageAt(room.getLastMessageAt())
                                .unreadCount(member.getUnreadCount())
                                .build();
        }

        private ChatMessageResponse toChatMessageResponse(ChatMessage message) {
                User s = message.getSender();
                return ChatMessageResponse.builder()
                                .id(message.getId())
                                .senderId(s.getId())
                                .senderUsername(s.getUsername())
                                .senderFullName(s.getFullName())
                                .senderAvatarUrl(s.getAvatarUrl())
                                .content(message.getContent())
                                .mediaUrl(message.getMediaUrl())
                                .mediaType(message.getMediaType())
                                .createdAt(message.getCreatedAt())
                                .build();
        }
}
