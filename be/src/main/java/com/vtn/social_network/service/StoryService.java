package com.vtn.social_network.service;

import com.vtn.social_network.dto.interaction.request.StoryReplyRequest;
import com.vtn.social_network.entity.*;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.ReactionType;
import com.vtn.social_network.enums.RoomType;
import com.vtn.social_network.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoryService {

        private final StoryRepository storyRepository;
        private final StoryViewRepository storyViewRepository;
        private final UserRepository userRepository;
        private final ChatRoomRepository chatRoomRepository;
        private final ChatMessageRepository chatMessageRepository;
        private final MemberRepository memberRepository;
        private final NotificationService notificationService;

        @Transactional
        public Story createStory(String username,
                        com.vtn.social_network.dto.interaction.request.StoryCreateRequest request) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Story story = Story.builder()
                                .user(user)
                                .mediaUrl(request.getMediaUrl())
                                .mediaType(request.getMediaType())
                                .expiresAt(LocalDateTime.now().plusHours(request.getDurationHours()))
                                .build();

                log.info("User {} đã tạo story mới", username);
                return storyRepository.save(story);
        }

        @Transactional
        public void reactToStory(String username, Long storyId, ReactionType reactionType) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Story"));

                StoryView view = storyViewRepository.findByStoryAndViewer(story, user)
                                .orElseGet(() -> StoryView.builder()
                                                .story(story)
                                                .viewer(user)
                                                .build());

                view.setReactionType(reactionType);
                storyViewRepository.save(view);
                log.info("User {} đã thả {} vào story của {}", username, reactionType, story.getUser().getUsername());

                notificationService.sendNotification(
                                story.getUser(), user, com.vtn.social_network.enums.NotificationType.LIKE_POST, // Reuse
                                                                                                                // LIKE_POST
                                                                                                                // for
                                                                                                                // story
                                                                                                                // for
                                                                                                                // now
                                                                                                                // or
                                                                                                                // add
                                                                                                                // STORY_REACTION
                                story.getId(), com.vtn.social_network.enums.TargetType.USER, "");
        }

        @Transactional
        public void replyToStory(String username, Long storyId, StoryReplyRequest request) {
                User sender = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Story"));

                User receiver = story.getUser();

                if (sender.getId().equals(receiver.getId())) {
                        throw new RuntimeException("Bạn không thể tự phản hồi story của chính mình");
                }

                // 1. Tìm hoặc tạo Chat Room Private
                ChatRoom chatRoom = findOrCreatePrivateChatRoom(sender, receiver);

                // 2. Gửi tin nhắn phản hồi
                ChatMessage message = ChatMessage.builder()
                                .chatRoom(chatRoom)
                                .sender(sender)
                                .content("[Phản hồi Story]: " + request.getContent())
                                .mediaUrl(request.getMediaUrl())
                                .build();

                chatMessageRepository.save(message);

                // 3. Cập nhật lastMessageAt cho ChatRoom và unreadCount cho người nhận
                chatRoom.setLastMessageAt(LocalDateTime.now());
                chatRoomRepository.save(chatRoom);

                Member receiverMember = memberRepository.findByChatRoomAndUser(chatRoom, receiver)
                                .orElseThrow(() -> new RuntimeException(
                                                "Lỗi hệ thống: Không tìm thấy member trong chat room"));
                receiverMember.setUnreadCount(receiverMember.getUnreadCount() + 1);
                memberRepository.save(receiverMember);

                log.info("User {} đã phản hồi story của {} qua tin nhắn riêng", username, receiver.getUsername());
        }

        private ChatRoom findOrCreatePrivateChatRoom(User u1, User u2) {
                // Logic tìm Chat Room Private đã tồn tại giữa 2 người
                // Ở đây tạm thời dùng MemberRepository để tìm room chung
                List<Member> u1Rooms = memberRepository.findByUserOrderByChatRoomLastMessageAtDesc(u1);
                for (Member m1 : u1Rooms) {
                        ChatRoom room = m1.getChatRoom();
                        if (room.getRoomType() == RoomType.PRIVATE) {
                                if (memberRepository.findByChatRoomAndUser(room, u2).isPresent()) {
                                        return room;
                                }
                        }
                }

                // Nếu chưa có thì tạo mới
                ChatRoom newRoom = ChatRoom.builder()
                                .roomType(RoomType.PRIVATE)
                                .roomName("Chat giữa " + u1.getUsername() + " và " + u2.getUsername())
                                .lastMessageAt(LocalDateTime.now())
                                .build();
                chatRoomRepository.save(newRoom);

                // Add 2 member
                memberRepository.save(Member.builder().chatRoom(newRoom).user(u1).build());
                memberRepository.save(Member.builder().chatRoom(newRoom).user(u2).build());

                return newRoom;
        }
}
