package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final StorageService storageService;

    /**
     * Upload một file đơn (ảnh hoặc video).
     * Trả về URL Cloudinary để dùng trong Post hoặc Chat.
     */
    @PostMapping(value = "/single", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadSingle(
            Authentication authentication,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "media") String folder) {
        String url = storageService.upload(file, folder);
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Upload thành công")
                .data(url)
                .build());
    }

    /**
     * Upload nhiều file cùng lúc.
     * Trả về danh sách URL Cloudinary.
     */
    @PostMapping(value = "/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<String>>> uploadMultiple(
            Authentication authentication,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "folder", defaultValue = "media") String folder) {
        List<String> urls = files.stream()
                .map(file -> storageService.upload(file, folder))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.<List<String>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Upload " + urls.size() + " file thành công")
                .data(urls)
                .build());
    }
}
