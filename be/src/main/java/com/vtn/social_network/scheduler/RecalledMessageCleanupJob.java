package com.vtn.social_network.scheduler;

import com.vtn.social_network.entity.ChatMessage;
import com.vtn.social_network.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Cron job dọn dẹp tin nhắn bị gỡ (recalled) cũ hơn 30 ngày.
 * Chạy lúc 3h sáng mỗi ngày để giảm tải database.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RecalledMessageCleanupJob {

    private final ChatMessageRepository chatMessageRepository;

    @Scheduled(cron = "0 0 3 * * ?") // 3:00 AM mỗi ngày
    @Transactional
    public void cleanupRecalledMessages() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(30);
        List<ChatMessage> oldRecalled = chatMessageRepository
                .findByIsRecalledTrueAndCreatedAtBefore(threshold);

        if (!oldRecalled.isEmpty()) {
            chatMessageRepository.deleteAll(oldRecalled);
            log.info("Đã dọn dẹp {} tin nhắn bị gỡ cũ hơn 30 ngày", oldRecalled.size());
        }
    }
}
