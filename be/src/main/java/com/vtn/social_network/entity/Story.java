package com.vtn.social_network.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "stories")
@Data
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
    private com.vtn.social_network.enums.MediaType mediaType;

    private LocalDateTime expiresAt; // Thường là createdAt + 24h

    @CreationTimestamp
    private LocalDateTime createdAt;
}
