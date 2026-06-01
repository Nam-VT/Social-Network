package com.vtn.social_network.repository;

import com.vtn.social_network.entity.ChatRoom;
import com.vtn.social_network.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    List<ChatRoom> findByRoomType(RoomType roomType);

    @Query("SELECT r FROM ChatRoom r JOIN Member m1 ON r.id = m1.chatRoom.id " +
           "JOIN Member m2 ON r.id = m2.chatRoom.id " +
           "WHERE r.roomType = 'PRIVATE' " +
           "AND m1.user.id = :userId1 AND m2.user.id = :userId2")
    List<ChatRoom> findCommonPrivateRooms(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
