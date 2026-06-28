package com.vtn.social_network.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.vtn.social_network.entity.Post;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.repository.PostRepository;
import com.vtn.social_network.repository.UserRepository;
import com.vtn.social_network.search.PostDocument;
import com.vtn.social_network.search.PostSearchRepository;
import com.vtn.social_network.search.UserDocument;
import com.vtn.social_network.search.UserSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchIndexingService {

    private final UserSearchRepository userSearchRepository;
    private final PostSearchRepository postSearchRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ObjectMapper objectMapper;
    private final KafkaTemplate<Object, Object> kafkaTemplate;

    public void sendSearchIndexEvent(String event, Long id) {
        try {
            java.util.Map<String, Object> message = new java.util.HashMap<>();
            message.put("event", event);
            message.put("id", id);
            String jsonMessage = objectMapper.writeValueAsString(message);
            kafkaTemplate.send("search-indexing", jsonMessage);
            log.info("Đã gửi sự kiện Kafka ({}): {}", event, id);
        } catch (Exception e) {
            log.error("Lỗi khi gửi sự kiện search-indexing: {}", e.getMessage(), e);
        }
    }

    /**
     * Kafka Consumer lắng nghe topic "search-indexing".
     * Message format (JSON): { "event":
     * "USER_UPDATED|POST_CREATED|POST_UPDATED|POST_DELETED", "id": 123 }
     */
    @KafkaListener(topics = "search-indexing", groupId = "search-indexing-group")
    public void handleSearchIndexing(String message) {
        try {
            JsonNode json = objectMapper.readTree(message);
            String event = json.get("event").asText();
            Long id = json.get("id").asLong();

            switch (event) {
                case "USER_UPDATED" -> indexUser(id);
                case "POST_CREATED", "POST_UPDATED" -> indexPost(id);
                case "POST_DELETED" -> deletePost(id);
                default -> log.warn("Sự kiện không xác định: {}", event);
            }
        } catch (Exception e) {
            log.error("Lỗi xử lý search indexing message: {}", e.getMessage(), e);
        }
    }

    /**
     * Đồng bộ trực tiếp (không qua Kafka) — dùng khi cần index ngay lập tức.
     */
    public void indexUserDirect(User user) {
        UserDocument doc = UserDocument.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .build();
        userSearchRepository.save(doc);
        log.info("Đã index User {} vào ES", user.getUsername());
    }

    public void indexPostDirect(Post post) {
        PostDocument doc = PostDocument.builder()
                .id(post.getId())
                .content(post.getContent())
                .authorId(post.getUser().getId())
                .authorUsername(post.getUser().getUsername())
                .authorFullName(post.getUser().getFullName())
                .visibility(post.getVisibility().name())
                .createdAt(post.getCreatedAt() != null
                        ? post.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
                        : null)
                .build();
        postSearchRepository.save(doc);
        log.info("Đã index Post {} vào ES", post.getId());
    }

    public void deletePostDirect(Long postId) {
        postSearchRepository.deleteById(postId);
        log.info("Đã xóa Post {} khỏi ES", postId);
    }

    public void syncAllPostsToES() {
        List<Post> allPosts = postRepository.findAll();
        for (Post post : allPosts) {
            try {
                indexPostDirect(post);
            } catch (Exception e) {
                log.error("Lỗi khi sync post {}: {}", post.getId(), e.getMessage());
            }
        }
        log.info("Đã đồng bộ {} posts sang ES", allPosts.size());
    }

    // ========== Private Kafka Handlers ==========

    private void indexUser(Long userId) {
        userRepository.findById(userId).ifPresentOrElse(
                this::indexUserDirect,
                () -> log.warn("User {} không tồn tại, bỏ qua indexing", userId));
    }

    private void indexPost(Long postId) {
        postRepository.findById(postId).ifPresentOrElse(
                this::indexPostDirect,
                () -> log.warn("Post {} không tồn tại, bỏ qua indexing", postId));
    }

    private void deletePost(Long postId) {
        deletePostDirect(postId);
    }
}
