package com.vtn.social_network.service;

import com.vtn.social_network.entity.Story;
import com.vtn.social_network.enums.MediaType;
import com.vtn.social_network.repository.StoryRepository;
import com.vtn.social_network.repository.StoryViewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoryCleanupService {

    private final StoryRepository storyRepository;
    private final StoryViewRepository storyViewRepository;
    private final CloudinaryService cloudinaryService;

    /**
     * Chạy mỗi giờ (0 phút, 0 giây)
     * Xoá các story đã hết hạn (expiresAt < now) và KHÔNG được lưu trữ (isArchived = false).
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredStories() {
        log.info("Bắt đầu dọn dẹp các story đã hết hạn...");
        
        List<Story> expiredStories = storyRepository.findByExpiresAtBeforeAndIsArchivedFalse(LocalDateTime.now());
        
        if (!expiredStories.isEmpty()) {
            // Delete views first to avoid FK constraints
            for (Story story : expiredStories) {
                storyViewRepository.deleteByStory(story);
                
                // Delete media from Cloudinary if it's not a TEXT story
                if (story.getMediaType() != MediaType.TEXT && story.getMediaUrl() != null) {
                    String publicId = cloudinaryService.extractPublicIdFromUrl(story.getMediaUrl());
                    if (publicId != null) {
                        cloudinaryService.delete(publicId);
                    }
                }
            }
            // Delete stories
            storyRepository.deleteAll(expiredStories);
            log.info("Đã dọn dẹp {} story hết hạn.", expiredStories.size());
        } else {
            log.info("Không có story nào cần dọn dẹp.");
        }
    }
}
