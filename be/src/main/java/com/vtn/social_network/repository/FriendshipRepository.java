package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Friendship;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.FriendshipStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

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

    @Query("SELECT f FROM Friendship f WHERE (f.requester = :user OR f.addressee = :user) AND f.status = :status")
    Page<Friendship> findFriendsByUserAndStatus(
            @Param("user") User user,
            @Param("status") FriendshipStatus status,
            Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.id IN (" +
           "  SELECT CASE WHEN f1.requester = :u1 THEN f1.addressee.id ELSE f1.requester.id END " +
           "  FROM Friendship f1 WHERE (f1.requester = :u1 OR f1.addressee = :u1) AND f1.status = 'ACCEPTED'" +
           ") AND u.id IN (" +
           "  SELECT CASE WHEN f2.requester = :u2 THEN f2.addressee.id ELSE f2.requester.id END " +
           "  FROM Friendship f2 WHERE (f2.requester = :u2 OR f2.addressee = :u2) AND f2.status = 'ACCEPTED'" +
           ")")
    List<User> findMutualFriends(@Param("u1") User u1, @Param("u2") User u2, Pageable pageable);

    // Lấy danh sách bị chặn (Chỉ lấy do mình làm requester)
    List<Friendship> findByRequesterAndStatus(User requester, FriendshipStatus status);

    // ======= ID-only queries (tránh N+1 lazy load User) =======

    @Query("SELECT CASE WHEN f.requester.id = :userId THEN f.addressee.id ELSE f.requester.id END " +
           "FROM Friendship f WHERE (f.requester.id = :userId OR f.addressee.id = :userId) " +
           "AND f.status = 'BLOCKED'")
    Set<Long> findBlockedUserIds(@Param("userId") Long userId);

    @Query("SELECT CASE WHEN f.requester.id = :userId THEN f.addressee.id ELSE f.requester.id END " +
           "FROM Friendship f WHERE (f.requester.id = :userId OR f.addressee.id = :userId) " +
           "AND f.status = 'ACCEPTED'")
    Set<Long> findFriendIdsByUserId(@Param("userId") Long userId);
}
