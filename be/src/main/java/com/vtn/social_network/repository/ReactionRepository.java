package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Reaction;
import com.vtn.social_network.enums.TargetType;
import com.vtn.social_network.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    Optional<Reaction> findByUserAndTargetIdAndTargetType(User user, Long targetId, TargetType targetType);

    List<Reaction> findByTargetIdAndTargetType(Long targetId, TargetType targetType);

    Page<Reaction> findByTargetIdAndTargetType(Long targetId, TargetType targetType,
            Pageable pageable);

    long countByTargetIdAndTargetType(Long targetId, TargetType targetType);

    @org.springframework.data.jpa.repository.Query("SELECT r.reactionType, COUNT(r) FROM Reaction r WHERE r.targetId = :targetId AND r.targetType = :targetType GROUP BY r.reactionType")
    List<Object[]> countReactionsByType(@org.springframework.data.repository.query.Param("targetId") Long targetId, @org.springframework.data.repository.query.Param("targetType") TargetType targetType);

    // ===== Batch queries for N+1 fix =====
    @org.springframework.data.jpa.repository.Query("SELECT r.targetId, COUNT(r) FROM Reaction r WHERE r.targetId IN :postIds AND r.targetType = :type GROUP BY r.targetId")
    List<Object[]> countBatchByPostIds(@org.springframework.data.repository.query.Param("postIds") java.util.Collection<Long> postIds, @org.springframework.data.repository.query.Param("type") TargetType type);

    @org.springframework.data.jpa.repository.Query("SELECT r.targetId, r.reactionType, COUNT(r) FROM Reaction r WHERE r.targetId IN :postIds AND r.targetType = :type GROUP BY r.targetId, r.reactionType")
    List<Object[]> countBatchByTypeAndPostIds(@org.springframework.data.repository.query.Param("postIds") java.util.Collection<Long> postIds, @org.springframework.data.repository.query.Param("type") TargetType type);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Reaction r WHERE r.user = :user AND r.targetId IN :postIds AND r.targetType = :type")
    List<Reaction> findBatchByUserAndPostIds(@org.springframework.data.repository.query.Param("user") User user, @org.springframework.data.repository.query.Param("postIds") java.util.Collection<Long> postIds, @org.springframework.data.repository.query.Param("type") TargetType type);
}
