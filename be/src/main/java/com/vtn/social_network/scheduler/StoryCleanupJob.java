package com.vtn.social_network.scheduler;

import com.vtn.social_network.entity.Story;
import com.vtn.social_network.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class StoryCleanupJob {

    private final StoryRepository storyRepository;

    /**
     * Chạy lúc 3h sáng mỗi ngày để dọn dẹp các story đã hết hạn.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupExpiredStories() {
        log.info("Bắt đầu dọn dẹp story hết hạn...");

        List<Story> expiredStories = storyRepository.findByExpiresAtBefore(LocalDateTime.now());

        if (!expiredStories.isEmpty()) {
            storyRepository.deleteAll(expiredStories);
            log.info("Đã xóa {} story hết hạn", expiredStories.size());
        } else {
            log.info("Không có story nào hết hạn cần xóa");
        }
    }
}
