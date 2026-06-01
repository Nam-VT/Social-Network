package com.vtn.social_network.repository;

import com.vtn.social_network.entity.User;
import com.vtn.social_network.entity.UserActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserActivityLogRepository extends JpaRepository<UserActivityLog, Long> {
    Page<UserActivityLog> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
}
