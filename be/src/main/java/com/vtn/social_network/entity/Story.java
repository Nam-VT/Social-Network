package com.vtn.social_network.entity;

import com.vtn.social_network.enums.MediaType;
import com.vtn.social_network.enums.Visibility;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "stories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Story {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    private MediaType mediaType;

    private String caption; // Mô tả ngắn cho story

    @Column(name = "bg_color", length = 20)
    private String bgColor;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Visibility visibility = Visibility.FRIENDS;

    private LocalDateTime expiresAt; // Thường là createdAt + 24h

    @Builder.Default
    private boolean isArchived = false; // Đã lưu trữ (highlight)

    @Enumerated(EnumType.STRING)
    private Visibility archiveVisibility; // PUBLIC / PRIVATE / FRIENDS

    @CreationTimestamp
    private LocalDateTime createdAt;
}
