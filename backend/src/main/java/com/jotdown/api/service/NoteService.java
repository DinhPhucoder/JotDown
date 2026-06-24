package com.jotdown.api.service;

import com.jotdown.api.constant.AppConstants;
import com.jotdown.api.dto.request.*;
import com.jotdown.api.dto.response.*;
import com.jotdown.api.entity.*;
import com.jotdown.api.exception.ConflictException;
import com.jotdown.api.exception.ForbiddenException;
import com.jotdown.api.exception.ResourceNotFoundException;
import com.jotdown.api.exception.ValidationException;
import com.jotdown.api.mapper.NoteMapper;
import com.jotdown.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoteService {

    private final NoteRepository noteRepository;
    private final NoteAttachmentRepository noteAttachmentRepository;
    private final NoteShareRepository noteShareRepository;
    private final NoteLabelRepository noteLabelRepository;
    private final LabelRepository labelRepository;
    private final CloudinaryService cloudinaryService;
    private final PusherService pusherService;
    private final PasswordEncoder passwordEncoder;
    private final NoteMapper noteMapper;

    @Transactional(readOnly = true)
    public List<NoteResponse> listNotes(User currentUser) {
        List<Note> notes = noteRepository.findByUserIdOrderByIsPinnedDescUpdatedAtDesc(currentUser.getId());
        return notes.stream()
                .map(note -> convertToNoteResponse(note, currentUser.getId(), true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NoteResponse getNote(Long noteId, User currentUser) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.ERROR_NOTE_NOT_FOUND));

        authorizeView(note, currentUser);

        return convertToNoteResponse(note, currentUser.getId(), true);
    }

    @Transactional
    public NoteResponse createNote(StoreNoteRequest request, User currentUser) {
        // Validation: note must have at least title, content or attachment
        boolean hasAttachments = request.getAttachments() != null && !request.getAttachments().isEmpty();
        String title = request.getTitle() != null ? request.getTitle().trim() : "";
        String content = request.getContent() != null ? request.getContent().trim() : "";

        if (title.isEmpty() && content.isEmpty() && !hasAttachments) {
            throw new ValidationException("note", AppConstants.ERROR_NOTE_EMPTY);
        }

        boolean isProtected = Boolean.TRUE.equals(request.getIsProtected());

        Note note = new Note();
        note.setUser(currentUser);
        note.setTitle(request.getTitle() != null ? request.getTitle() : "");
        note.setContent(request.getContent());
        note.setColor(request.getColor() != null ? request.getColor() : AppConstants.DEFAULT_NOTE_COLOR);
        note.setIsProtected(isProtected);
        note.setIsPinned(false);
        note.setVersion(1);

        if (isProtected && request.getPassword() != null && !request.getPassword().isEmpty()) {
            note.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        Note savedNote = noteRepository.save(note);

        if (hasAttachments) {
            for (StoreNoteRequest.AttachmentPayload payload : request.getAttachments()) {
                String fileUrl = payload.getFileUrl();
                Long fileSize = payload.getFileSize();
                String fileType = payload.getFileType();

                cloudinaryService.assertValidCloudinaryUrl(fileUrl);
                cloudinaryService.assertAttachmentLimit(savedNote, fileSize != null ? fileSize : 0L);

                NoteAttachment attachment = new NoteAttachment();
                attachment.setNote(savedNote);
                attachment.setFileUrl(fileUrl);
                attachment.setAttachmentKind(AppConstants.ATTACHMENT_KIND_IMAGE);
                attachment.setOriginalName(payload.getOriginalName());
                attachment.setFileType(cloudinaryService.normalizeFileType(fileType));
                attachment.setFileSize(fileSize != null ? fileSize : 0L);

                NoteAttachment savedAttachment = noteAttachmentRepository.save(attachment);
                savedNote.getAttachments().add(savedAttachment);
            }
        }

        return convertToNoteResponse(savedNote, currentUser.getId(), true);
    }

    @Transactional
    public NoteResponse updateNote(Long noteId, UpdateNoteRequest request, User currentUser) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.ERROR_NOTE_NOT_FOUND));

        authorizeUpdate(note, currentUser);

        int requestVersion = request.getVersion();
        if (requestVersion < note.getVersion()) {
            NoteResponse serverNoteDto = convertToNoteResponse(note, currentUser.getId(), true);
            throw new ConflictException(
                    AppConstants.ERROR_NOTE_CONFLICT,
                    requestVersion,
                    note.getVersion(),
                    serverNoteDto
            );
        }

        if (request.getTitle() != null) {
            note.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            note.setContent(request.getContent());
        }
        if (request.getColor() != null) {
            note.setColor(request.getColor());
        }

        if (request.getIsPinned() != null) {
            boolean nextPinned = request.getIsPinned();
            if (nextPinned != note.getIsPinned()) {
                note.setIsPinned(nextPinned);
                note.setPinnedAt(nextPinned ? LocalDateTime.now() : null);
            }
        }

        if (request.getIsProtected() != null) {
            boolean nextProtected = request.getIsProtected();
            note.setIsProtected(nextProtected);

            if (nextProtected && request.getPassword() != null && !request.getPassword().isEmpty()) {
                note.setPassword(passwordEncoder.encode(request.getPassword()));
            } else if (!nextProtected) {
                note.setPassword(null);
            }
        }

        note.setVersion(note.getVersion() + 1);
        Note updatedNote = noteRepository.save(note);

        NoteResponse responseDto = convertToNoteResponse(updatedNote, currentUser.getId(), true);

        // Broadcast to Pusher
        pusherService.broadcastNoteUpdated(responseDto, String.valueOf(currentUser.getId()));

        return responseDto;
    }

    @Transactional
    public void deleteNote(Long noteId, User currentUser) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.ERROR_NOTE_NOT_FOUND));

        authorizeDelete(note, currentUser);

        // Fetch active shares before deleting to broadcast revoke events
        List<NoteShare> activeShares = new ArrayList<>(note.getShares());

        // JPA soft delete will be executed
        noteRepository.delete(note);

        // Broadcast to note channel (e.g. for owner's other sessions and collaborators actively viewing the note)
        pusherService.broadcastNoteDeleted(noteId);

        // Broadcast to collaborators' user channels
        for (NoteShare share : activeShares) {
            if (share.getReceiver() != null && share.getDeletedAt() == null) {
                pusherService.broadcastNoteRevoked(noteId, String.valueOf(share.getReceiver().getId()));
            }
        }
    }

    @Transactional(readOnly = true)
    public NoteResponse verifyPassword(Long noteId, VerifyNotePasswordRequest request, User currentUser) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.ERROR_NOTE_NOT_FOUND));

        authorizeView(note, currentUser);

        if (!Boolean.TRUE.equals(note.getIsProtected()) || note.getPassword() == null) {
            return convertToNoteResponse(note, currentUser.getId(), false);
        }

        String inputPassword = request.getPassword() != null ? request.getPassword() : "";
        if (passwordEncoder.matches(inputPassword, note.getPassword())) {
            return convertToNoteResponse(note, currentUser.getId(), false);
        }

        throw new ForbiddenException(AppConstants.ERROR_PASSWORD_INCORRECT);
    }

    @Transactional
    public NoteResponse attachLabels(Long noteId, AttachLabelsRequest request, User currentUser) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.ERROR_NOTE_NOT_FOUND));

        authorizeView(note, currentUser);

        List<NoteLabel> existingRelations = noteLabelRepository.findByNote_IdAndUser_Id(noteId, currentUser.getId());
        List<Long> existingLabelIds = existingRelations.stream()
                .map(nl -> nl.getLabel().getId())
                .collect(Collectors.toList());

        for (Long labelId : request.getLabelIds()) {
            if (!existingLabelIds.contains(labelId)) {
                Label label = labelRepository.findById(labelId)
                        .orElseThrow(() -> new ResourceNotFoundException(AppConstants.ERROR_LABEL_NOT_FOUND));

                if (!label.getUser().getId().equals(currentUser.getId())) {
                    throw new ForbiddenException(AppConstants.ERROR_LABEL_FORBIDDEN);
                }

                NoteLabel nl = new NoteLabel();
                nl.setNote(note);
                nl.setLabel(label);
                nl.setUser(currentUser);
                noteLabelRepository.save(nl);
            }
        }

        // Return updated note with labels
        return convertToNoteResponse(note, currentUser.getId(), true);
    }

    @Transactional
    public NoteResponse detachLabels(Long noteId, DetachLabelsRequest request, User currentUser) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(AppConstants.ERROR_NOTE_NOT_FOUND));

        authorizeView(note, currentUser);

        noteLabelRepository.deleteByNoteIdAndUserIdAndLabelIdIn(noteId, currentUser.getId(), request.getLabelIds());

        // Return updated note with labels
        return convertToNoteResponse(note, currentUser.getId(), true);
    }

    // Helper Authorization methods
    private void authorizeView(Note note, User user) {
        if (note.getUser().getId().equals(user.getId())) {
            return;
        }
        boolean isShared = noteShareRepository.existsByNoteIdAndReceiverIdAndDeletedAtIsNull(note.getId(), user.getId());
        if (!isShared) {
            throw new ForbiddenException("Forbidden.");
        }
    }

    private void authorizeUpdate(Note note, User user) {
        if (note.getUser().getId().equals(user.getId())) {
            return;
        }
        boolean hasEditPermission = noteShareRepository.existsByNoteIdAndReceiverIdAndPermissionAndDeletedAtIsNull(
                note.getId(),
                user.getId(),
                AppConstants.PERMISSION_EDIT
        );
        if (!hasEditPermission) {
            throw new ForbiddenException("Forbidden.");
        }
    }

    private void authorizeDelete(Note note, User user) {
        if (!note.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Forbidden.");
        }
    }

    // Helper: entity DTO mapping
    public NoteResponse convertToNoteResponse(Note note, Long currentUserId, boolean mask) {
        return noteMapper.convertToNoteResponse(note, currentUserId, mask);
    }
}
