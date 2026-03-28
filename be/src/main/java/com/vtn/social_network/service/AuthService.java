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

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

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
                .build();

        userRepository.save(user);
        log.info("Đã tạo tài khoản mới: {}", user.getUsername());

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException(ErrorCode.BAD_CREDENTIALS.getMessage());
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtUtils.isValidToken(refreshToken)) {
            throw new RuntimeException(ErrorCode.INVALID_TOKEN.getMessage());
        }

        String username = jwtUtils.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

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

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setRefreshToken(refreshToken);
        response.setType("Bearer");
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        return response;
    }
}
