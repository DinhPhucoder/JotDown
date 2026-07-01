package com.jotdown.api.controller;

import com.jotdown.api.constant.AppConstants;
import com.jotdown.api.dto.request.StoreNoteAttachmentRequest;
import com.jotdown.api.dto.response.AttachmentResponse;
import com.jotdown.api.dto.response.NoteResponse;
import com.jotdown.api.entity.Note;
import com.jotdown.api.entity.NoteAttachment;
import com.jotdown.api.entity.User;
import com.jotdown.api.exception.ForbiddenException;
import com.jotdown.api.exception.ResourceNotFoundException;
import com.jotdown.api.exception.ValidationException;
import com.jotdown.api.repository.NoteAttachmentRepository;
import com.jotdown.api.repository.NoteRepository;
import com.jotdown.api.repository.NoteShareRepository;
import com.jotdown.api.security.CurrentUser;
import com.jotdown.api.service.CloudinaryService;
import com.jotdown.api.service.NoteService;
import com.jotdown.api.service.PusherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notes/{noteId}/attachments")
@RequiredArgsConstructor
public class NoteAttachmentController {

    private final NoteRepository noteRepository;
    private final NoteAttachmentRepository noteAttachmentRepository;
    private final NoteShareRepository noteShareRepository;
    private final CloudinaryService cloudinaryService;
    private final PusherService pusherService;
    private final NoteService noteService;

    private void authorizeAttachmentAccess(Note note, User user) {
        if (note.getUser().getId().equals(user.getId())) {
            return;
        }
        boolean hasEditPermission = noteShareRepository.existsByNoteIdAndReceiverIdAndPermissionAndDeletedAtIsNull(
                note.getId(),
                user.getId(),
                AppConstants.PERMISSION_EDIT
        );
        if (!hasEditPermission) {
            throw new ForbiddenException("Bạn không có quyền chỉnh sửa ghi chú này.");
        }
    }

    @PostMapping("/signature")
    public ResponseEntity<Map<String, Object>> signature(
            @CurrentUser User currentUser,
            @PathVariable("noteId") Long noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.ERROR_NOTE_NOT_FOUND));

        authorizeAttachmentAccess(note, currentUser);

        Map<String, Object> payload = cloudinaryService.buildSignaturePayload();
        Map<String, Object> response = new HashMap<>();
        response.put("data", payload);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> store(
            @CurrentUser User currentUser,
            @PathVariable("noteId") Long noteId,
            @Valid @RequestBody StoreNoteAttachmentRequest request) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.ERROR_NOTE_NOT_FOUND));

        authorizeAttachmentAccess(note, currentUser);

        cloudinaryService.assertValidCloudinaryUrl(request.getFileUrl());
        cloudinaryService.assertAttachmentLimit(note, request.getFileSize());

        NoteAttachment attachment = new NoteAttachment();
        attachment.setNote(note);
        attachment.setFileUrl(request.getFileUrl());
        attachment.setAttachmentKind(AppConstants.ATTACHMENT_KIND_IMAGE);
        attachment.setOriginalName(request.getOriginalName());
        attachment.setFileType(cloudinaryService.normalizeFileType(request.getFileType()));
        attachment.setFileSize(request.getFileSize());

        NoteAttachment saved = noteAttachmentRepository.save(attachment);

        // Add attachment to list for response conversion and broadcast
        note.getAttachments().add(saved);

        // Broadcast realtime
        NoteResponse noteResponse = noteService.convertToNoteResponse(note, currentUser.getId(), true);
        pusherService.broadcastNoteUpdated(noteResponse, currentUser.getId().toString());

        AttachmentResponse data = AttachmentResponse.builder()
                .id(saved.getId())
                .noteId(note.getId())
                .fileUrl(saved.getFileUrl())
                .attachmentKind(saved.getAttachmentKind())
                .originalName(saved.getOriginalName())
                .fileType(saved.getFileType())
                .fileSize(saved.getFileSize())
                .createdAt(saved.getCreatedAt())
                .build();

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Saved attachment successfully.");
        response.put("data", data);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{attachmentId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> destroy(
            @CurrentUser User currentUser,
            @PathVariable("noteId") Long noteId,
            @PathVariable("attachmentId") Long attachmentId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.ERROR_NOTE_NOT_FOUND));

        authorizeAttachmentAccess(note, currentUser);

        NoteAttachment attachment = noteAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tệp đính kèm không tồn tại."));

        if (!attachment.getNote().getId().equals(noteId)) {
            throw new ValidationException("attachment", "Tệp đính kèm không thuộc ghi chú này.");
        }

        noteAttachmentRepository.delete(attachment);

        // Remove from note attachments collection for broadcast
        note.getAttachments().removeIf(att -> att.getId().equals(attachmentId));

        // Broadcast realtime
        NoteResponse noteResponse = noteService.convertToNoteResponse(note, currentUser.getId(), true);
        pusherService.broadcastNoteUpdated(noteResponse, currentUser.getId().toString());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Attachment deleted successfully.");

        return ResponseEntity.ok(response);
    }
}
