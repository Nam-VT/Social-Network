package com.vtn.social_network.config;

import com.vtn.social_network.entity.*;
import com.vtn.social_network.enums.*;
import com.vtn.social_network.repository.*;
import com.vtn.social_network.service.SearchIndexingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SearchIndexingService searchIndexingService;
    private final FriendshipRepository friendshipRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final SocialGroupRepository socialGroupRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // 1. Khởi tạo tài khoản admin nếu chưa có
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@vutiennam.id.vn")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("System Admin")
                    .role(UserRole.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .allowPublicFollowers(true)
                    .build();
            userRepository.save(admin);
            log.info("Đã tạo tài khoản admin mặc định: admin / admin123");
        } else {
            log.info("Tài khoản admin đã tồn tại.");
        }

        // 2. Tự động thêm dữ liệu mẫu tăng dần (không xóa database cũ)
        log.info("Kiểm tra và bổ sung dữ liệu mẫu (Incremental Seeding)...");
        seedDummyDataIncremental();

        // 3. Tự động đồng bộ tất cả Post từ MySQL sang Elasticsearch khi khởi động
        log.info("Đang đồng bộ dữ liệu Post sang Elasticsearch...");
        try {
            searchIndexingService.syncAllPostsToES();
            log.info("Đồng bộ dữ liệu Elasticsearch thành công!");
        } catch (Exception e) {
            log.error("Lỗi khi đồng bộ dữ liệu Elasticsearch: ", e);
        }
    }

    private void seedDummyDataIncremental() {
        // Danh sách thông tin người dùng mẫu
        String[] usernames = {"tiendat", "hoangnam", "thuha", "phuonganh", "quanghuy", "myduyen", "trungtin", "vanhung", "thuyduong"};
        String[] fullNames = {"Nguyễn Tiến Đạt", "Trần Hoàng Nam", "Phạm Thu Hà", "Lê Phương Anh", "Đỗ Quang Huy", "Hoàng Mỹ Duyên", "Bùi Trung Tín", "Phan Văn Hưng", "Vũ Thuỳ Dương"};
        String[] emails = {"dat@gmail.com", "nam@gmail.com", "ha@gmail.com", "anh@gmail.com", "huy@gmail.com", "duyen@gmail.com", "tin@gmail.com", "hung@gmail.com", "duong@gmail.com"};
        String[] bios = {
            "Đam mê lập trình Java & Spring Boot.",
            "UI/UX Designer | Thích chụp ảnh và du lịch.",
            "Content Creator | Chia sẻ trải nghiệm cuộc sống.",
            "Frontend Developer | ReactJS & Tailwind CSS.",
            "Data Engineer | Thích tìm tòi công nghệ mới.",
            "Sinh viên năm 3 | Thích đọc sách và nghe nhạc.",
            "Mobile Developer | Flutter & Android.",
            "DevOps Engineer | Docker, Kubernetes & AWS.",
            "QA Engineer | Yêu thích sự cẩn thận và hoàn mỹ."
        };
        String[] avatars = {
            "https://api.dicebear.com/7.x/adventurer/svg?seed=tiendat",
            "https://api.dicebear.com/7.x/adventurer/svg?seed=hoangnam",
            "https://api.dicebear.com/7.x/adventurer/svg?seed=thuha",
            "https://api.dicebear.com/7.x/adventurer/svg?seed=phuonganh",
            "https://api.dicebear.com/7.x/adventurer/svg?seed=quanghuy",
            "https://api.dicebear.com/7.x/adventurer/svg?seed=myduyen",
            "https://api.dicebear.com/7.x/adventurer/svg?seed=trungtin",
            "https://api.dicebear.com/7.x/adventurer/svg?seed=vanhung",
            "https://api.dicebear.com/7.x/adventurer/svg?seed=thuyduong"
        };

        // 1. Tạo user nếu chưa tồn tại
        List<User> dummyUsers = new ArrayList<>();
        int usersCreated = 0;
        for (int i = 0; i < usernames.length; i++) {
            Optional<User> userOpt = userRepository.findByUsername(usernames[i]);
            if (userOpt.isEmpty()) {
                User dummy = User.builder()
                        .username(usernames[i])
                        .fullName(fullNames[i])
                        .email(emails[i])
                        .bio(bios[i])
                        .password(passwordEncoder.encode("password123"))
                        .avatarUrl(avatars[i])
                        .role(UserRole.USER)
                        .status(UserStatus.ACTIVE)
                        .emailVerified(true)
                        .allowPublicFollowers(true)
                        .build();
                dummyUsers.add(userRepository.save(dummy));
                usersCreated++;
            } else {
                dummyUsers.add(userOpt.get());
            }
        }
        if (usersCreated > 0) {
            log.info("Đã tạo thêm {} tài khoản người dùng mẫu.", usersCreated);
        }

        // 2. Kết bạn chéo nếu chưa kết bạn
        int friendshipsCreated = 0;
        for (int i = 0; i < dummyUsers.size(); i++) {
            for (int j = i + 1; j < Math.min(i + 4, dummyUsers.size()); j++) {
                User u1 = dummyUsers.get(i);
                User u2 = dummyUsers.get(j);
                if (friendshipRepository.findFriendshipBetween(u1, u2).isEmpty()) {
                    Friendship friendship = Friendship.builder()
                            .requester(u1)
                            .addressee(u2)
                            .status(FriendshipStatus.ACCEPTED)
                            .build();
                    friendshipRepository.save(friendship);
                    friendshipsCreated++;
                }
            }
        }
        if (friendshipsCreated > 0) {
            log.info("Đã bổ sung {} liên kết bạn bè chéo.", friendshipsCreated);
        }

        // 3. Tạo nhóm mẫu nếu chưa tồn tại
        SocialGroup group1 = socialGroupRepository.findAll().stream()
                .filter(g -> g.getName().equals("Cộng đồng Java & Spring Boot Việt Nam"))
                .findFirst()
                .orElse(null);

        if (group1 == null) {
            group1 = SocialGroup.builder()
                    .name("Cộng đồng Java & Spring Boot Việt Nam")
                    .description("Nơi giao lưu, chia sẻ kinh nghiệm lập trình Java, Spring Boot, Microservices và thiết kế hệ thống.")
                    .avatarUrl("https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop")
                    .coverUrl("https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop")
                    .creator(dummyUsers.get(0)) // tiendat
                    .privacy(GroupPrivacy.PUBLIC)
                    .requirePostApproval(false)
                    .memberCount(dummyUsers.size())
                    .build();
            group1 = socialGroupRepository.save(group1);
            log.info("Đã tạo thêm nhóm: Cộng đồng Java & Spring Boot Việt Nam");

            // Đăng ký thành viên cho nhóm mới tạo
            for (User user : dummyUsers) {
                GroupMember member = GroupMember.builder()
                        .group(group1)
                        .user(user)
                        .role(user.getUsername().equals("tiendat") ? MemberRole.ADMIN : MemberRole.MEMBER)
                        .approved(true)
                        .build();
                groupMemberRepository.save(member);
            }
        }

        // 4. Tạo bài viết, lượt thích, bình luận mẫu nếu các user mẫu chưa có bài viết nào
        boolean hasDummyPosts = postRepository.findAll().stream()
                .anyMatch(p -> p.getUser().getUsername().equals("tiendat"));

        if (!hasDummyPosts) {
            String[] postContents = {
                "Hôm nay vừa hoàn thành tính năng Real-time chat bằng Spring Boot WebSockets STOMP. Chạy siêu mượt mà! #programming #springboot",
                "Mọi người thường dùng thư viện nào để quản lý state trong ReactJS? Mình đang cân nhắc giữa Redux Toolkit và Zustand. #reactjs #frontend",
                "Mới chụp được bức ảnh bình minh siêu đẹp sáng nay tại Hà Nội. Chúc cả nhà một tuần mới làm việc tràn đầy năng lượng! 🌅 #goodmorning #hanoi",
                "Có ai gặp lỗi kết nối Redis connection refused khi chạy ứng dụng Spring Boot trong Docker chưa? Cho mình xin giải pháp với. #docker #redis #help",
                "Bài viết hướng dẫn tối ưu truy vấn SQL bằng cách đánh Index đúng cách cực kỳ chi tiết cho các bạn mới học database. #database #sql",
                "Đang thiết kế cấu trúc Elasticsearch cho hệ thống tìm kiếm người dùng và bài viết. Công nhận ES hỗ trợ tìm kiếm mờ (fuzzy search) đỉnh thật! #elasticsearch #search",
                "Vừa gia nhập nhóm lập trình Java. Rất vui được làm quen với tất cả mọi người trong cộng đồng! Hy vọng cùng chia sẻ nhiều kiến thức bổ ích. #java #welcome",
                "Một tách cà phê buổi sáng + debug code là combo hoàn hảo để bắt đầu ngày mới. Bạn thì sao? ☕💻 #developer #coffee"
            };

            List<Post> posts = new ArrayList<>();
            Random random = new Random();
            for (int i = 0; i < postContents.length; i++) {
                User author = dummyUsers.get(i % dummyUsers.size());
                Post post = Post.builder()
                        .user(author)
                        .content(postContents[i])
                        .visibility(Visibility.PUBLIC)
                        .build();
                
                if (i == 4 || i == 6) {
                    post.setGroup(group1);
                    post.setGroupPostStatus(GroupPostStatus.APPROVED);
                }
                
                posts.add(postRepository.save(post));
            }
            log.info("Đã tạo thêm {} bài viết mẫu.", posts.size());

            // Thêm lượt thích & bình luận cho các bài viết mới tạo
            String[] comments = {
                "Tuyệt vời quá anh ơi! Cho em xin link source tham khảo với ạ.",
                "Zustand cực nhẹ và dễ dùng nha bạn, rất khuyên dùng cho các dự án vừa và nhỏ.",
                "Góc chụp đẹp xuất sắc luôn bạn ơi! 🌅",
                "Bạn thử kiểm tra cấu hình mạng trong docker-compose xem, nhớ dùng network chung hoặc trỏ đúng host IP nha.",
                "Bài viết cực kỳ hữu ích, mình đã clear được rất nhiều vấn đề về Index.",
                "Chào mừng bạn đến với nhóm! Java/Spring Boot muôn năm!",
                "Nhìn ly cà phê ngon quá, chúc bạn debug ít bug nhé haha.",
                "Ủng hộ bài viết chất lượng! Mong đợi phần tiếp theo của tác giả."
            };

            ReactionType[] reactionTypes = ReactionType.values();

            for (int i = 0; i < posts.size(); i++) {
                Post post = posts.get(i);
                
                // Reactions
                int reactionCount = 3 + random.nextInt(3);
                for (int r = 0; r < reactionCount; r++) {
                    User reactor = dummyUsers.get((i + r + 1) % dummyUsers.size());
                    Reaction reaction = Reaction.builder()
                            .user(reactor)
                            .targetId(post.getId())
                            .targetType(TargetType.POST)
                            .reactionType(reactionTypes[random.nextInt(reactionTypes.length)])
                            .build();
                    reactionRepository.save(reaction);
                }

                // Comments
                User commenter1 = dummyUsers.get((i + 2) % dummyUsers.size());
                Comment comment1 = Comment.builder()
                        .post(post)
                        .user(commenter1)
                        .content(comments[i % comments.length])
                        .build();
                commentRepository.save(comment1);

                User commenter2 = dummyUsers.get((i + 5) % dummyUsers.size());
                Comment comment2 = Comment.builder()
                        .post(post)
                        .user(commenter2)
                        .content("Bài viết rất hay, cảm ơn bạn đã chia sẻ!")
                        .build();
                commentRepository.save(comment2);
            }
            log.info("Đã tạo các tương tác mẫu (reactions & comments) cho bài viết mới.");
        }
    }
}
