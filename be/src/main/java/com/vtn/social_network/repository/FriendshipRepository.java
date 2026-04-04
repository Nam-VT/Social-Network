package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Friendship;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    // Check nếu có bất kỳ quan hệ nào giữa 2 user (A -> B hoặc B -> A)
    @Query("SELECT f FROM Friendship f WHERE (f.requester = :u1 AND f.addressee = :u2) OR (f.requester = :u2 AND f.addressee = :u1)")
    Optional<Friendship> findFriendshipBetween(@Param("u1") User u1, @Param("u2") User u2);

    // Lấy các lời mời kết bạn ĐẾN user này
    List<Friendship> findByAddresseeAndStatus(User addressee, FriendshipStatus status);

    // Lấy danh sách bạn bè (Là requester hoặc addressee)
    @Query("SELECT f FROM Friendship f WHERE (f.requester = :user OR f.addressee = :user) AND f.status = :status")
    List<Friendship> findFriendsByUserAndStatus(@Param("user") User user, @Param("status") FriendshipStatus status);

    // Lấy danh sách bị chặn (Chỉ lấy do mình làm requester)
    List<Friendship> findByRequesterAndStatus(User requester, FriendshipStatus status);
}
