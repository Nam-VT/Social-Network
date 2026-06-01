package com.vtn.social_network.entity;

import com.vtn.social_network.enums.Gender;
import com.vtn.social_network.enums.RelationshipStatus;
import com.vtn.social_network.enums.UserRole;
import com.vtn.social_network.enums.UserStatus;
import com.vtn.social_network.enums.Visibility;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    private String fullName;
    private String avatarUrl;
    private String coverUrl;
    private String bio;
    private String location;
    private String resetToken;

    private LocalDateTime resetTokenExpiry;

    @Builder.Default
    @Column(nullable = false)
    private boolean emailVerified = false;

    private String verificationToken;

    private String website;
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    private RelationshipStatus relationshipStatus;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Visibility friendListVisibility = Visibility.PUBLIC;

    /** true = ai cũng có thể follow (tài khoản công khai - default) */
    /** false = chỉ bạn bè mới auto-follow (tài khoản riêng tư) */
    @Builder.Default
    @Column(nullable = false)
    private boolean allowPublicFollowers = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime lastSeenAt;
}
