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

    @Query("SELECT ph.post FROM PostHashtag ph WHERE ph.hashtag.name = :tag AND " +
           "(" +
           "  (ph.post.group IS NULL AND (" +
           "    ph.post.user = :currentUser OR " +
           "    ph.post.visibility = 'PUBLIC' OR " +
           "    (ph.post.visibility = 'FRIENDS' AND (" +
           "      ph.post.user IN (SELECT f.addressee FROM Friendship f WHERE f.requester = :currentUser AND f.status = 'ACCEPTED') OR " +
           "      ph.post.user IN (SELECT f.requester FROM Friendship f WHERE f.addressee = :currentUser AND f.status = 'ACCEPTED')" +
           "    ))" +
           "  ))" +
           "  OR " +
           "  (ph.post.group IS NOT NULL AND ph.post.groupPostStatus = 'APPROVED' AND ph.post.group IN (" +
           "    SELECT gm.group FROM GroupMember gm WHERE gm.user = :currentUser AND gm.approved = true" +
           "  ))" +
           ") ORDER BY ph.post.createdAt DESC")
    Page<Post> findPostsByHashtagName(@Param("tag") String tag, @Param("currentUser") User currentUser, Pageable pageable);
}
