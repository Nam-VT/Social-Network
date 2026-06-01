package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Post;
import com.vtn.social_network.entity.SavedPost;
import com.vtn.social_network.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {
    Optional<SavedPost> findByUserAndPost(User user, Post post);

    boolean existsByUserAndPost(User user, Post post);

    Page<SavedPost> findByUserOrderBySavedAtDesc(User user, Pageable pageable);

    void deleteByUserAndPost(User user, Post post);

    @org.springframework.data.jpa.repository.Query("SELECT sp.post.id FROM SavedPost sp WHERE sp.user = :user AND sp.post.id IN :postIds")
    java.util.Set<Long> findPostIdsSavedByUser(@org.springframework.data.repository.query.Param("user") User user, @org.springframework.data.repository.query.Param("postIds") java.util.Collection<Long> postIds);
}
