package com.jotdown.api.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreNoteAttachmentRequest {
    @NotBlank(message = "URL ảnh là bắt buộc.")
    private String fileUrl;

    @NotNull(message = "Dung lượng ảnh là bắt buộc.")
    @Min(value = 1, message = "Dung lượng ảnh tối thiểu là 1 byte.")
    @Max(value = 15728640, message = "Dung lượng ảnh tối đa là 15MB.")
    private Long fileSize;

    @NotBlank(message = "Định dạng ảnh là bắt buộc.")
    private String fileType;

    private String originalName;
}
