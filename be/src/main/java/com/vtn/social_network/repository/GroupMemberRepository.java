package com.vtn.social_network.repository;

import com.vtn.social_network.entity.GroupMember;
import com.vtn.social_network.entity.SocialGroup;
import com.vtn.social_network.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    Optional<GroupMember> findByGroupAndUser(SocialGroup group, User user);

    boolean existsByGroupAndUser(SocialGroup group, User user);

    List<GroupMember> findByUserAndGroupIn(User user, List<SocialGroup> groups);

    List<GroupMember> findByGroupAndApprovedTrue(SocialGroup group);
    Page<GroupMember> findByGroupAndApprovedTrue(SocialGroup group, Pageable pageable);

    List<GroupMember> findByGroupAndApprovedFalse(SocialGroup group);
    Page<GroupMember> findByGroupAndApprovedFalse(SocialGroup group, Pageable pageable);

    List<GroupMember> findByUserAndApprovedTrue(User user);
    Page<GroupMember> findByUserAndApprovedTrue(User user, Pageable pageable);

    void deleteByGroupAndUser(SocialGroup group, User user);
}
