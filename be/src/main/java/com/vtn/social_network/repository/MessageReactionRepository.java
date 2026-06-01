package com.vtn.social_network.repository;

import com.vtn.social_network.entity.ChatMessage;
import com.vtn.social_network.entity.MessageReaction;
import com.vtn.social_network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {

    Optional<MessageReaction> findByMessageAndUser(ChatMessage message, User user);

    List<MessageReaction> findByMessage(ChatMessage message);

    void deleteByMessageAndUser(ChatMessage message, User user);
}
