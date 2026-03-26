package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Friendship;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    Optional<Friendship> findByRequesterAndAddressee(User requester, User addressee);

    List<Friendship> findByRequesterOrAddresseeAndStatus(User requester, User addressee, FriendshipStatus status);
}
