package com.vtn.social_network.repository;

import com.vtn.social_network.entity.PostMedia;
import com.vtn.social_network.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {
    List<PostMedia> findByPostOrderByPositionAsc(Post post);
}
