package com.jotdown.api.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ShareResponse {
    private Long id;
    private Long noteId;
    private Long senderId;
    private Long receiverId;
    private String permission;
    private UserResponse receiver;
    private LocalDateTime createdAt;
}
