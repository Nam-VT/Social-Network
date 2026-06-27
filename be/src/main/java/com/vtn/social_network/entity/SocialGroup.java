package com.vtn.social_network.entity;

import com.vtn.social_network.enums.GroupPrivacy;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "social_groups")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String coverUrl;
    private String avatarUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private GroupPrivacy privacy = GroupPrivacy.PUBLIC;

    @Builder.Default
    private boolean requirePostApproval = false;

    @Builder.Default
    private int memberCount = 1;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
