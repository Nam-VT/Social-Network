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

        // Lấy bài viết cho News Feed: từ mình, bạn bè (PUBLIC+FRIENDS), người đang
        // follow (PUBLIC only)
        @org.springframework.data.jpa.repository.Query("SELECT p FROM Post p WHERE p.createdAt < :cursor AND " +
        // Loại trừ blocked users
                        "p.user.id NOT IN (" +
                        "  SELECT CASE WHEN f2.requester.id = :userId THEN f2.addressee.id ELSE f2.requester.id END " +
                        "  FROM Friendship f2 " +
                        "  WHERE (f2.requester.id = :userId OR f2.addressee.id = :userId) AND f2.status = 'BLOCKED'" +
                        ") AND (" +
                        // Bài của chính mình
                        "  p.user = :currentUser " +
                        "  OR " +
                        // Bài PUBLIC của bạn bè hoặc người đang follow
                        "  (p.visibility = 'PUBLIC' AND p.user.id IN (" +
                        "    SELECT flw.following.id FROM Follow flw WHERE flw.follower = :currentUser" +
                        "  )) " +
                        "  OR " +
                        // Bài FRIENDS của bạn bè (phải có Friendship ACCEPTED)
                        "  (p.visibility = 'FRIENDS' AND (" +
                        "    p.user IN (SELECT f.addressee FROM Friendship f WHERE f.requester = :currentUser AND f.status = 'ACCEPTED') "
                        +
                        "    OR p.user IN (SELECT f.requester FROM Friendship f WHERE f.addressee = :currentUser AND f.status = 'ACCEPTED')"
                        +
                        "  ))" +
                        ") ORDER BY p.createdAt DESC")
        List<Post> findNewsFeedForUser(
                        @org.springframework.data.repository.query.Param("currentUser") User currentUser,
                        @org.springframework.data.repository.query.Param("userId") Long userId,
                        @org.springframework.data.repository.query.Param("cursor") java.time.LocalDateTime cursor,
                        org.springframework.data.domain.Pageable pageable);
}
