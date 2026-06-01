package com.vtn.social_network.repository;

import com.vtn.social_network.entity.SocialGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SocialGroupRepository extends JpaRepository<SocialGroup, Long> {
    Page<SocialGroup> findByNameContainingIgnoreCaseOrderByMemberCountDesc(String name, Pageable pageable);
}
