package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Story;
import com.vtn.social_network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByUserAndExpiresAtAfterOrderByCreatedAtDesc(User user, LocalDateTime now);

    List<Story> findByUserInAndExpiresAtAfterOrderByCreatedAtDesc(List<User> users, LocalDateTime now);
}
