package com.jotdown.api.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class NoteResponse {
    private Long id;
    private Long userId;
    private String title;
    private String content;
    private String color;
    private Boolean isPinned;
    private LocalDateTime pinnedAt;
    private Boolean isProtected;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AttachmentResponse> attachments;
    private List<ShareResponse> shares;
    private List<LabelResponse> labels;
    private UserResponse user;
}
