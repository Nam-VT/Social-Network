package com.vtn.social_network.service;

import com.vtn.social_network.entity.AuditLog;
import com.vtn.social_network.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(String adminUsername, String action, String targetType, Long targetId, String description) {
        AuditLog entry = AuditLog.builder()
                .adminUsername(adminUsername)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .description(description)
                .build();
        auditLogRepository.save(entry);
        log.info("AUDIT: {} performed {} on {} #{} — {}", adminUsername, action, targetType, targetId, description);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(int page, int size) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }
}
