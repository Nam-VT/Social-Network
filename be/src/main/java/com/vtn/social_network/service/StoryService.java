package com.vtn.social_network.service;

import com.vtn.social_network.dto.interaction.request.StoryCreateRequest;
import com.vtn.social_network.dto.interaction.request.StoryReplyRequest;
import com.vtn.social_network.dto.interaction.response.StoryGroupResponse;
import com.vtn.social_network.dto.interaction.response.StoryResponse;
import com.vtn.social_network.dto.interaction.response.StoryViewResponse;
import com.vtn.social_network.entity.*;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.MediaType;
import com.vtn.social_network.enums.NotificationType;
import com.vtn.social_network.enums.ReactionType;
import com.vtn.social_network.enums.RoomType;
import com.vtn.social_network.enums.TargetType;
import com.vtn.social_network.enums.Visibility;
import com.vtn.social_network.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.vtn.social_network.dto.chat.request.SendMessageRequest;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoryService {

        private final StoryRepository storyRepository;
        private final StoryViewRepository storyViewRepository;
        private final UserRepository userRepository;
        private final ChatRoomRepository chatRoomRepository;
        private final ChatMessageRepository chatMessageRepository;
        private final MemberRepository memberRepository;
        private final NotificationService notificationService;
        private final FollowRepository followRepository;
        private final FriendshipService friendshipService;
        private final CloudinaryService cloudinaryService;
        private final ChatService chatService;
        private final SimpMessagingTemplate messagingTemplate;

        @Transactional
        public Story createStory(String username, StoryCreateRequest request) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Story story = Story.builder()
                                .user(user)
                                .mediaUrl(request.getMediaUrl())
                                .mediaType(request.getMediaType())
                                .caption(request.getCaption())
                                .bgColor(request.getBgColor())
                                .visibility(request.getVisibility() != null ? request.getVisibility()
                                                : Visibility.FRIENDS)
                                .expiresAt(LocalDateTime.now().plusHours(
                                                request.getDurationHours() != null ? request.getDurationHours() : 24))
                                .build();

                log.info("User {} đã tạo story mới", username);
                return storyRepository.save(story);
        }

        // ==================== DELETE ====================

        @Transactional
        public void deleteStory(String username, Long storyId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Story"));

                if (!story.getUser().getId().equals(user.getId())) {
                        throw new RuntimeException("Bạn không có quyền xóa Story này");
                }

                storyViewRepository.deleteByStory(story);

                if (story.getMediaType() != MediaType.TEXT && story.getMediaUrl() != null) {
                        String publicId = cloudinaryService.extractPublicIdFromUrl(story.getMediaUrl());
                        if (publicId != null) {
                                cloudinaryService.delete(publicId);
                        }
                }

                storyRepository.delete(story);
                log.info("User {} đã xóa story {}", username, storyId);
        }

        // ==================== ARCHIVE (Story Highlights) ====================

        @Transactional
        public void archiveStory(String username, Long storyId, Visibility visibility) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Story"));

                if (!story.getUser().getId().equals(user.getId())) {
                        throw new RuntimeException("Bạn không có quyền lưu trữ Story này");
                }

                story.setArchived(true);
                story.setArchiveVisibility(visibility != null ? visibility : Visibility.PUBLIC);
                storyRepository.save(story);
                log.info("User {} đã lưu trữ story {} (visibility={})", username, storyId, visibility);
        }

        @Transactional
        public void unarchiveStory(String username, Long storyId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Story"));

                if (!story.getUser().getId().equals(user.getId())) {
                        throw new RuntimeException("Bạn không có quyền bỏ lưu trữ Story này");
                }

                story.setArchived(false);
                story.setArchiveVisibility(null);
                storyRepository.save(story);
                log.info("User {} đã bỏ lưu trữ story {}", username, storyId);
        }

        /**
         * Xem kho lưu trữ story (highlights) của một user.
         * - Chủ sở hữu: xem tất cả
         * - Bạn bè: xem PUBLIC + FRIENDS
         * - Người lạ: chỉ xem PUBLIC
         */
        @Transactional(readOnly = true)
        public List<StoryResponse> getArchivedStories(String currentUsername, String targetUsername) {
                User currentUser = userRepository.findByUsername(currentUsername)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));
                User targetUser = userRepository.findByUsername(targetUsername)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                boolean isOwner = currentUser.getId().equals(targetUser.getId());

                List<Story> stories;
                if (isOwner) {
                        // Chủ sở hữu: xem tất cả
                        stories = storyRepository.findByUserAndIsArchivedTrueOrderByCreatedAtDesc(targetUser);
                } else {
                        boolean isFriend = friendshipService.isFriend(currentUser, targetUser);
                        if (isFriend) {
                                // Bạn bè: xem PUBLIC + FRIENDS
                                List<Story> publicStories = storyRepository
                                                .findByUserAndIsArchivedTrueAndArchiveVisibilityOrderByCreatedAtDesc(
                                                                targetUser, Visibility.PUBLIC);
                                List<Story> friendStories = storyRepository
                                                .findByUserAndIsArchivedTrueAndArchiveVisibilityOrderByCreatedAtDesc(
                                                                targetUser, Visibility.FRIENDS);
                                stories = new ArrayList<>(publicStories);
                                stories.addAll(friendStories);
                        } else {
                                // Người lạ: chỉ PUBLIC
                                stories = storyRepository
                                                .findByUserAndIsArchivedTrueAndArchiveVisibilityOrderByCreatedAtDesc(
                                                                targetUser, Visibility.PUBLIC);
                        }
                }

                return stories.stream()
                                .map(s -> toStoryResponse(s, currentUser))
                                .collect(Collectors.toList());
        }

        // ==================== REACTIONS & REPLIES ====================

        @Transactional
        public void reactToStory(String username, Long storyId, ReactionType reactionType) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Story"));

                StoryView view = storyViewRepository.findFirstByStoryAndViewer(story, user)
                                .orElseGet(() -> StoryView.builder()
                                                .story(story)
                                                .viewer(user)
                                                .build());

                view.setReactionType(reactionType);
                storyViewRepository.save(view);
                log.info("User {} đã thả {} vào story của {}", username, reactionType, story.getUser().getUsername());

                notificationService.sendNotification(
                                story.getUser(), user, NotificationType.STORY_REACT,
                                story.getId(), TargetType.STORY, "/");
                                
                pushStoryUpdates(story);
        }

        @Transactional
        public void replyToStory(String username, Long storyId, StoryReplyRequest request) {
                User sender = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Story"));

                User receiver = story.getUser();

                if (sender.getId().equals(receiver.getId())) {
                        throw new RuntimeException("Bạn không thể tự phản hồi story của chính mình");
                }

                ChatRoom chatRoom = findOrCreatePrivateChatRoom(sender, receiver);

                // Dùng ChatService để gửi tin nhắn (sẽ tự lưu DB, cập nhật unread, broadcast
                // WebSocket)
                SendMessageRequest messageRequest = new SendMessageRequest();
                messageRequest.setContent("[Phản hồi Story]: " + request.getContent());
                if (story.getMediaType() != MediaType.TEXT && story.getMediaUrl() != null) {
                        messageRequest.setMediaUrl(story.getMediaUrl());
                        messageRequest.setMediaType(story.getMediaType());
                } else {
                        messageRequest.setMediaType(MediaType.TEXT);
                }

                chatService.sendMessage(sender.getUsername(), chatRoom.getId(), messageRequest);

                // Gửi thông báo cho người nhận (nếu muốn)
                notificationService.sendNotification(
                                receiver,
                                sender,
                                NotificationType.STORY_REPLY,
                                story.getId(),
                                TargetType.STORY,
                                "/");
        }

        // ==================== FEED ====================

        @Transactional(readOnly = true)
        public List<StoryGroupResponse> getActiveStoriesFromFriends(String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                List<User> following = followRepository.findByFollower(user).stream()
                                .map(Follow::getFollowing)
                                .collect(Collectors.toList());

                // Luôn thêm bản thân mình vào danh sách (kể cả khi chưa follow ai)
                List<User> userAndFollowing = new ArrayList<>(following);
                userAndFollowing.add(user);

                List<Story> activeStories = storyRepository.findByUserInAndExpiresAtAfterOrderByCreatedAtDesc(
                                userAndFollowing,
                                LocalDateTime.now());

                List<StoryResponse> storyResponses = toStoryResponseList(activeStories, user);

                Map<Long, List<StoryResponse>> grouped = storyResponses.stream()
                                .collect(Collectors.groupingBy(StoryResponse::getAuthorId));

                // Sort: người có story chưa xem lên đầu, đã xem xuống cuối
                return grouped.entrySet().stream()
                                .map(entry -> {
                                        List<StoryResponse> sortedStories = new ArrayList<>(entry.getValue());
                                        sortedStories.sort(Comparator.comparing(StoryResponse::getCreatedAt));
                                        StoryResponse first = sortedStories.get(0);

                                        return StoryGroupResponse.builder()
                                                        .userId(first.getAuthorId())
                                                        .username(first.getUsername())
                                                        .userFullName(first.getUserFullName())
                                                        .userAvatar(first.getUserAvatar())
                                                        .stories(sortedStories)
                                                        .build();
                                })
                                .sorted((g1, g2) -> {
                                        // Ưu tiên bản thân mình lên đầu tiên (nếu có story)
                                        if (g1.getUserId().equals(user.getId()))
                                                return -1;
                                        if (g2.getUserId().equals(user.getId()))
                                                return 1;

                                        boolean g1HasUnviewed = g1.getStories().stream().anyMatch(s -> !s.isViewed());
                                        boolean g2HasUnviewed = g2.getStories().stream().anyMatch(s -> !s.isViewed());
                                        if (g1HasUnviewed && !g2HasUnviewed)
                                                return -1;
                                        if (!g1HasUnviewed && g2HasUnviewed)
                                                return 1;
                                        // Cùng trạng thái xem thì ai có story mới hơn lên trước
                                        LocalDateTime max1 = g1.getStories().stream().map(StoryResponse::getCreatedAt)
                                                        .max(LocalDateTime::compareTo).orElse(LocalDateTime.MIN);
                                        LocalDateTime max2 = g2.getStories().stream().map(StoryResponse::getCreatedAt)
                                                        .max(LocalDateTime::compareTo).orElse(LocalDateTime.MIN);
                                        return max2.compareTo(max1);
                                })
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<StoryResponse> getMyActiveStories(String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                List<Story> myStories = storyRepository.findByUserAndExpiresAtAfterOrderByCreatedAtDesc(user,
                                LocalDateTime.now());

                return toStoryResponseList(myStories, user);
        }

        @Transactional
        public void viewStory(String username, Long storyId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy Story"));

                if (storyViewRepository.findFirstByStoryAndViewer(story, user).isEmpty()) {
                        storyViewRepository.save(StoryView.builder()
                                        .story(story)
                                        .viewer(user)
                                        .build());
                        log.info("User {} đã xem story của {}", username, story.getUser().getUsername());
                        
                        pushStoryUpdates(story);
                }
        }

        // ==================== MAPPERS ====================

        private List<StoryResponse> toStoryResponseList(List<Story> stories, User currentUser) {
                if (stories == null || stories.isEmpty())
                        return new ArrayList<>();

                // Batch fetch views for all these stories
                List<StoryView> allViews = storyViewRepository.findByStoryInOrderByViewedAtDesc(stories);

                // Group views by storyId
                Map<Long, List<StoryView>> viewsByStory = allViews.stream()
                                .collect(Collectors.groupingBy(v -> v.getStory().getId()));

                return stories.stream().map(story -> {
                        List<StoryView> views = viewsByStory.getOrDefault(story.getId(), new ArrayList<>());

                        // Deduplicate: mỗi viewer chỉ tính 1 lần, ưu tiên bản ghi có reaction
                        List<StoryView> uniqueViews = new ArrayList<>(views.stream()
                                        .collect(Collectors.toMap(
                                                        v -> v.getViewer().getId(),
                                                        v -> v,
                                                        (v1, v2) -> v1.getReactionType() != null ? v1 : v2))
                                        .values());

                        boolean isViewed = uniqueViews.stream()
                                        .anyMatch(v -> v.getViewer().getId().equals(currentUser.getId()));

                        List<StoryViewResponse> viewResponses = uniqueViews.stream()
                                        .map(v -> StoryViewResponse.builder()
                                                        .username(v.getViewer().getUsername())
                                                        .userFullName(v.getViewer().getFullName())
                                                        .userAvatar(v.getViewer().getAvatarUrl())
                                                        .reactionType(v.getReactionType())
                                                        .viewedAt(v.getViewedAt())
                                                        .build())
                                        .collect(Collectors.toList());

                        return StoryResponse.builder()
                                        .id(story.getId())
                                        .authorId(story.getUser().getId())
                                        .username(story.getUser().getUsername())
                                        .userFullName(story.getUser().getFullName())
                                        .userAvatar(story.getUser().getAvatarUrl())
                                        .mediaUrl(story.getMediaUrl())
                                        .mediaType(story.getMediaType())
                                        .caption(story.getCaption())
                                        .bgColor(story.getBgColor())
                                        .visibility(story.getVisibility())
                                        .createdAt(story.getCreatedAt())
                                        .expiresAt(story.getExpiresAt())
                                        .isViewed(isViewed)
                                        .viewCount(uniqueViews.size())
                                        .views(viewResponses)
                                        .isArchived(story.isArchived())
                                        .archiveVisibility(story.getArchiveVisibility())
                                        .build();
                }).collect(Collectors.toList());
        }

        private StoryResponse toStoryResponse(Story story, User currentUser) {
                List<StoryView> views = storyViewRepository.findByStoryOrderByViewedAtDesc(story);

                // Deduplicate: mỗi viewer chỉ tính 1 lần, ưu tiên bản ghi có reaction
                List<StoryView> uniqueViews = new ArrayList<>(views.stream()
                                .collect(Collectors.toMap(
                                                v -> v.getViewer().getId(),
                                                v -> v,
                                                (v1, v2) -> v1.getReactionType() != null ? v1 : v2))
                                .values());

                boolean isViewed = uniqueViews.stream()
                                .anyMatch(v -> v.getViewer().getId().equals(currentUser.getId()));

                List<StoryViewResponse> viewResponses = uniqueViews.stream()
                                .map(v -> StoryViewResponse.builder()
                                                .username(v.getViewer().getUsername())
                                                .userFullName(v.getViewer().getFullName())
                                                .userAvatar(v.getViewer().getAvatarUrl())
                                                .reactionType(v.getReactionType())
                                                .viewedAt(v.getViewedAt())
                                                .build())
                                .collect(Collectors.toList());

                return StoryResponse.builder()
                                .id(story.getId())
                                .username(story.getUser().getUsername())
                                .userFullName(story.getUser().getFullName())
                                .userAvatar(story.getUser().getAvatarUrl())
                                .mediaUrl(story.getMediaUrl())
                                .mediaType(story.getMediaType())
                                .caption(story.getCaption())
                                .bgColor(story.getBgColor())
                                .visibility(story.getVisibility())
                                .createdAt(story.getCreatedAt())
                                .expiresAt(story.getExpiresAt())
                                .isViewed(isViewed)
                                .viewCount(uniqueViews.size())
                                .views(viewResponses)
                                .isArchived(story.isArchived())
                                .archiveVisibility(story.getArchiveVisibility())
                                .build();
        }

        // ==================== PRIVATE HELPERS ====================
        
        private void pushStoryUpdates(Story story) {
                List<StoryView> views = storyViewRepository.findByStoryOrderByViewedAtDesc(story);

                List<StoryView> uniqueViews = new ArrayList<>(views.stream()
                                .collect(Collectors.toMap(
                                                v -> v.getViewer().getId(),
                                                v -> v,
                                                (v1, v2) -> v1.getReactionType() != null ? v1 : v2))
                                .values());

                List<StoryViewResponse> viewResponses = uniqueViews.stream()
                                .map(v -> StoryViewResponse.builder()
                                                .username(v.getViewer().getUsername())
                                                .userFullName(v.getViewer().getFullName())
                                                .userAvatar(v.getViewer().getAvatarUrl())
                                                .reactionType(v.getReactionType())
                                                .viewedAt(v.getViewedAt())
                                                .build())
                                .collect(Collectors.toList());

                Object payload = Map.of("storyId", story.getId(),
                                       "viewCount", uniqueViews.size(),
                                       "views", viewResponses);
                messagingTemplate.convertAndSend("/topic/stories/" + story.getId() + "/views", payload);
        }

        private ChatRoom findOrCreatePrivateChatRoom(User u1, User u2) {
                List<Member> u1Rooms = memberRepository.findByUserOrderByChatRoomLastMessageAtDesc(u1);
                for (Member m1 : u1Rooms) {
                        ChatRoom room = m1.getChatRoom();
                        if (room.getRoomType() == RoomType.PRIVATE) {
                                if (memberRepository.findByChatRoomAndUser(room, u2).isPresent()) {
                                        return room;
                                }
                        }
                }

                ChatRoom newRoom = ChatRoom.builder()
                                .roomType(RoomType.PRIVATE)
                                .roomName("Chat giữa " + u1.getUsername() + " và " + u2.getUsername())
                                .lastMessageAt(LocalDateTime.now())
                                .build();
                chatRoomRepository.save(newRoom);

                memberRepository.save(Member.builder().chatRoom(newRoom).user(u1).build());
                memberRepository.save(Member.builder().chatRoom(newRoom).user(u2).build());

                return newRoom;
        }
}
