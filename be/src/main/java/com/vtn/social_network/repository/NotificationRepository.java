package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Notification;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.NotificationType;
import com.vtn.social_network.enums.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
        List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

        Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient,
                        Pageable pageable);

        // Tìm thông báo chưa đọc cùng loại từ cùng 1 người để gộp (Deduplicate)
        // Dùng cho: FRIEND_REQ, FOLLOWED (không phụ thuộc đối tượng cụ thể)
        Optional<Notification> findByRecipientAndActorAndTypeAndIsReadFalse(User recipient, User actor,
                        NotificationType type);

        // Tìm thông báo chưa đọc có cùng đối tượng mục tiêu (targetId + targetType) để
        // gộp
        // Dùng cho: LIKE_POST, LIKE_COMMENT, COMMENT (cần biết Like bài nào)
        Optional<Notification> findByRecipientAndActorAndTypeAndTargetIdAndTargetTypeAndIsReadFalse(
                        User recipient, User actor, NotificationType type, Long targetId,
                        TargetType targetType);

        // Đếm số thông báo chưa đọc — dùng cho badge trên icon chuông
        long countByRecipientAndIsReadFalse(User recipient);

        // Đánh dấu tất cả thông báo của user là đã đọc
        @Modifying
        @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient = :user AND n.isRead = false")
        void markAllAsReadByRecipient(@Param("user") User user);
}
