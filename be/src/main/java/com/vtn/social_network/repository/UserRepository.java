package com.vtn.social_network.repository;

import com.vtn.social_network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
        Optional<User> findByUsername(String username);
        
        java.util.List<User> findByUsernameIn(java.util.Collection<String> usernames);

        Optional<User> findByEmail(String email);

        boolean existsByUsername(String username);

        boolean existsByEmail(String email);

        Optional<User> findByVerificationToken(String verificationToken);

        org.springframework.data.domain.Page<User> findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(String username, String fullName, org.springframework.data.domain.Pageable pageable);

        @org.springframework.data.jpa.repository.Query(value = "SELECT u.id, u.username, u.full_name, u.avatar_url, " +
                        "(SELECT COUNT(*) FROM friendships f1 JOIN friendships f2 ON " +
                        "  (f1.requester_id = u.id OR f1.addressee_id = u.id) AND f1.status = 'ACCEPTED' AND " +
                        "  (f2.requester_id = :userId OR f2.addressee_id = :userId) AND f2.status = 'ACCEPTED' AND " +
                        "  (CASE WHEN f1.requester_id = u.id THEN f1.addressee_id ELSE f1.requester_id END) = " +
                        "  (CASE WHEN f2.requester_id = :userId THEN f2.addressee_id ELSE f2.requester_id END)) " +
                        "AS mutual_count " +
                        "FROM users u " +
                        "WHERE u.id != :userId " +
                        "AND u.id NOT IN (" +
                        "   SELECT requester_id FROM friendships WHERE addressee_id = :userId " +
                        "   UNION " +
                        "   SELECT addressee_id FROM friendships WHERE requester_id = :userId " +
                        ") " +
                        "ORDER BY mutual_count DESC, u.created_at DESC " +
                        "LIMIT :limit", nativeQuery = true)
        java.util.List<Object[]> findFriendSuggestions(
                        @org.springframework.data.repository.query.Param("userId") Long userId,
                        @org.springframework.data.repository.query.Param("limit") int limit);
}
