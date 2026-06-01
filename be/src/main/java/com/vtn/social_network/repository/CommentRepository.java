package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Comment;
import com.vtn.social_network.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostAndParentIsNullOrderByCreatedAtAsc(Post post);

    Page<Comment> findByPostAndParentIsNullOrderByCreatedAtAsc(Post post,
            Pageable pageable);

    Page<Comment> findByParentOrderByCreatedAtAsc(Comment parent, Pageable pageable);

    List<Comment> findByParentOrderByCreatedAtAsc(Comment parent);

    long countByParent(Comment parent);

    List<Comment> findByPostOrderByCreatedAtDesc(Post post);

    List<Comment> findByPostAndParentIsNullOrderByCreatedAtDesc(Post post);

    long countByPost(Post post);

    @org.springframework.data.jpa.repository.Query("SELECT c.post.id, COUNT(c) FROM Comment c WHERE c.post.id IN :postIds GROUP BY c.post.id")
    List<Object[]> countBatchByPostIds(@org.springframework.data.repository.query.Param("postIds") java.util.Collection<Long> postIds);
}
