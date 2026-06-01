package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Story;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.Visibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByUserAndExpiresAtAfterOrderByCreatedAtDesc(User user, LocalDateTime now);

    List<Story> findByUserInAndExpiresAtAfterOrderByCreatedAtDesc(List<User> users, LocalDateTime now);

    List<Story> findByExpiresAtBefore(LocalDateTime now);

    // Archive: lấy tất cả story đã lưu trữ của user
    List<Story> findByUserAndIsArchivedTrueOrderByCreatedAtDesc(User user);

    // Archive: lấy story đã lưu trữ với visibility cụ thể (dùng cho người khác xem)
    List<Story> findByUserAndIsArchivedTrueAndArchiveVisibilityOrderByCreatedAtDesc(
            User user, Visibility visibility);

    // Cleanup: story hết hạn > threshold VÀ chưa được archive
    List<Story> findByExpiresAtBeforeAndIsArchivedFalse(LocalDateTime threshold);
}
