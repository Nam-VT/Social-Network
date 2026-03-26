package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Post;
import com.vtn.social_network.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    // Tìm bài viết theo user (cho Profile)
    List<Post> findByUserOrderByCreatedAtDesc(User user);

    // Tìm bài viết cho News Feed (Cursor-based)
    List<Post> findByCreatedAtBeforeOrderByCreatedAtDesc(LocalDateTime lastTimestamp, Pageable pageable);
}
