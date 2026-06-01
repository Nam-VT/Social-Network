package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Member;
import com.vtn.social_network.entity.ChatRoom;
import com.vtn.social_network.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
        Optional<Member> findByChatRoomAndUser(ChatRoom chatRoom, User user);

        long countByUserAndUnreadCountGreaterThan(User user, int unreadCount);

        List<Member> findByUserOrderByChatRoomLastMessageAtDesc(User user);

        Page<Member> findByUserOrderByChatRoomLastMessageAtDesc(User user,
                        Pageable pageable);

        List<Member> findByChatRoom(ChatRoom chatRoom);

        /**
         * Tìm các nhóm chat (GROUP) mà cả 2 user đều là thành viên.
         */
        @Query("SELECT m1.chatRoom FROM Member m1 JOIN Member m2 ON m1.chatRoom = m2.chatRoom " +
                        "WHERE m1.user = :u1 AND m2.user = :u2 AND m1.chatRoom.roomType = 'GROUP'")
        List<ChatRoom> findSharedGroupRooms(@Param("u1") User u1, @Param("u2") User u2);
}
