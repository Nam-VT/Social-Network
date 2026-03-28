package com.vtn.social_network.service;

import com.vtn.social_network.dto.post.request.CreatePostRequest;
import com.vtn.social_network.dto.post.request.UpdatePostRequest;
import com.vtn.social_network.dto.post.response.PostResponse;
import com.vtn.social_network.entity.Post;
import com.vtn.social_network.entity.PostMedia;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.Visibility;
import com.vtn.social_network.repository.PostRepository;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional
    public PostResponse createPost(String username, CreatePostRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        Post post = Post.builder()
                .user(user)
                .content(request.getContent())
                .visibility(request.getVisibility() != null ? request.getVisibility() : Visibility.PUBLIC)
                .build();

        // Thêm media nếu có
        if (request.getMediaList() != null && !request.getMediaList().isEmpty()) {
            List<PostMedia> mediaList = new ArrayList<>();
            for (int i = 0; i < request.getMediaList().size(); i++) {
                CreatePostRequest.MediaItem item = request.getMediaList().get(i);
                PostMedia media = PostMedia.builder()
                        .post(post)
                        .mediaUrl(item.getMediaUrl())
                        .mediaType(item.getMediaType())
                        .position(i)
                        .build();
                mediaList.add(media);
            }
            post.setMediaList(mediaList);
        }

        postRepository.save(post);
        log.info("User {} đã tạo bài viết id={}", username, post.getId());

        return toPostResponse(post);
    }

    public PostResponse getPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));
        return toPostResponse(post);
    }

    @Transactional
    public PostResponse updatePost(String username, Long postId, UpdatePostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));

        if (!post.getUser().getUsername().equals(username)) {
            throw new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage());
        }

        if (request.getContent() != null) {
            post.setContent(request.getContent());
        }
        if (request.getVisibility() != null) {
            post.setVisibility(request.getVisibility());
        }

        postRepository.save(post);
        log.info("User {} đã cập nhật bài viết id={}", username, postId);

        return toPostResponse(post);
    }

    @Transactional
    public void deletePost(String username, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException(ErrorCode.POST_NOT_FOUND.getMessage()));

        if (!post.getUser().getUsername().equals(username)) {
            throw new RuntimeException(ErrorCode.UNAUTHORIZED.getMessage());
        }

        postRepository.delete(post);
        log.info("User {} đã xóa bài viết id={}", username, postId);
    }

    /**
     * Lấy danh sách bài viết của một user.
     */
    public List<PostResponse> getUserPosts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        return postRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toPostResponse)
                .collect(Collectors.toList());
    }

    /**
     * News Feed: Cursor-based pagination.
     * Client gửi timestamp cuối cùng đã thấy để lấy batch tiếp theo.
     * 🖥️ Local: Trả tất cả bài PUBLIC (chưa lọc theo bạn bè).
     * 🚀 Deploy: Cần bổ sung lọc theo Friendship + Visibility.
     */
    public List<PostResponse> getNewsFeed(LocalDateTime cursor, int size) {
        LocalDateTime effectiveCursor = (cursor != null) ? cursor : LocalDateTime.now();

        return postRepository
                .findByCreatedAtBeforeOrderByCreatedAtDesc(effectiveCursor, PageRequest.of(0, size))
                .stream()
                .map(this::toPostResponse)
                .collect(Collectors.toList());
    }

    // ========== Helper ==========

    private PostResponse toPostResponse(Post post) {
        PostResponse response = new PostResponse();
        response.setId(post.getId());
        response.setContent(post.getContent());
        response.setVisibility(post.getVisibility());
        response.setCreatedAt(post.getCreatedAt());

        // Author info
        User author = post.getUser();
        response.setAuthorId(author.getId());
        response.setAuthorUsername(author.getUsername());
        response.setAuthorFullName(author.getFullName());
        response.setAuthorAvatarUrl(author.getAvatarUrl());

        // Media list
        if (post.getMediaList() != null) {
            List<PostResponse.MediaItem> mediaItems = post.getMediaList().stream()
                    .map(m -> PostResponse.MediaItem.builder()
                            .id(m.getId())
                            .mediaUrl(m.getMediaUrl())
                            .mediaType(m.getMediaType())
                            .position(m.getPosition())
                            .build())
                    .collect(Collectors.toList());
            response.setMediaList(mediaItems);
        }

        return response;
    }
}
