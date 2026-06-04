package com.vtn.social_network.config;

import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.UserRole;
import com.vtn.social_network.enums.UserStatus;
import com.vtn.social_network.repository.UserRepository;
import com.vtn.social_network.service.SearchIndexingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SearchIndexingService searchIndexingService;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Kiểm tra xem đã có tài khoản admin chưa
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@vutiennam.id.vn")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("System Admin")
                    .role(UserRole.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true) // Đã xác thực để đăng nhập được ngay
                    .allowPublicFollowers(true)
                    .build();
            userRepository.save(admin);
            log.info("Đã tạo tài khoản admin mặc định: admin / admin123");
        } else {
            log.info("Tài khoản admin đã tồn tại.");
        }

        // Tự động đồng bộ tất cả Post từ MySQL sang Elasticsearch khi khởi động
        log.info("Đang đồng bộ dữ liệu Post sang Elasticsearch...");
        try {
            searchIndexingService.syncAllPostsToES();
            log.info("Đồng bộ dữ liệu Elasticsearch thành công!");
        } catch (Exception e) {
            log.error("Lỗi khi đồng bộ dữ liệu Elasticsearch: ", e);
        }
    }
}
