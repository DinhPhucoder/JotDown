package com.jotdown.api.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class VerifyNotePasswordRequest {

    @NotEmpty(message = "Mật khẩu không được để trống")
    private String password;
}
