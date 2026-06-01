package com.vtn.social_network.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    /**
     * Upload a file and return its public URL.
     *
     * @param file   the file to upload
     * @param folder the remote folder name (e.g. "avatars", "posts")
     * @return public URL of the uploaded file
     */
    String upload(MultipartFile file, String folder);

    /**
     * Delete a file from storage by its public ID.
     *
     * @param publicId the Cloudinary public_id (or equivalent)
     */
    void delete(String publicId);
}
