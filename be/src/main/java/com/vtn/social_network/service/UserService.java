package com.vtn.social_network.service;

import com.vtn.social_network.dto.user.request.UpdateProfileRequest;
import com.vtn.social_network.dto.user.response.UserProfileResponse;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        return toProfileResponse(user);
    }

    public UserProfileResponse updateProfile(String currentUsername, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        // Manual mapping: chỉ cập nhật field nào client gửi lên (không null)
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
        }
        if (request.getWebsite() != null) {
            user.setWebsite(request.getWebsite());
        }
        if (request.getBirthDate() != null) {
            user.setBirthDate(request.getBirthDate());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }

        userRepository.save(user);
        log.info("Đã cập nhật profile cho user: {}", currentUsername);

        return toProfileResponse(user);
    }

    // ========== Helper ==========

    private UserProfileResponse toProfileResponse(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setCoverUrl(user.getCoverUrl());
        response.setBio(user.getBio());
        response.setLocation(user.getLocation());
        response.setWebsite(user.getWebsite());
        response.setBirthDate(user.getBirthDate());
        response.setGender(user.getGender());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
}
