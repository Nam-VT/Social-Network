package com.vtn.social_network.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService implements StorageService {

    private final Cloudinary cloudinary;

    @Override
    public String upload(MultipartFile file, String folder) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "social-network/" + folder,
                            "resource_type", "auto" // supports image AND video
                    ));
            String url = (String) result.get("secure_url");
            log.info("Uploaded file to Cloudinary: {}", url);
            return url;
        } catch (IOException e) {
            log.error("Failed to upload file to Cloudinary", e);
            throw new RuntimeException("Không thể upload file. Vui lòng thử lại.");
        }
    }

    @Override
    public void delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted file from Cloudinary: {}", publicId);
        } catch (IOException e) {
            log.warn("Failed to delete file from Cloudinary: {}", publicId, e);
        }
    }

    public String extractPublicIdFromUrl(String url) {
        if (url == null || url.isEmpty() || !url.contains("/upload/")) {
            return null;
        }
        try {
            // VD: https://res.cloudinary.com/dnx/image/upload/v123/social-network/stories/abc.jpg
            String[] parts = url.split("/upload/");
            if (parts.length < 2) return null;
            
            String path = parts[1];
            // Xóa phần version (v1234567/) nếu có
            if (path.matches("^v\\d+/.*")) {
                path = path.replaceFirst("^v\\d+/", "");
            }
            
            // Xóa đuôi file (.jpg, .mp4, ...)
            int lastDotIndex = path.lastIndexOf('.');
            if (lastDotIndex != -1) {
                path = path.substring(0, lastDotIndex);
            }
            
            return path;
        } catch (Exception e) {
            log.warn("Lỗi khi extract publicId từ URL: {}", url, e);
            return null;
        }
    }
}
