package com.jotdown.api.service;

import com.jotdown.api.dto.response.NoteResponse;
import com.jotdown.api.entity.*;
import com.jotdown.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Handles individual sync apply operations, each in its own independent transaction.
 *
 * Using Propagation.REQUIRES_NEW ensures that if one operation fails, only that
 * operation's transaction is rolled back. The caller (SyncService.pushSync) is NOT
 * @Transactional, so there is no outer transaction to poison with a rollback-only flag.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncApplyService {

    private final NoteRepository noteRepository;
    private final NoteShareRepository noteShareRepository;
    private final NoteAttachmentRepository noteAttachmentRepository;
    private final NoteLabelRepository noteLabelRepository;
    private final LabelRepository labelRepository;
    private final SyncQueueRepository syncQueueRepository;
    private final NoteService noteService;
    private final PusherService pusherService;
    private final CloudinaryService cloudinaryService;

    // ─────────────────────────────────────────────────────
    // Audit: Save sync queue entry (isolated transaction)
    // ─────────────────────────────────────────────────────

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveSyncQueueEntry(User currentUser, String action, Long entityId, Map<String, Object> payload) {
        SyncQueue entry = new SyncQueue();
        entry.setUser(currentUser);
        entry.setAction(action);
        entry.setEntityId(entityId);
        entry.setPayload(payload);
        syncQueueRepository.save(entry);
    }

    // ─────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void applyCreate(User currentUser, Map<String, Object> payload, String timestamp) {
        LocalDateTime parsedTime = parseTimestamp(timestamp);

        Note note = new Note();
        note.setUser(currentUser);
        note.setTitle(Optional.ofNullable(payload.get("title")).map(Object::toString).orElse(""));
        note.setContent(Optional.ofNullable(payload.get("content")).map(Object::toString).orElse(""));
        note.setColor(resolveColor(payload.get("color")));

        boolean isPinned = Optional.ofNullable(payload.get("is_pinned"))
                .map(v -> Boolean.parseBoolean(v.toString())).orElse(false);
        note.setIsPinned(isPinned);
        note.setPinnedAt(isPinned ? parsedTime : null);

        int version = Optional.ofNullable(payload.get("version"))
                .map(v -> Integer.parseInt(v.toString())).orElse(1);
        note.setVersion(Math.max(version, 1));

        note = noteRepository.save(note);

        if (payload.containsKey("label_names") && payload.get("label_names") instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> labelNames = (List<String>) payload.get("label_names");
            syncNoteLabels(note, currentUser, labelNames);
        }
    }

    // ─────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Map<String, Object> applyUpdate(User currentUser, Long entityId, Map<String, Object> payload, String timestamp) {
        Optional<Note> noteOpt = noteRepository.findById(entityId);
        if (noteOpt.isEmpty()) {
            log.warn("Sync Update Failed: Note Not Found. entityId={}", entityId);
            return errorMap(entityId, "NOTE_NOT_FOUND");
        }

        Note note = noteOpt.get();
        boolean isOwner = note.getUser().getId().equals(currentUser.getId());
        boolean hasEditPermission = noteShareRepository.existsByNoteIdAndReceiverIdAndPermissionAndDeletedAtIsNull(
                note.getId(), currentUser.getId(), "EDIT");

        if (!isOwner && !hasEditPermission) {
            log.warn("Sync Update Failed: Forbidden. entityId={}, userId={}", entityId, currentUser.getId());
            return errorMap(entityId, "NOTE_NOT_FOUND");
        }

        int incomingVersion = Optional.ofNullable(payload.get("version"))
                .map(v -> Integer.parseInt(v.toString())).orElse(0);

        if (incomingVersion < note.getVersion()) {
            log.warn("Sync Update Failed: Stale Version. entityId={}, clientVersion={}, serverVersion={}",
                    entityId, incomingVersion, note.getVersion());
            Map<String, Object> conflict = new HashMap<>();
            conflict.put("entity_id", String.valueOf(entityId));
            conflict.put("reason", "STALE_VERSION");
            conflict.put("client_version", incomingVersion);
            conflict.put("server_note", noteService.convertToNoteResponse(note, currentUser.getId(), true));
            return conflict;
        }

        if (payload.containsKey("title")) note.setTitle(payload.get("title").toString());
        if (payload.containsKey("content")) note.setContent(payload.get("content").toString());
        if (payload.containsKey("color")) note.setColor(resolveColor(payload.get("color")));

        if (payload.containsKey("is_pinned")) {
            boolean isPinned = Boolean.parseBoolean(payload.get("is_pinned").toString());
            note.setIsPinned(isPinned);
            note.setPinnedAt(isPinned ? parseTimestamp(timestamp) : null);
        }

        note.setVersion(note.getVersion() + 1);
        note = noteRepository.save(note);

        if (payload.containsKey("label_names") && payload.get("label_names") instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> labelNames = (List<String>) payload.get("label_names");
            syncNoteLabels(note, currentUser, labelNames);
        }

        NoteResponse noteResponse = noteService.convertToNoteResponse(note, currentUser.getId(), true);
        pusherService.broadcastNoteUpdated(noteResponse, currentUser.getId().toString());

        return null;
    }

    // ─────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean applyDelete(User currentUser, Long entityId) {
        Optional<Note> noteOpt = noteRepository.findById(entityId);
        if (noteOpt.isEmpty() || !noteOpt.get().getUser().getId().equals(currentUser.getId())) {
            return false;
        }
        noteRepository.delete(noteOpt.get());
        return true;
    }

    // ─────────────────────────────────────────────────────
    // ATTACHMENT_ADD
    // ─────────────────────────────────────────────────────

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Map<String, Object> applyAttachmentAdd(User currentUser, Long entityId, Map<String, Object> payload) {
        Optional<Note> noteOpt = noteRepository.findById(entityId);
        if (noteOpt.isEmpty()) {
            return errorMap(entityId, "NOTE_NOT_FOUND");
        }

        Note note = noteOpt.get();
        boolean isOwner = note.getUser().getId().equals(currentUser.getId());
        boolean hasEditPermission = noteShareRepository.existsByNoteIdAndReceiverIdAndPermissionAndDeletedAtIsNull(
                note.getId(), currentUser.getId(), "EDIT");

        if (!isOwner && !hasEditPermission) {
            return errorMap(entityId, "NOTE_NOT_FOUND");
        }

        String fileUrl = Optional.ofNullable(payload.get("file_url")).map(Object::toString).orElse("");
        String fileType = Optional.ofNullable(payload.get("file_type"))
                .map(v -> v.toString().toLowerCase().trim()).orElse("");
        long fileSize = Optional.ofNullable(payload.get("file_size"))
                .map(v -> Long.parseLong(v.toString())).orElse(0L);
        String originalName = Optional.ofNullable(payload.get("original_name"))
                .map(Object::toString).orElse(null);

        if (fileUrl.isEmpty() || fileSize <= 0) {
            return errorMap(entityId, "ATTACHMENT_INVALID_PAYLOAD");
        }

        List<String> allowedTypes = Arrays.asList("jpg", "jpeg", "png", "image/jpeg", "image/png");
        if (!allowedTypes.contains(fileType)) {
            return errorMap(entityId, "ATTACHMENT_INVALID_TYPE");
        }

        if (note.getAttachments().size() >= 3) {
            return errorMap(entityId, "ATTACHMENT_LIMIT_REACHED");
        }

        long currentTotalSize = note.getAttachments().stream().mapToLong(NoteAttachment::getFileSize).sum();
        if (currentTotalSize + fileSize > 15 * 1024 * 1024) {
            return errorMap(entityId, "ATTACHMENT_TOTAL_SIZE_EXCEEDED");
        }

        NoteAttachment attachment = new NoteAttachment();
        attachment.setNote(note);
        attachment.setFileUrl(fileUrl);
        attachment.setAttachmentKind("IMAGE");
        attachment.setOriginalName(originalName);
        attachment.setFileType(cloudinaryService.normalizeFileType(fileType));
        attachment.setFileSize(fileSize);
        noteAttachmentRepository.save(attachment);

        note.setUpdatedAt(LocalDateTime.now());
        noteRepository.save(note);

        NoteResponse noteResponse = noteService.convertToNoteResponse(note, currentUser.getId(), true);
        pusherService.broadcastNoteUpdated(noteResponse, currentUser.getId().toString());

        return null;
    }

    // ─────────────────────────────────────────────────────
    // ATTACHMENT_REMOVE
    // ─────────────────────────────────────────────────────

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Map<String, Object> applyAttachmentRemove(User currentUser, Long entityId, Map<String, Object> payload) {
        Optional<Note> noteOpt = noteRepository.findById(entityId);
        if (noteOpt.isEmpty()) {
            return errorMap(entityId, "NOTE_NOT_FOUND");
        }

        Note note = noteOpt.get();
        boolean isOwner = note.getUser().getId().equals(currentUser.getId());
        boolean hasEditPermission = noteShareRepository.existsByNoteIdAndReceiverIdAndPermissionAndDeletedAtIsNull(
                note.getId(), currentUser.getId(), "EDIT");

        if (!isOwner && !hasEditPermission) {
            return errorMap(entityId, "NOTE_NOT_FOUND");
        }

        Long attachmentId = Optional.ofNullable(payload.get("attachment_id"))
                .map(v -> Long.parseLong(v.toString())).orElse(0L);
        if (attachmentId <= 0) {
            return errorMap(entityId, "ATTACHMENT_INVALID_PAYLOAD");
        }

        Optional<NoteAttachment> attachmentOpt = noteAttachmentRepository.findById(attachmentId);
        if (attachmentOpt.isEmpty() || !attachmentOpt.get().getNote().getId().equals(note.getId())) {
            return errorMap(entityId, "ATTACHMENT_NOT_FOUND");
        }

        NoteAttachment attachmentToDelete = attachmentOpt.get();
        // Remove from the managed collection so CascadeType.ALL doesn't try to merge a deleted entity
        note.getAttachments().remove(attachmentToDelete);
        noteAttachmentRepository.delete(attachmentToDelete);

        note.setUpdatedAt(LocalDateTime.now());
        noteRepository.save(note);

        NoteResponse noteResponse = noteService.convertToNoteResponse(note, currentUser.getId(), true);
        pusherService.broadcastNoteUpdated(noteResponse, currentUser.getId().toString());

        return null;
    }

    // ─────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────

    private Map<String, Object> errorMap(Long entityId, String reason) {
        Map<String, Object> err = new HashMap<>();
        err.put("entity_id", String.valueOf(entityId));
        err.put("reason", reason);
        return err;
    }

    private void syncNoteLabels(Note note, User user, List<String> labelNames) {
        log.info("Syncing labels for note {} with names {}", note.getId(), labelNames);

        List<String> incomingNames = labelNames.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .distinct()
                .collect(Collectors.toList());

        List<Label> allUserLabels = labelRepository.findByUserId(user.getId());

        List<Label> targetLabels = incomingNames.stream().map(name -> {
            String nameLower = name.toLowerCase();
            return allUserLabels.stream()
                    .filter(l -> l.getName().trim().equalsIgnoreCase(nameLower))
                    .findFirst()
                    .orElseGet(() -> {
                        Label newLabel = new Label();
                        newLabel.setUser(user);
                        newLabel.setName(name);
                        Label saved = labelRepository.save(newLabel);
                        allUserLabels.add(saved);
                        return saved;
                    });
        }).collect(Collectors.toList());

        List<NoteLabel> existingRelations = noteLabelRepository.findByNote_IdAndUser_Id(note.getId(), user.getId());
        List<Long> targetLabelIds = targetLabels.stream().map(Label::getId).collect(Collectors.toList());

        for (NoteLabel nl : existingRelations) {
            if (!targetLabelIds.contains(nl.getLabel().getId())) {
                noteLabelRepository.delete(nl);
            }
        }

        List<Long> existingLabelIds = existingRelations.stream()
                .map(nl -> nl.getLabel().getId())
                .collect(Collectors.toList());

        for (Label label : targetLabels) {
            if (!existingLabelIds.contains(label.getId())) {
                NoteLabel nl = new NoteLabel();
                nl.setNote(note);
                nl.setLabel(label);
                nl.setUser(user);
                noteLabelRepository.save(nl);
            }
        }
    }

    private String resolveColor(Object colorObj) {
        if (colorObj == null) return "#ffffff";
        String color = colorObj.toString();
        if (color.matches("^#[0-9A-F]{6}$")) return color;
        return "#ffffff";
    }

    private LocalDateTime parseTimestamp(String timestamp) {
        try {
            return ZonedDateTime.parse(timestamp, DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                    .withZoneSameInstant(ZoneId.systemDefault())
                    .toLocalDateTime();
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(timestamp, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception ex) {
                return LocalDateTime.now();
            }
        }
    }
}
