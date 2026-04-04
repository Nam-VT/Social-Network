package com.vtn.social_network.service;

import com.vtn.social_network.dto.notification.response.NotificationResponse;
import com.vtn.social_network.entity.Notification;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.NotificationType;
import com.vtn.social_network.enums.TargetType;
import com.vtn.social_network.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Tạo thông báo với logic Gộp (Deduplication) và đẩy Real-time qua STOMP
     * WebSocket.
     * Chat (NEW_MSG) KHÔNG đi qua đây — Chat có kênh riêng (/queue/chat).
     */
    @Transactional
    public void sendNotification(User recipient, User actor, NotificationType type, Long targetId,
            TargetType targetType, String deepLink) {
        if (recipient.getId().equals(actor.getId()))
            return; // Không tự notify chính mình

        Optional<Notification> existingOpt = Optional.empty();

        // Nhóm 1: Gộp theo Người dùng (không phụ thuộc target cụ thể)
        if (type == NotificationType.FRIEND_REQ
                || type == NotificationType.FOLLOWED) {
            existingOpt = notificationRepository
                    .findByRecipientAndActorAndTypeAndIsReadFalse(recipient, actor, type);
        }
        // Nhóm 2: Gộp theo đối tượng Target (bài viết / comment cụ thể)
        else if (type == NotificationType.LIKE_POST
                || type == NotificationType.LIKE_COMMENT
                || type == NotificationType.COMMENT) {
            existingOpt = notificationRepository
                    .findByRecipientAndActorAndTypeAndTargetIdAndTargetTypeAndIsReadFalse(
                            recipient, actor, type, targetId, targetType);
        }

        existingOpt.ifPresentOrElse(
                existing -> {
                    // Đẩy thời gian lên top — không tạo rác
                    existing.setCreatedAt(LocalDateTime.now());
                    existing.setDeepLink(deepLink);
                    notificationRepository.save(existing);
                    pushToWebSocket(existing);
                    log.info("GỘP thông báo {} từ {} → {}", type, actor.getUsername(), recipient.getUsername());
                },
                () -> createAndPush(recipient, actor, type, targetId, targetType, deepLink));
    }

    public List<NotificationResponse> getMyNotifications(User user) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    // ========== Private Helpers ==========

    private void createAndPush(User recipient, User actor, NotificationType type,
            Long targetId, TargetType targetType, String deepLink) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(type)
                .targetId(targetId)
                .targetType(targetType)
                .deepLink(deepLink)
                .build();
        notificationRepository.save(notification);
        pushToWebSocket(notification);
        log.info("TẠO MỚI thông báo {} → {}", type, recipient.getUsername());
    }

    private void pushToWebSocket(Notification notification) {
        // Gửi an toàn qua DTO — không lộ Password/Token của Actor
        messagingTemplate.convertAndSendToUser(
                notification.getRecipient().getUsername(),
                "/queue/notifications",
                toResponse(notification));
    }

    private NotificationResponse toResponse(Notification n) {
        User actor = n.getActor();
        return NotificationResponse.builder()
                .id(n.getId())
                .actorId(actor.getId())
                .actorUsername(actor.getUsername())
                .actorFullName(actor.getFullName())
                .actorAvatarUrl(actor.getAvatarUrl())
                .type(n.getType())
                .targetId(n.getTargetId())
                .targetType(n.getTargetType())
                .deepLink(n.getDeepLink())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
