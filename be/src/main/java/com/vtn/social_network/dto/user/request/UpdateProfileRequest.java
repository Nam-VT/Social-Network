package com.vtn.social_network.dto.user.request;

import com.vtn.social_network.enums.Gender;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(max = 100, message = "Họ tên không được quá 100 ký tự")
    private String fullName;

    @Size(max = 500, message = "Bio không được quá 500 ký tự")
    private String bio;

    @Size(max = 100, message = "Vị trí không được quá 100 ký tự")
    private String location;

    @Size(max = 200, message = "Website không được quá 200 ký tự")
    private String website;

    private LocalDate birthDate;

    private Gender gender;
}
