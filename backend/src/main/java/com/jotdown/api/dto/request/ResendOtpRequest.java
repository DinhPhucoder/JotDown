package com.jotdown.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ResendOtpRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Mục đích không được để trống")
    @Pattern(regexp = "^(verify|reset)$", message = "Mục đích không hợp lệ")
    private String purpose;
}
