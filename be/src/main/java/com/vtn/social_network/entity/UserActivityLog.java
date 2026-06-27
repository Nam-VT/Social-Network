package com.vtn.social_network.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Ghi lại lịch sử hoạt động quan trọng của người dùng.
 * Ví dụ: đăng nhập, đổi mật khẩu, đổi email, đăng xuất...
 */
@Entity
@Table(name = "user_activity_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String action; // LOGIN, CHANGE_PASSWORD, CHANGE_EMAIL, LOGIN_FAILED

    private String ipAddress;
    private String userAgent;

    @Column(length = 500)
    private String description;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
