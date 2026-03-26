package com.vtn.social_network.repository;

import com.vtn.social_network.entity.ChatRoom;
import com.vtn.social_network.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    List<ChatRoom> findByRoomType(RoomType roomType);
}
