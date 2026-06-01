package com.vtn.social_network.service;

import com.vtn.social_network.dto.post.response.PostResponse;
import com.vtn.social_network.dto.user.response.UserProfileResponse;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.Visibility;
import com.vtn.social_network.repository.FriendshipRepository;
import com.vtn.social_network.search.PostDocument;
import com.vtn.social_network.search.PostSearchRepository;
import com.vtn.social_network.repository.UserRepository;
import com.vtn.social_network.repository.SocialGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.StringQuery;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

        private final UserRepository userRepository;
        private final PostSearchRepository postSearchRepository;
        private final FriendshipRepository friendshipRepository;
        private final SocialGroupRepository socialGroupRepository;
        private final SocialGroupService socialGroupService;
        private final ElasticsearchOperations elasticsearchOperations;

        /**
         * Tìm kiếm người dùng theo keyword (username hoặc họ tên).
         * Loại bỏ những user bị Block bởi người tìm kiếm.
         * Hỗ trợ phân trang.
         */
        public Page<UserProfileResponse> searchUsers(String keyword, User currentUser, int page, int size) {
                Pageable pageable = PageRequest.of(page, size);
                Page<User> results = userRepository
                                .findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(keyword, keyword,
                                                pageable);

                // Lấy danh sách userId bị Block (cả 2 chiều)
                Set<Long> blockedUserIds = getBlockedUserIds(currentUser);

                List<UserProfileResponse> filtered = results.stream()
                                .filter(u -> !blockedUserIds.contains(u.getId()))
                                .filter(u -> !u.getId().equals(currentUser.getId()))
                                .map(this::toUserProfileResponse)
                                .collect(Collectors.toList());

                return new PageImpl<>(filtered, pageable, filtered.size());
        }

        /**
         * Tìm kiếm bài viết theo keyword (nội dung).
         * Lọc Visibility: chỉ trả về bài PUBLIC hoặc bài FRIENDS nếu đang là bạn bè.
         * Loại bỏ bài của user bị Block.
         * Hỗ trợ phân trang.
         */
        public Page<PostResponse> searchPosts(String keyword, User currentUser, int page, int size) {
                Set<Long> blockedUserIds = getBlockedUserIds(currentUser);
                Set<Long> friendIds = getFriendIds(currentUser);

                // Sanitize keyword to avoid JSON escape issues
                String safeKeyword = keyword != null ? keyword.replace("\"", "\\\"").replace("\n", " ") : "";

                StringBuilder queryBuilder = new StringBuilder();
                queryBuilder.append("{ \"bool\": {");

                // 1. MUST: match content with fuzziness
                queryBuilder.append("\"must\": [");
                queryBuilder.append("{ \"match\": { \"content\": { \"query\": \"").append(safeKeyword)
                                .append("\", \"fuzziness\": \"AUTO\" } } }");
                queryBuilder.append("],");

                // 2. MUST_NOT: exclude blocked users
                queryBuilder.append("\"must_not\": [");
                if (!blockedUserIds.isEmpty()) {
                        String blockedStr = blockedUserIds.stream().map(String::valueOf)
                                        .collect(Collectors.joining(","));
                        queryBuilder.append("{ \"terms\": { \"authorId\": [").append(blockedStr).append("] } }");
                }
                queryBuilder.append("],");

                // 3. FILTER: privacy rules (PUBLIC or (FRIENDS & friendIds) or (my posts))
                queryBuilder.append("\"filter\": [");
                queryBuilder.append("{ \"bool\": { \"should\": [");
                // PUBLIC
                queryBuilder.append("{ \"term\": { \"visibility\": \"PUBLIC\" } },");

                // FRIENDS
                String friendStr = friendIds.isEmpty() ? "-1"
                                : friendIds.stream().map(String::valueOf).collect(Collectors.joining(","));
                queryBuilder.append("{ \"bool\": { \"must\": [");
                queryBuilder.append("{ \"term\": { \"visibility\": \"FRIENDS\" } },");
                queryBuilder.append("{ \"terms\": { \"authorId\": [").append(friendStr).append("] } }");
                queryBuilder.append("] } },");

                // My posts
                queryBuilder.append("{ \"term\": { \"authorId\": ").append(currentUser.getId()).append(" } }");

                queryBuilder.append("] } }"); // end should, end bool
                queryBuilder.append("]"); // end filter

                queryBuilder.append("} }"); // end bool, end root

                StringQuery query = new StringQuery(queryBuilder.toString());
                Pageable pageable = PageRequest.of(page, size);
                query.setPageable(pageable);

                // Add Highlighting
                // Assuming PostDocument has field "content"
                org.springframework.data.elasticsearch.core.query.HighlightQuery highlightQuery = new org.springframework.data.elasticsearch.core.query.HighlightQuery(
                                new org.springframework.data.elasticsearch.core.query.highlight.Highlight(
                                                org.springframework.data.elasticsearch.core.query.highlight.HighlightParameters
                                                                .builder()
                                                                .withPreTags("<mark>")
                                                                .withPostTags("</mark>")
                                                                .build(),
                                                java.util.List.of(
                                                                new org.springframework.data.elasticsearch.core.query.highlight.HighlightField(
                                                                                "content"))),
                                null);
                query.setHighlightQuery(highlightQuery);

                SearchHits<PostDocument> searchHits = elasticsearchOperations.search(query, PostDocument.class);

                List<PostResponse> pageContent = searchHits.getSearchHits().stream()
                                .map(hit -> {
                                        PostResponse response = toPostResponse(hit.getContent());
                                        // Apply highlighted content if available
                                        if (hit.getHighlightFields().containsKey("content")) {
                                                List<String> highlights = hit.getHighlightField("content");
                                                if (!highlights.isEmpty()) {
                                                        response.setHighlightedContent(highlights.get(0));
                                                }
                                        }
                                        return response;
                                })
                                .collect(Collectors.toList());

                return new PageImpl<>(pageContent, pageable, searchHits.getTotalHits());
        }

        /**
         * Tìm kiếm nhóm theo keyword (tên nhóm).
         */
        public Page<SocialGroupService.GroupResponse> searchGroups(String keyword, User currentUser, int page,
                        int size) {
                Pageable pageable = PageRequest.of(page, size);
                String username = currentUser != null ? currentUser.getUsername() : null;
                return socialGroupService.searchGroups(keyword, username, pageable);
        }

        // ========== Helpers ==========

        private Set<Long> getBlockedUserIds(User currentUser) {
                return friendshipRepository.findBlockedUserIds(currentUser.getId());
        }

        private Set<Long> getFriendIds(User currentUser) {
                return friendshipRepository.findFriendIdsByUserId(currentUser.getId());
        }

        private UserProfileResponse toUserProfileResponse(User user) {
                return UserProfileResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .fullName(user.getFullName())
                                .bio(user.getBio())
                                .avatarUrl(user.getAvatarUrl())
                                .build();
        }

        private PostResponse toPostResponse(PostDocument doc) {
                return PostResponse.builder()
                                .id(doc.getId())
                                .content(doc.getContent())
                                .authorId(doc.getAuthorId())
                                .authorUsername(doc.getAuthorUsername())
                                .authorFullName(doc.getAuthorFullName())
                                .visibility(Visibility.valueOf(doc.getVisibility()))
                                .createdAt(doc.getCreatedAt() != null
                                                ? java.time.LocalDateTime.ofInstant(
                                                                java.time.Instant.ofEpochMilli(doc.getCreatedAt()),
                                                                java.time.ZoneId.systemDefault())
                                                : null)
                                .build();
        }

        // ========== Autocomplete Suggest ==========

        /**
         * Trả về top 5 gợi ý nhanh (user + post) cho ô tìm kiếm.
         */
        public List<SuggestItem> suggest(String keyword, User currentUser) {
                List<SuggestItem> results = new java.util.ArrayList<>();

                Set<Long> blockedUserIds = currentUser != null ? getBlockedUserIds(currentUser)
                                : new java.util.HashSet<>();

                // Users — tìm theo username hoặc fullName bằng JPA
                userRepository
                                .findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(keyword, keyword,
                                                PageRequest.of(0, 3))
                                .stream()
                                .filter(u -> currentUser == null || !u.getId().equals(currentUser.getId()))
                                .filter(u -> !blockedUserIds.contains(u.getId()))
                                .forEach(u -> results.add(SuggestItem.builder()
                                                .type("USER")
                                                .id(u.getId())
                                                .text(u.getFullName() != null ? u.getFullName() : u.getUsername())
                                                .subText("@" + u.getUsername())
                                                .avatarUrl(u.getAvatarUrl())
                                                .build()));

                // Posts — tìm theo content
                postSearchRepository.findByContentMatches(keyword)
                                .stream()
                                .filter(doc -> "PUBLIC".equals(doc.getVisibility()))
                                .limit(2)
                                .forEach(doc -> results.add(SuggestItem.builder()
                                                .type("POST")
                                                .id(doc.getId())
                                                .text(doc.getContent().length() > 80
                                                                ? doc.getContent().substring(0, 80) + "..."
                                                                : doc.getContent())
                                                .subText("bởi @" + doc.getAuthorUsername())
                                                .build()));

                // Groups — tìm theo tên
                socialGroupRepository
                                .findByNameContainingIgnoreCaseOrderByMemberCountDesc(keyword, PageRequest.of(0, 2))
                                .stream()
                                .forEach(g -> results.add(SuggestItem.builder()
                                                .type("GROUP")
                                                .id(g.getId())
                                                .text(g.getName())
                                                .subText(g.getMemberCount() + " thành viên")
                                                .avatarUrl(g.getCoverUrl())
                                                .build()));

                return results;
        }

        @lombok.Data
        @lombok.Builder
        @lombok.NoArgsConstructor
        @lombok.AllArgsConstructor
        public static class SuggestItem {
                private String type; // USER | POST | GROUP
                private Long id;
                private String text; // Tên hiển thị chính
                private String subText; // Tên phụ (@username, "bởi @...")
                private String avatarUrl;
        }
}
