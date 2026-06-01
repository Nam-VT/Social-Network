package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Post;
import com.vtn.social_network.entity.PostShare;
import com.vtn.social_network.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostShareRepository extends JpaRepository<PostShare, Long> {
    List<PostShare> findByOriginalPostOrderByCreatedAtDesc(Post post);

    Page<PostShare> findByOriginalPostOrderByCreatedAtDesc(Post post,
            Pageable pageable);

    long countByOriginalPost(Post post);

    boolean existsByUserAndOriginalPost(User user, Post post);

    @org.springframework.data.jpa.repository.Query("SELECT ps.originalPost.id, COUNT(ps) FROM PostShare ps WHERE ps.originalPost.id IN :postIds GROUP BY ps.originalPost.id")
    List<Object[]> countBatchByPostIds(@org.springframework.data.repository.query.Param("postIds") java.util.Collection<Long> postIds);
}
