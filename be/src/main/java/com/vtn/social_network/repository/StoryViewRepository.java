package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Story;
import com.vtn.social_network.entity.StoryView;
import com.vtn.social_network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, Long> {
    List<StoryView> findByStoryOrderByViewedAtDesc(Story story);

    List<StoryView> findByStoryInOrderByViewedAtDesc(List<Story> stories);

    boolean existsByStoryAndViewer(Story story, User viewer);

    Optional<StoryView> findFirstByStoryAndViewer(Story story, User viewer);

    void deleteByStory(Story story);
}
