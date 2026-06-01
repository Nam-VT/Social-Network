package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Post;
import com.vtn.social_network.entity.PostHashtag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostHashtagRepository extends JpaRepository<PostHashtag, Long> {
    void deleteByPost(Post post);

    @Query("SELECT ph.post FROM PostHashtag ph WHERE ph.hashtag.name = :tag ORDER BY ph.post.createdAt DESC")
    Page<Post> findPostsByHashtagName(@Param("tag") String tag, Pageable pageable);
}
