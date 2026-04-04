package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Reaction;
import com.vtn.social_network.enums.TargetType;
import com.vtn.social_network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    Optional<Reaction> findByUserAndTargetIdAndTargetType(User user, Long targetId, TargetType targetType);

    List<Reaction> findByTargetIdAndTargetType(Long targetId, TargetType targetType);

    long countByTargetIdAndTargetType(Long targetId, TargetType targetType);
}
