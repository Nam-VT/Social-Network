package com.vtn.social_network.repository;

import com.vtn.social_network.entity.ChatMessage;
import com.vtn.social_network.entity.ChatRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatRoomOrderByCreatedAtDesc(ChatRoom chatRoom, Pageable pageable);

    Page<ChatMessage> findByChatRoom(ChatRoom chatRoom, Pageable pageable);

    List<ChatMessage> findByChatRoomAndCreatedAtBeforeOrderByCreatedAtDesc(ChatRoom chatRoom,
            LocalDateTime lastTimestamp, Pageable pageable);

    void deleteByChatRoom(ChatRoom chatRoom);

    // Media Gallery: lấy tất cả tin nhắn có media trong phòng
    List<ChatMessage> findByChatRoomAndMediaUrlIsNotNullOrderByCreatedAtDesc(ChatRoom chatRoom, Pageable pageable);

    // Cron cleanup: tìm tin nhắn bị gỡ cũ hơn threshold
    List<ChatMessage> findByIsRecalledTrueAndCreatedAtBefore(LocalDateTime threshold);
}
