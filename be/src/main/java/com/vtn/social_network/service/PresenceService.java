package com.vtn.social_network.service;

import com.vtn.social_network.entity.User;
import com.vtn.social_network.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class PresenceService {

    private final UserRepository userRepository;
    private final com.vtn.social_network.repository.MemberRepository memberRepository;
    private final com.vtn.social_network.repository.ChatRoomRepository chatRoomRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<String, LocalDateTime> onlineUsers = new ConcurrentHashMap<>();

    public PresenceService(UserRepository userRepository,
            com.vtn.social_network.repository.MemberRepository memberRepository,
            com.vtn.social_network.repository.ChatRoomRepository chatRoomRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public java.util.List<String> getOnlineUsersInRoom(Long roomId) {
        com.vtn.social_network.entity.ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tchat room"));
        return memberRepository.findByChatRoom(room).stream()
                .map(m -> m.getUser().getUsername())
                .filter(this::isUserOnline)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void handleUserConnect(String username) {
        onlineUsers.put(username, LocalDateTime.now());
        log.info("User {} đã kết nối (Online)", username);
        // Broadcast presence event
        messagingTemplate.convertAndSend("/topic/presence",
                (Object) Map.of("username", username, "online", true));
    }

    @Transactional
    public void handleUserDisconnect(String username) {
        onlineUsers.remove(username);

        userRepository.findByUsername(username).ifPresent(user -> {
            user.setLastSeenAt(LocalDateTime.now());
            userRepository.save(user);
        });

        log.info("User {} đã ngắt kết nối (Offline)", username);
        // Broadcast presence event with lastSeenAt
        messagingTemplate.convertAndSend("/topic/presence",
                (Object) Map.of("username", username, "online", false,
                        "lastSeenAt", LocalDateTime.now().toString()));
    }

    public boolean isUserOnline(String username) {
        return onlineUsers.containsKey(username);
    }

    public LocalDateTime getLastSeenAt(String username) {
        return userRepository.findByUsername(username)
                .map(User::getLastSeenAt)
                .orElse(null);
    }
}
