package com.jotdown.api.mapper;

import com.jotdown.api.constant.AppConstants;
import com.jotdown.api.dto.response.*;
import com.jotdown.api.entity.*;
import com.jotdown.api.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NoteMapper {

    private final CloudinaryService cloudinaryService;

    public NoteResponse convertToNoteResponse(Note note, Long currentUserId, boolean mask) {
        if (note == null) return null;

        return NoteResponse.builder()
                .id(note.getId())
                .userId(note.getUser() != null ? note.getUser().getId() : null)
                .title(note.getTitle())
                .content(resolveContent(note, mask))
                .color(note.getColor())
                .isPinned(note.getIsPinned())
                .pinnedAt(note.getPinnedAt())
                .isProtected(note.getIsProtected())
                .version(note.getVersion())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .attachments(mapAttachments(note, mask))
                .shares(mapShares(note))
                .labels(mapLabels(note, currentUserId))
                .user(mapUser(note.getUser()))
                .build();
    }

    private String resolveContent(Note note, boolean mask) {
        if (mask && Boolean.TRUE.equals(note.getIsProtected())) {
            return AppConstants.PROTECTED_NOTE_MASKED_CONTENT;
        }
        return note.getContent();
    }

    private UserResponse mapUser(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .build();
    }

    private List<AttachmentResponse> mapAttachments(Note note, boolean mask) {
        List<AttachmentResponse> responses = new ArrayList<>();
        if (note.getAttachments() == null) return responses;

        for (NoteAttachment att : note.getAttachments()) {
            String fileUrl = att.getFileUrl();
            if (mask && Boolean.TRUE.equals(note.getIsProtected())) {
                fileUrl = cloudinaryService.getBlurredUrl(fileUrl);
            }
            responses.add(AttachmentResponse.builder()
                    .id(att.getId())
                    .noteId(note.getId())
                    .fileUrl(fileUrl)
                    .attachmentKind(att.getAttachmentKind())
                    .originalName(att.getOriginalName())
                    .fileType(att.getFileType())
                    .fileSize(att.getFileSize())
                    .createdAt(att.getCreatedAt())
                    .build());
        }
        return responses;
    }

    private List<ShareResponse> mapShares(Note note) {
        List<ShareResponse> responses = new ArrayList<>();
        if (note.getShares() == null) return responses;

        for (NoteShare share : note.getShares()) {
            responses.add(ShareResponse.builder()
                    .id(share.getId())
                    .noteId(note.getId())
                    .senderId(share.getSender().getId())
                    .receiverId(share.getReceiver() != null ? share.getReceiver().getId() : null)
                    .permission(share.getPermission())
                    .receiver(mapUser(share.getReceiver()))
                    .createdAt(share.getCreatedAt())
                    .build());
        }
        return responses;
    }

    private List<LabelResponse> mapLabels(Note note, Long currentUserId) {
        List<LabelResponse> responses = new ArrayList<>();
        if (note.getNoteLabels() == null || currentUserId == null) return responses;

        for (NoteLabel nl : note.getNoteLabels()) {
            if (nl.getUser() != null && nl.getUser().getId().equals(currentUserId)) {
                Label label = nl.getLabel();
                if (label != null) {
                    responses.add(LabelResponse.builder()
                            .id(label.getId())
                            .name(label.getName())
                            .build());
                }
            }
        }
        return responses;
    }
}
