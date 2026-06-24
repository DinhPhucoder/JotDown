package com.jotdown.api.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class StoreNoteRequest {

    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    private String title;

    @Size(max = 10000, message = "Nội dung không được vượt quá 10000 ký tự")
    private String content;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Màu sắc phải là mã hex hợp lệ (VD: #000000)")
    private String color = "#ffffff";

    private Boolean isProtected = false;

    @Size(min = 4, max = 255, message = "Mật khẩu bảo vệ phải từ 4 đến 255 ký tự")
    private String password;

    private List<AttachmentPayload> attachments;

    @Data
    public static class AttachmentPayload {
        private String fileUrl;
        private Long fileSize;
        private String fileType;
        private String originalName;
    }
}
