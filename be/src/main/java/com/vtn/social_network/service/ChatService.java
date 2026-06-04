package com.vtn.social_network.service;

import com.vtn.social_network.dto.chat.request.AddMembersRequest;
import com.vtn.social_network.dto.chat.request.CreateGroupRequest;
import com.vtn.social_network.dto.chat.request.SendMessageRequest;
import com.vtn.social_network.dto.chat.request.UpdateGroupRequest;
import com.vtn.social_network.dto.chat.response.ChatMessageResponse;
import com.vtn.social_network.dto.chat.response.ChatNotificationPayload;
import com.vtn.social_network.dto.chat.response.ChatRoomResponse;
import com.vtn.social_network.dto.chat.response.GroupMemberResponse;
import com.vtn.social_network.entity.ChatMessage;
import com.vtn.social_network.entity.ChatRoom;
import com.vtn.social_network.entity.Member;
import com.vtn.social_network.entity.MessageReaction;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.ReactionType;
import com.vtn.social_network.enums.RoomType;
import com.vtn.social_network.repository.ChatMessageRepository;
import com.vtn.social_network.repository.ChatRoomRepository;
import com.vtn.social_network.repository.FriendshipRepository;
import com.vtn.social_network.repository.MemberRepository;
import com.vtn.social_network.repository.MessageReactionRepository;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
        private final MessageReactionRepository messageReactionRepository;
        private final SimpMessagingTemplate messagingTemplate;

        // ==================== INBOX & MESSAGES ====================

        public ChatRoomResponse getRoom(String username, Long roomId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));
                Member member = memberRepository.findByChatRoomAndUser(room, user)
                                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm chat này"));
                
                ChatRoomResponse response = toChatRoomResponse(member);
                if (room.getRoomType() == RoomType.PRIVATE) {
                        User otherUser = memberRepository.findByChatRoom(room).stream()
                                        .map(Member::getUser)
                                        .filter(u -> !u.getId().equals(user.getId()))
                                        .findFirst()
                                        .orElse(user); // Nếu tự chat với chính mình
                        response.setRoomName(otherUser.getFullName());
                        response.setAvatarUrl(otherUser.getAvatarUrl());
                }
                return response;
        }

        public Page<ChatRoomResponse> getInbox(String username, int page, int size) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại"));

                Pageable pageable = PageRequest.of(page, size);
                return memberRepository.findByUserOrderByChatRoomLastMessageAtDesc(user, pageable)
                                .map(this::toChatRoomResponse);
        }

        public long getUnreadRoomCount(String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                return memberRepository.countByUserAndUnreadCountGreaterThan(user, 0);
        }

        @Transactional
        public Page<ChatMessageResponse> getMessages(String username, Long roomId, int page, int size) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));

                Member member = memberRepository.findByChatRoomAndUser(room, user)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage()));

                member.setUnreadCount(0);
                // Lấy tin nhắn mới nhất để cập nhật lastReadMessageId
                Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
                Page<ChatMessage> messages = chatMessageRepository.findByChatRoom(room, pageable);
                
                if (page == 0 && !messages.isEmpty()) {
                        member.setLastReadMessageId(messages.getContent().get(0).getId());
                }
                memberRepository.save(member);

                return messages.map(this::toChatMessageResponse);
        }

        /**
         * Gửi tin nhắn (text/image/video). Hoạt động cho cả PRIVATE và GROUP.
         */
        @Transactional
        public ChatMessageResponse sendMessage(String username, Long roomId, SendMessageRequest request) {
                User sender = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));

                memberRepository.findByChatRoomAndUser(room, sender)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage()));

                // Kiểm tra Block (chỉ áp dụng cho chat PRIVATE)
                List<Member> others = memberRepository.findByChatRoom(room).stream()
                                .filter(m -> !m.getUser().getId().equals(sender.getId()))
                                .collect(Collectors.toList());

                if (room.getRoomType() == RoomType.PRIVATE) {
                        for (Member m : others) {
                                boolean isBlocked = friendshipRepository.findFriendshipBetween(sender, m.getUser())
                                                .map(f -> f.getStatus() == com.vtn.social_network.enums.FriendshipStatus.BLOCKED)
                                                .orElse(false);
                                if (isBlocked) {
                                        throw new RuntimeException(
                                                        "Không thể gửi tin nhắn. Tồn tại người dùng đã chặn bạn hoặc bị bạn chặn.");
                                }
                        }
                }

                // Lưu tin nhắn (hỗ trợ text, image, video)
                ChatMessage message = ChatMessage.builder()
                                .chatRoom(room)
                                .sender(sender)
                                .content(request.getContent())
                                .mediaUrl(request.getMediaUrl())
                                .mediaType(request.getMediaType())
                                .replyToMessageId(request.getReplyToMessageId())
                                .build();
                chatMessageRepository.save(message);

                room.setLastMessageAt(LocalDateTime.now());
                chatRoomRepository.save(room);

                ChatMessageResponse messageResponse = toChatMessageResponse(message);

                // Broadcast cho những client đang mở trực tiếp cửa sổ chat này
                messagingTemplate.convertAndSend("/topic/chat/" + roomId, messageResponse);

                // Push real-time (thông báo) cho tất cả thành viên khác
                others.forEach(m -> {
                        m.setUnreadCount(m.getUnreadCount() + 1);
                        memberRepository.save(m);

                        ChatRoomResponse roomResponse = toChatRoomResponse(m);
                        roomResponse.setLastMessageContent(request.getContent());

                        ChatNotificationPayload payload = ChatNotificationPayload.builder()
                                        .message(messageResponse)
                                        .room(roomResponse)
                                        .build();

                        messagingTemplate.convertAndSendToUser(
                                        m.getUser().getUsername(),
                                        "/queue/chat",
                                        payload);
                });

                log.info("User {} gửi tin nhắn vào room {} (type={})", username, roomId, room.getRoomType());
                return messageResponse;
        }

        // ==================== DIRECT MESSAGE ====================

        @Transactional
        public ChatRoomResponse getOrCreateDirectRoom(String username, Long targetUserId) {
                User user1 = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                User user2 = userRepository.findById(targetUserId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng đích"));

                if (user1.getId().equals(user2.getId())) {
                        throw new RuntimeException("Không thể tự nhắn tin cho chính mình");
                }

                // Tìm xem đã có PRIVATE room nào chung giữa 2 người chưa
                List<ChatRoom> commonRooms = chatRoomRepository.findCommonPrivateRooms(user1.getId(), user2.getId());

                if (!commonRooms.isEmpty()) {
                        // Đã có room -> Trả về room hiện tại
                        ChatRoom room = commonRooms.get(0);
                        Member member = memberRepository.findByChatRoomAndUser(room, user1).orElseThrow();
                        
                        ChatRoomResponse response = toChatRoomResponse(member);
                        // Với PRIVATE room, roomName và avatarUrl thường lấy của người kia
                        response.setRoomName(user2.getFullName());
                        response.setAvatarUrl(user2.getAvatarUrl());
                        return response;
                }

                // Chưa có -> Tạo mới
                ChatRoom room = ChatRoom.builder()
                                .roomType(RoomType.PRIVATE)
                                .build();
                chatRoomRepository.save(room);

                Member member1 = Member.builder().chatRoom(room).user(user1).build();
                Member member2 = Member.builder().chatRoom(room).user(user2).build();
                memberRepository.saveAll(List.of(member1, member2));

                log.info("Đã tạo DM room {} giữa {} và {}", room.getId(), user1.getUsername(), user2.getUsername());

                ChatRoomResponse response = toChatRoomResponse(member1);
                response.setRoomName(user2.getFullName());
                response.setAvatarUrl(user2.getAvatarUrl());
                return response;
        }

        // ==================== GROUP CHAT ====================

        /**
         * Tạo nhóm chat mới. Người tạo tự động trở thành thành viên.
         */
        @Transactional
        public ChatRoomResponse createGroup(String username, CreateGroupRequest request) {
                User creator = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                if (request.getMemberIds() == null || request.getMemberIds().size() < 2) {
                        throw new RuntimeException("Nhóm chat cần ít nhất 3 thành viên (bao gồm bạn).");
                }

                ChatRoom room = ChatRoom.builder()
                                .roomName(request.getGroupName())
                                .roomType(RoomType.GROUP)
                                .avatarUrl(request.getAvatarUrl())
                                .build();
                chatRoomRepository.save(room);

                // Thêm creator
                Member creatorMember = Member.builder()
                                .chatRoom(room)
                                .user(creator)
                                .build();
                memberRepository.save(creatorMember);

                // Thêm các thành viên được mời
                for (Long memberId : request.getMemberIds()) {
                        if (memberId.equals(creator.getId()))
                                continue;
                        User memberUser = userRepository.findById(memberId)
                                        .orElseThrow(() -> new RuntimeException(
                                                        "User ID " + memberId + " không tồn tại."));
                        Member member = Member.builder()
                                        .chatRoom(room)
                                        .user(memberUser)
                                        .build();
                        memberRepository.save(member);
                }

                log.info("User {} đã tạo nhóm chat '{}' với {} thành viên",
                                username, request.getGroupName(), request.getMemberIds().size() + 1);
                return toChatRoomResponse(creatorMember);
        }

        /**
         * Thêm thành viên mới vào nhóm.
         */
        @Transactional
        public void addMembers(String username, Long roomId, AddMembersRequest request) {
                User actor = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));

                if (room.getRoomType() != RoomType.GROUP) {
                        throw new RuntimeException("Chỉ có thể thêm thành viên vào nhóm chat.");
                }

                // Kiểm tra actor có trong nhóm không
                memberRepository.findByChatRoomAndUser(room, actor)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage()));

                for (Long memberId : request.getMemberIds()) {
                        User newUser = userRepository.findById(memberId)
                                        .orElseThrow(() -> new RuntimeException(
                                                        "User ID " + memberId + " không tồn tại."));

                        // Bỏ qua nếu đã là member
                        if (memberRepository.findByChatRoomAndUser(room, newUser).isPresent())
                                continue;

                        Member member = Member.builder()
                                        .chatRoom(room)
                                        .user(newUser)
                                        .build();
                        memberRepository.save(member);
                }
                log.info("User {} đã thêm thành viên vào nhóm {}", username, roomId);
        }

        /**
         * Xóa thành viên khỏi nhóm (chỉ thành viên trong nhóm mới được xóa người khác).
         */
        @Transactional
        public void removeMember(String username, Long roomId, Long targetUserId) {
                User actor = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));

                if (room.getRoomType() != RoomType.GROUP) {
                        throw new RuntimeException("Chỉ có thể xóa thành viên trong nhóm chat.");
                }

                memberRepository.findByChatRoomAndUser(room, actor)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage()));

                if (actor.getId().equals(targetUserId)) {
                        throw new RuntimeException("Không thể tự xóa chính mình. Hãy dùng chức năng Rời nhóm.");
                }

                User targetUser = userRepository.findById(targetUserId)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                Member targetMember = memberRepository.findByChatRoomAndUser(room, targetUser)
                                .orElseThrow(() -> new RuntimeException("Người dùng này không phải thành viên nhóm."));

                memberRepository.delete(targetMember);
                log.info("User {} đã xóa thành viên {} khỏi nhóm {}", username, targetUserId, roomId);
        }

        /**
         * Rời nhóm (tự mình thoát).
         */
        @Transactional
        public void leaveGroup(String username, Long roomId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));

                if (room.getRoomType() != RoomType.GROUP) {
                        throw new RuntimeException("Chỉ có thể rời nhóm chat.");
                }

                Member member = memberRepository.findByChatRoomAndUser(room, user)
                                .orElseThrow(() -> new RuntimeException("Bạn không phải thành viên nhóm này."));

                memberRepository.delete(member);

                // Nếu nhóm trống → xóa luôn nhóm
                List<Member> remaining = memberRepository.findByChatRoom(room);
                if (remaining.isEmpty()) {
                        chatMessageRepository.deleteByChatRoom(room);
                        chatRoomRepository.delete(room);
                        log.info("Nhóm {} đã bị xóa vì không còn thành viên", roomId);
                }

                log.info("User {} đã rời nhóm {}", username, roomId);
        }

        /**
         * Cập nhật thông tin nhóm (tên, avatar).
         */
        @Transactional
        public ChatRoomResponse updateGroupInfo(String username, Long roomId, UpdateGroupRequest request) {
                User actor = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));

                if (room.getRoomType() != RoomType.GROUP) {
                        throw new RuntimeException("Chỉ có thể cập nhật nhóm chat.");
                }

                Member member = memberRepository.findByChatRoomAndUser(room, actor)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage()));

                if (request.getGroupName() != null)
                        room.setRoomName(request.getGroupName());
                if (request.getAvatarUrl() != null)
                        room.setAvatarUrl(request.getAvatarUrl());
                chatRoomRepository.save(room);

                log.info("User {} đã cập nhật thông tin nhóm {}", username, roomId);
                return toChatRoomResponse(member);
        }

        /**
         * Lấy danh sách thành viên nhóm.
         */
        public List<GroupMemberResponse> getGroupMembers(String username, Long roomId) {
                User actor = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));

                memberRepository.findByChatRoomAndUser(room, actor)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage()));

                return memberRepository.findByChatRoom(room).stream()
                                .map(this::toGroupMemberResponse)
                                .collect(Collectors.toList());
        }

        // ==================== MESSAGE REACTIONS ====================

        /**
         * Thả hoặc đổi reaction trên tin nhắn (mỗi người chỉ 1 reaction/tin nhắn).
         */
        @Transactional
        public ChatMessageResponse reactToMessage(String username, Long messageId, ReactionType reactionType) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                ChatMessage message = chatMessageRepository.findById(messageId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy tin nhắn"));

                // Kiểm tra user có trong phòng không
                memberRepository.findByChatRoomAndUser(message.getChatRoom(), user)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage()));

                MessageReaction reaction = messageReactionRepository.findByMessageAndUser(message, user)
                                .orElse(MessageReaction.builder()
                                                .message(message)
                                                .user(user)
                                                .build());
                reaction.setReactionType(reactionType);
                messageReactionRepository.save(reaction);

                log.info("User {} react {} tin nhắn {}", username, reactionType, messageId);
                return toChatMessageResponse(message);
        }

        /**
         * Gỡ reaction của chính mình khỏi tin nhắn.
         */
        @Transactional
        public void removeReaction(String username, Long messageId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                ChatMessage message = chatMessageRepository.findById(messageId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy tin nhắn"));

                messageReactionRepository.deleteByMessageAndUser(message, user);
                log.info("User {} đã gỡ reaction khỏi tin nhắn {}", username, messageId);
        }

        // ==================== MEDIA GALLERY ====================

        /**
         * Lấy lịch sử ảnh/video trong phòng chat.
         */
        public List<ChatMessageResponse> getMediaGallery(String username, Long roomId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));

                memberRepository.findByChatRoomAndUser(room, user)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage()));

                return chatMessageRepository
                                .findByChatRoomAndMediaUrlIsNotNullOrderByCreatedAtDesc(room, PageRequest.of(0, 50))
                                .stream()
                                .map(this::toChatMessageResponse)
                                .collect(Collectors.toList());
        }

        // ==================== READ RECEIPTS ====================

        @Transactional
        public void markAsRead(String username, Long roomId, Long messageId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chat Room"));

                Member member = memberRepository.findByChatRoomAndUser(room, user)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage()));

                member.setUnreadCount(0);
                member.setLastReadMessageId(messageId);
                memberRepository.save(member);

                // Broadcast read receipt to other members in the room
                messagingTemplate.convertAndSend(
                                "/topic/chat/" + roomId + "/read",
                                Map.of(
                                        "userId", user.getId(),
                                        "messageId", messageId
                                ),
                                (Map<String, Object>) null
                );
        }

        // ==================== EDIT & RECALL ====================

        /**
         * Sửa tin nhắn (chỉ sender, trong vòng 15 phút).
         */
        @Transactional
        public ChatMessageResponse editMessage(String username, Long messageId, String newContent) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                ChatMessage message = chatMessageRepository.findById(messageId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy tin nhắn"));

                if (!message.getSender().getId().equals(user.getId())) {
                        throw new RuntimeException("Bạn chỉ có thể sửa tin nhắn của chính mình");
                }
                if (message.isRecalled()) {
                        throw new RuntimeException("Tin nhắn đã bị gỡ, không thể sửa");
                }

                long minutesSinceSent = ChronoUnit.MINUTES.between(message.getCreatedAt(), LocalDateTime.now());
                if (minutesSinceSent > 15) {
                        throw new RuntimeException("Chỉ có thể sửa tin nhắn trong vòng 15 phút kể từ khi gửi");
                }

                message.setContent(newContent);
                message.setEdited(true);
                chatMessageRepository.save(message);

                ChatMessageResponse response = toChatMessageResponse(message);

                // Broadcast sửa tin nhắn real-time tới room
                messagingTemplate.convertAndSend("/topic/chat/" + message.getChatRoom().getId(), response);

                log.info("User {} đã sửa tin nhắn {}", username, messageId);
                return response;
        }

        /**
         * Gỡ (recall) tin nhắn — nội dung sẽ hiển thị "Tin nhắn đã bị gỡ".
         */
        @Transactional
        public void recallMessage(String username, Long messageId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                ChatMessage message = chatMessageRepository.findById(messageId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy tin nhắn"));

                if (!message.getSender().getId().equals(user.getId())) {
                        throw new RuntimeException("Bạn chỉ có thể gỡ tin nhắn của chính mình");
                }

                message.setContent(null);
                message.setMediaUrl(null);
                message.setMediaType(null);
                message.setRecalled(true);
                chatMessageRepository.save(message);

                // Broadcast gỡ tin nhắn real-time tới room
                ChatMessageResponse response = toChatMessageResponse(message);
                messagingTemplate.convertAndSend("/topic/chat/" + message.getChatRoom().getId(), response);

                log.info("User {} đã gỡ tin nhắn {}", username, messageId);
        }

        // ==================== HELPERS ====================

        private ChatRoomResponse toChatRoomResponse(Member member) {
                ChatRoom room = member.getChatRoom();
                String roomName = room.getRoomName();
                String avatarUrl = room.getAvatarUrl();
                String otherUsername = null;

                // Với PRIVATE room: resolve tên và avatar của người còn lại
                if (room.getRoomType() == RoomType.PRIVATE) {
                        User otherUser = memberRepository.findByChatRoom(room).stream()
                                        .map(Member::getUser)
                                        .filter(u -> !u.getId().equals(member.getUser().getId()))
                                        .findFirst()
                                        .orElse(member.getUser()); // fallback: tự chat với chính mình
                        roomName = otherUser.getFullName();
                        avatarUrl = otherUser.getAvatarUrl();
                        otherUsername = otherUser.getUsername();
                }

                ChatRoomResponse response = ChatRoomResponse.builder()
                                .id(room.getId())
                                .roomName(roomName)
                                .avatarUrl(avatarUrl)
                                .roomType(room.getRoomType())
                                .lastMessageAt(room.getLastMessageAt())
                                .unreadCount(member.getUnreadCount())
                                .otherUsername(otherUsername)
                                .build();

                chatMessageRepository.findByChatRoomOrderByCreatedAtDesc(room, PageRequest.of(0, 1))
                                .stream().findFirst().ifPresent(msg -> response.setLastMessageContent(
                                                msg.isRecalled() ? "Tin nhắn đã bị gỡ"
                                                                : msg.getContent() != null ? msg.getContent()
                                                                                : "Đã gửi " + msg.getMediaType()));
                return response;
        }

        private ChatMessageResponse toChatMessageResponse(ChatMessage message) {
                User s = message.getSender();

                // Build reaction summary
                List<ChatMessageResponse.ReactionSummary> reactionSummaries = new ArrayList<>();
                List<MessageReaction> reactions = messageReactionRepository.findByMessage(message);
                if (!reactions.isEmpty()) {
                        Map<ReactionType, List<MessageReaction>> grouped = reactions.stream()
                                        .collect(Collectors.groupingBy(MessageReaction::getReactionType));
                        grouped.forEach((type, list) -> reactionSummaries.add(
                                        ChatMessageResponse.ReactionSummary.builder()
                                                        .reactionType(type)
                                                        .count(list.size())
                                                        .usernames(list.stream()
                                                                        .map(r -> r.getUser().getUsername())
                                                                        .collect(Collectors.toList()))
                                                        .build()));
                }

                ChatMessageResponse response = ChatMessageResponse.builder()
                                .id(message.getId())
                                .senderId(s.getId())
                                .senderUsername(s.getUsername())
                                .senderFullName(s.getFullName())
                                .senderAvatarUrl(s.getAvatarUrl())
                                .content(message.isRecalled() ? "Tin nhắn đã bị gỡ" : message.getContent())
                                .mediaUrl(message.isRecalled() ? null : message.getMediaUrl())
                                .mediaType(message.isRecalled() ? null : message.getMediaType())
                                .isEdited(message.isEdited())
                                .isRecalled(message.isRecalled())
                                .isPinned(message.isPinned())
                                .createdAt(message.getCreatedAt())
                                .reactions(reactionSummaries)
                                .replyToMessageId(message.getReplyToMessageId())
                                .build();

                if (message.getReplyToMessageId() != null) {
                        chatMessageRepository.findById(message.getReplyToMessageId()).ifPresent(replyTo -> {
                                response.setReplyToMessageContent(replyTo.isRecalled() ? "Tin nhắn đã bị gỡ" : replyTo.getContent() != null ? replyTo.getContent() : "Đã gửi " + replyTo.getMediaType());
                                response.setReplyToSenderName(replyTo.getSender().getFullName());
                        });
                }
                return response;
        }

        private GroupMemberResponse toGroupMemberResponse(Member member) {
                User u = member.getUser();
                return GroupMemberResponse.builder()
                                .userId(u.getId())
                                .username(u.getUsername())
                                .fullName(u.getFullName())
                                .avatarUrl(u.getAvatarUrl())
                                .joinedAt(member.getJoinedAt())
                                .lastReadMessageId(member.getLastReadMessageId())
                                .build();
        }
}
