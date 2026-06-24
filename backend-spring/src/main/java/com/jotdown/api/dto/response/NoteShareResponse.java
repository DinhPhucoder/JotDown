package com.jotdown.api.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class NoteShareResponse {
    private Long id;
    private Long noteId;
    private Long senderId;
    private UserResponse sender;
    private UserResponse receiver;
    private NoteResponse note;
    private String permission;
    private LocalDateTime createdAt;
}
