package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Comment;
import com.vtn.social_network.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostAndParentIsNullOrderByCreatedAtAsc(Post post);

    List<Comment> findByParentOrderByCreatedAtAsc(Comment parent);
}
