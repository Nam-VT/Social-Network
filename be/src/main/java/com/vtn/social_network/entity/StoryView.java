package com.vtn.social_network.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "story_views")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryView {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id")
    private Story story;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User viewer;

    @Enumerated(EnumType.STRING)
    private com.vtn.social_network.enums.ReactionType reactionType;

    @CreationTimestamp
    private LocalDateTime viewedAt;
}
