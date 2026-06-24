package com.jotdown.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareNoteRequest {
    @NotBlank(message = "Email là bắt buộc.")
    @Email(message = "Email không đúng định dạng.")
    private String email;

    @NotBlank(message = "Quyền là bắt buộc.")
    private String permission;
}
