package com.vtn.social_network.scheduler;

import com.vtn.social_network.entity.Story;
import com.vtn.social_network.repository.StoryRepository;
import com.vtn.social_network.repository.StoryViewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Dọn dẹp story hết hạn:
 * - Story hết hạn > 7 ngày + CHƯA archive → xóa vĩnh viễn
 * - Story đã archive → giữ vĩnh viễn cho đến khi user tự gỡ
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StoryCleanupScheduler {

    private final StoryRepository storyRepository;
    private final StoryViewRepository storyViewRepository;

    /**
     * Chạy mỗi giờ, xóa story hết hạn > 7 ngày mà chưa được archive.
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    @Transactional
    public void cleanupExpiredStories() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(7);
        List<Story> expiredStories = storyRepository.findByExpiresAtBeforeAndIsArchivedFalse(threshold);

        if (expiredStories.isEmpty()) {
            return;
        }

        for (Story story : expiredStories) {
            storyViewRepository.deleteByStory(story);
            storyRepository.delete(story);
        }

        log.info("Story cleanup: đã xóa {} story hết hạn > 7 ngày", expiredStories.size());
    }
}
