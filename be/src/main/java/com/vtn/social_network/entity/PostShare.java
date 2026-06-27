package com.vtn.social_network.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_shares")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostShare {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_post_id")
    private Post originalPost;

    @Column(columnDefinition = "TEXT")
    private String content; // Lời bình khi share (nullable)

    @CreationTimestamp
    private LocalDateTime createdAt;
}
