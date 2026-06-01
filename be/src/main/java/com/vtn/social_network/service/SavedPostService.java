package com.vtn.social_network.service;

import com.vtn.social_network.entity.Post;
import com.vtn.social_network.entity.SavedPost;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.repository.PostRepository;
import com.vtn.social_network.repository.SavedPostRepository;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SavedPostService {

    private final SavedPostRepository savedPostRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostService postService; // Inject PostService để map full post

    @Transactional
    public void savePost(String username, Long postId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        if (savedPostRepository.existsByUserAndPost(user, post)) {
            throw new RuntimeException("Bạn đã lưu bài viết này rồi");
        }

        savedPostRepository.save(SavedPost.builder().user(user).post(post).build());
        log.info("User {} đã lưu bài viết {}", username, postId);
    }

    @Transactional
    public void unsavePost(String username, Long postId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        savedPostRepository.deleteByUserAndPost(user, post);
        log.info("User {} đã bỏ lưu bài viết {}", username, postId);
    }

    @Transactional(readOnly = true)
    public Page<SavedPostResponse> getSavedPosts(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        return savedPostRepository.findByUserOrderBySavedAtDesc(user, pageable)
                .map(savedPost -> toSavedPostResponse(savedPost, user));
    }

    public boolean isPostSaved(String username, Long postId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));
        return savedPostRepository.existsByUserAndPost(user, post);
    }

    private SavedPostResponse toSavedPostResponse(SavedPost savedPost, User currentUser) {
        return SavedPostResponse.builder()
                .savedPostId(savedPost.getId())
                .savedAt(savedPost.getSavedAt())
                .post(postService.toPostResponse(savedPost.getPost(), currentUser))
                .build();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SavedPostResponse {
        private Long savedPostId;
        private java.time.LocalDateTime savedAt;
        private com.vtn.social_network.dto.post.response.PostResponse post;
    }
}
