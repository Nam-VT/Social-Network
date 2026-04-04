package com.vtn.social_network.repository;

import com.vtn.social_network.entity.Follow;
import com.vtn.social_network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    Optional<Follow> findByFollowerAndFollowing(User follower, User following);

    boolean existsByFollowerAndFollowing(User follower, User following);

    List<Follow> findByFollowing(User following); // Ai đang Follow tôi (my followers)

    List<Follow> findByFollower(User follower); // Tôi đang theo dõi ai (my following list)

    long countByFollowing(User following); // Số lượng followers

    long countByFollower(User follower); // Số lượng following

    void deleteByFollowerAndFollowing(User follower, User following);

    // Xóa toàn bộ follow liên quan tới user (dùng khi Block)
    void deleteByFollowerOrFollowing(User follower, User following);
}
