package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Post;
import com.vtn.social_network.entity.SocialGroup;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.GroupPostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
        // Tìm bài viết theo user (cho Profile) nhưng phải lọc bài trong Group Private
        // và bài chờ duyệt trong nhóm (PENDING) chỉ chủ bài mới thấy của chính mình
        @Query("SELECT p FROM Post p LEFT JOIN p.group g WHERE p.user = :targetUser AND " +
                        "(g IS NULL OR " +
                        " (g.privacy = 'PUBLIC' AND (p.groupPostStatus = 'APPROVED' OR p.user = :currentUser)) OR " +
                        " (g.privacy = 'PRIVATE' AND g IN (" +
                        "   SELECT gm.group FROM GroupMember gm WHERE gm.user = :currentUser AND gm.approved = true" +
                        " ) AND (p.groupPostStatus = 'APPROVED' OR p.user = :currentUser))) " +
                        "ORDER BY p.createdAt DESC")
        Page<Post> findProfilePostsForUser(
                        @Param("targetUser") User targetUser,
                        @Param("currentUser") User currentUser,
                        Pageable pageable);

        // Lấy bài viết cho News Feed: từ mình, bạn bè (PUBLIC+FRIENDS), người đang
        // follow (PUBLIC only), và bài từ Groups đã tham gia
        @Query("SELECT p FROM Post p WHERE p.createdAt < :cursor AND " +
                        "p.user.id NOT IN (" +
                        "  SELECT CASE WHEN f2.requester.id = :userId THEN f2.addressee.id ELSE f2.requester.id END " +
                        "  FROM Friendship f2 " +
                        "  WHERE (f2.requester.id = :userId OR f2.addressee.id = :userId) AND f2.status = 'BLOCKED'" +
                        ") AND (" +
                        "  (p.group IS NULL AND (" +
                        "    p.user = :currentUser " +
                        "    OR " +
                        "    (p.visibility = 'PUBLIC' AND p.user.id IN (" +
                        "      SELECT flw.following.id FROM Follow flw WHERE flw.follower = :currentUser" +
                        "    )) " +
                        "    OR " +
                        "    (p.visibility = 'FRIENDS' AND (" +
                        "      p.user IN (SELECT f.addressee FROM Friendship f WHERE f.requester = :currentUser AND f.status = 'ACCEPTED') "
                        +
                        "      OR p.user IN (SELECT f.requester FROM Friendship f WHERE f.addressee = :currentUser AND f.status = 'ACCEPTED')"
                        +
                        "    ))" +
                        "  ))" +
                        "  OR " +
                        "  (p.group IS NOT NULL AND p.groupPostStatus = 'APPROVED' AND p.group IN (" +
                        "    SELECT gm.group FROM GroupMember gm WHERE gm.user = :currentUser AND gm.approved = true" +
                        "  ))" +
                        ") ORDER BY p.createdAt DESC")
        List<Post> findNewsFeedForUser(
                        @Param("currentUser") User currentUser,
                        @Param("userId") Long userId,
                        @Param("cursor") LocalDateTime cursor,
                        Pageable pageable);

        // Group feed
        List<Post> findByGroupAndGroupPostStatusOrderByCreatedAtDesc(SocialGroup group, GroupPostStatus status);

        Page<Post> findByGroupAndGroupPostStatusOrderByCreatedAtDesc(SocialGroup group,
                        GroupPostStatus status, Pageable pageable);

        // Admin search
        Page<Post> findByContentContainingIgnoreCase(String keyword, Pageable pageable);
}
