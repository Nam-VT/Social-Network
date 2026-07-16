package com.vtn.social_network.service;

import com.vtn.social_network.dto.auth.request.*;
import com.vtn.social_network.dto.auth.response.AuthResponse;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.repository.UserRepository;
import com.vtn.social_network.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException(ErrorCode.USERNAME_ALREADY_EXISTS.getMessage());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException(ErrorCode.EMAIL_ALREADY_EXISTS.getMessage());
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .emailVerified(false)
                .verificationToken(UUID.randomUUID().toString())
                .build();

        userRepository.save(user);
        log.info("Đã tạo tài khoản mới: {}", user.getUsername());

        // Gửi email xác thực
        emailService.sendVerificationEmail(user.getEmail(), user.getVerificationToken());

        // Không trả về token đăng nhập ngay vì chưa xác thực email
        AuthResponse.UserDto userDto = AuthResponse.UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole() != null ? user.getRole().name() : com.vtn.social_network.enums.UserRole.USER.name())
                .build();

        AuthResponse response = new AuthResponse();
        response.setUser(userDto);
        response.setToken(null);
        response.setRefreshToken(null);
        return response;
    }

    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Mã xác thực không hợp lệ hoặc đã hết hạn"));

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
        log.info("User {} đã xác thực email thành công", user.getUsername());
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        if (user.isEmailVerified()) {
            throw new RuntimeException("Tài khoản này đã được xác thực");
        }

        user.setVerificationToken(UUID.randomUUID().toString());
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getVerificationToken());
        log.info("Đã gửi lại email xác thực cho: {}", email);
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsername();
        User user = userRepository.findByUsernameOrEmail(identifier, identifier)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        // Removed Email Verification check to allow unverified login

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException(ErrorCode.BAD_CREDENTIALS.getMessage());
        }

        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtUtils.isValidToken(refreshToken)) {
            throw new RuntimeException(ErrorCode.INVALID_TOKEN.getMessage());
        }

        String username = jwtUtils.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        // Removed Email Verification check to allow unverified login

        return buildAuthResponse(user);
    }

    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException(ErrorCode.WRONG_PASSWORD.getMessage());
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Đã đổi mật khẩu cho user: {}", username);
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        String resetToken = jwtUtils.generateResetToken(user.getUsername());
        emailService.sendResetPasswordEmail(user.getEmail(), resetToken);
        log.info("Đã gửi reset password cho: {}", user.getEmail());
    }

    public void resetPassword(ResetPasswordRequest request) {
        if (!jwtUtils.isValidToken(request.getToken())) {
            throw new RuntimeException(ErrorCode.INVALID_TOKEN.getMessage());
        }

        String username = jwtUtils.extractUsername(request.getToken());
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Đã reset mật khẩu cho user: {}", username);
    }

    /**
     * Xử lý đăng nhập/đăng ký qua Google OAuth2.
     */
    @Transactional
    public AuthResponse processOAuth2Login(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .username(email.split("@")[0])
                            .password(passwordEncoder.encode("OAUTH2_" + System.currentTimeMillis()))
                            .email(email)
                            .fullName(name)
                            .avatarUrl(picture)
                            .emailVerified(true) // Google mặc định đã verify
                            .build();

                    if (userRepository.existsByUsername(newUser.getUsername())) {
                        newUser.setUsername(newUser.getUsername() + "_" + System.currentTimeMillis());
                    }

                    userRepository.save(newUser);
                    log.info("Đã tạo tài khoản Google mới: {}", newUser.getEmail());
                    return newUser;
                });

        return buildAuthResponse(user);
    }

    // ========== Helper ==========

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtUtils.generateToken(user.getUsername());
        String refreshToken = jwtUtils.generateRefreshToken(user.getUsername());

        AuthResponse.UserDto userDto = AuthResponse.UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole() != null ? user.getRole().name() : com.vtn.social_network.enums.UserRole.USER.name())
                .build();

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setRefreshToken(refreshToken);
        response.setType("Bearer");
        response.setUser(userDto);
        return response;
    }
}
