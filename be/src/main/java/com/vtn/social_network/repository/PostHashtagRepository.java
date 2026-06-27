package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Post;
import com.vtn.social_network.entity.PostHashtag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.vtn.social_network.entity.User;

@Repository
public interface PostHashtagRepository extends JpaRepository<PostHashtag, Long> {
    void deleteByPost(Post post);

    @Query(value = "SELECT p FROM PostHashtag ph JOIN ph.post p LEFT JOIN FETCH p.user LEFT JOIN FETCH p.group WHERE ph.hashtag.name = :tag AND " +
           "(" +
           "  (p.group IS NULL AND (" +
           "    p.user = :currentUser OR " +
           "    p.visibility = 'PUBLIC' OR " +
           "    (p.visibility = 'FRIENDS' AND (" +
           "      p.user IN (SELECT f.addressee FROM Friendship f WHERE f.requester = :currentUser AND f.status = 'ACCEPTED') OR " +
           "      p.user IN (SELECT f.requester FROM Friendship f WHERE f.addressee = :currentUser AND f.status = 'ACCEPTED')" +
           "    ))" +
           "  ))" +
           "  OR " +
           "  (p.group IS NOT NULL AND p.groupPostStatus = 'APPROVED' AND p.group IN (" +
           "    SELECT gm.group FROM GroupMember gm WHERE gm.user = :currentUser AND gm.approved = true" +
           "  ))" +
           ") ORDER BY p.createdAt DESC",
           countQuery = "SELECT count(p) FROM PostHashtag ph JOIN ph.post p WHERE ph.hashtag.name = :tag AND " +
           "(" +
           "  (p.group IS NULL AND (" +
           "    p.user = :currentUser OR " +
           "    p.visibility = 'PUBLIC' OR " +
           "    (p.visibility = 'FRIENDS' AND (" +
           "      p.user IN (SELECT f.addressee FROM Friendship f WHERE f.requester = :currentUser AND f.status = 'ACCEPTED') OR " +
           "      p.user IN (SELECT f.requester FROM Friendship f WHERE f.addressee = :currentUser AND f.status = 'ACCEPTED')" +
           "    ))" +
           "  ))" +
           "  OR " +
           "  (p.group IS NOT NULL AND p.groupPostStatus = 'APPROVED' AND p.group IN (" +
           "    SELECT gm.group FROM GroupMember gm WHERE gm.user = :currentUser AND gm.approved = true" +
           "  ))" +
           ")")
    Page<Post> findPostsByHashtagName(@Param("tag") String tag, @Param("currentUser") User currentUser, Pageable pageable);
}
