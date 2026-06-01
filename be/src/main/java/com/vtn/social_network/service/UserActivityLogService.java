package com.vtn.social_network.service;

import com.vtn.social_network.entity.User;
import com.vtn.social_network.entity.UserActivityLog;
import com.vtn.social_network.repository.UserActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserActivityLogService {

    private final UserActivityLogRepository activityLogRepository;

    @Transactional
    public void logActivity(User user, String action, String ipAddress, String userAgent, String description) {
        UserActivityLog entry = UserActivityLog.builder()
                .user(user)
                .action(action)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .description(description)
                .build();
        activityLogRepository.save(entry);
        log.info("ACTIVITY: user={} action={} ip={}", user.getUsername(), action, ipAddress);
    }

    @Transactional(readOnly = true)
    public Page<UserActivityLog> getMyActivityLog(User user, int page, int size) {
        return activityLogRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(page, size));
    }
}
