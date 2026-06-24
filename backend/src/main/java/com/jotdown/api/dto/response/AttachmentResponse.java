package com.jotdown.api.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AttachmentResponse {
    private Long id;
    private Long noteId;
    private String fileUrl;
    private String attachmentKind;
    private String originalName;
    private String fileType;
    private Long fileSize;
    private LocalDateTime createdAt;
}
