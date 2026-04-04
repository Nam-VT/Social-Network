package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Member;
import com.vtn.social_network.entity.ChatRoom;
import com.vtn.social_network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByChatRoomAndUser(ChatRoom chatRoom, User user);

    List<Member> findByUserOrderByChatRoomLastMessageAtDesc(User user);

    List<Member> findByChatRoom(ChatRoom chatRoom);
}
