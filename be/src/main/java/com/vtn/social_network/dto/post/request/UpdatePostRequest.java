package com.vtn.social_network.dto.post.request;

import com.vtn.social_network.enums.Visibility;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePostRequest {

    @Size(max = 5000, message = "Nội dung bài viết không được quá 5000 ký tự")
    private String content;

    private Visibility visibility;
}
