package com.jotdown.api.service;

import com.jotdown.api.entity.*;
import com.jotdown.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import com.jotdown.api.dto.response.NoteResponse;

/**
 * Orchestrates sync push/pull for a user's notes.
 *
 * pushSync is intentionally NOT @Transactional.
 * Each apply* call is delegated to SyncApplyService where each operation runs in
 * its own Propagation.REQUIRES_NEW transaction. This prevents the
 * "Transaction silently rolled back because it has been marked as rollback-only"
 * error that occurred when a single failure inside the loop poisoned the entire
 * outer transaction.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {

    private final NoteRepository noteRepository;
    private final NoteService noteService;
    private final SyncApplyService syncApplyService;

    // ─────────────────────────────────────────────────────
    // PUSH SYNC  (no outer transaction — each item is isolated)
    // ─────────────────────────────────────────────────────

    public Map<String, Object> pushSync(User currentUser, List<Map<String, Object>> changes) {
        Map<String, Object> result = new HashMap<>();
        int successCount = 0;
        int failedCount = 0;
        List<Map<String, Object>> conflicts = new ArrayList<>();

        if (changes == null) {
            result.put("success_count", 0);
            result.put("failed_count", 0);
            result.put("conflicts", conflicts);
            return result;
        }

        for (Map<String, Object> change : changes) {
            String action = Optional.ofNullable(change.get("action"))
                    .map(Object::toString).orElse("").toUpperCase();

            Long entityId = 0L;
            if (!"CREATE".equals(action)) {
                try {
                    entityId = Optional.ofNullable(change.get("entity_id"))
                            .map(v -> Long.parseLong(v.toString()))
                            .orElse(0L);
                } catch (NumberFormatException e) {
                    log.warn("Sync Push: non-numeric entity_id '{}' for action {}, defaulting to 0",
                            change.get("entity_id"), action);
                }
            }

            Map<String, Object> payload = new HashMap<>();
            if (change.get("payload") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> castPayload = (Map<String, Object>) change.get("payload");
                payload.putAll(castPayload);
            }

            String timestamp = Optional.ofNullable(change.get("timestamp"))
                    .map(Object::toString)
                    .orElseGet(() -> LocalDateTime.now()
                            .atZone(ZoneId.systemDefault())
                            .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));

            log.info("Sync Push Entry: action={}, entity_id={}, timestamp={}", action, entityId, timestamp);

            // Audit entry — isolated transaction so it never poisons an apply transaction
            try {
                syncApplyService.saveSyncQueueEntry(currentUser, action, entityId, payload);
            } catch (Exception e) {
                log.warn("Sync Queue audit save failed (non-fatal): action={}, error={}", action, e.getMessage());
            }

            try {
                if ("CREATE".equals(action)) {
                    syncApplyService.applyCreate(currentUser, payload, timestamp);
                    successCount++;
                    continue;
                }

                if ("UPDATE".equals(action)) {
                    Map<String, Object> conflict = syncApplyService.applyUpdate(currentUser, entityId, payload, timestamp);
                    if (conflict != null) {
                        conflicts.add(conflict);
                    } else {
                        successCount++;
                    }
                    continue;
                }

                if ("DELETE".equals(action)) {
                    boolean deleted = syncApplyService.applyDelete(currentUser, entityId);
                    if (deleted) successCount++;
                    else failedCount++;
                    continue;
                }

                if ("ATTACHMENT_ADD".equals(action)) {
                    Map<String, Object> conflict = syncApplyService.applyAttachmentAdd(currentUser, entityId, payload);
                    if (conflict != null) {
                        conflicts.add(conflict);
                    } else {
                        successCount++;
                    }
                    continue;
                }

                if ("ATTACHMENT_REMOVE".equals(action)) {
                    Map<String, Object> conflict = syncApplyService.applyAttachmentRemove(currentUser, entityId, payload);
                    if (conflict != null) {
                        conflicts.add(conflict);
                    } else {
                        successCount++;
                    }
                    continue;
                }

                log.warn("Sync Push: unknown action '{}', skipping", action);
                failedCount++;

            } catch (Exception e) {
                log.error("Sync Entry Failed: action={}, entity_id={}, error={}", action, entityId, e.getMessage(), e);
                failedCount++;
            }
        }

        result.put("success_count", successCount);
        result.put("failed_count", failedCount);
        result.put("conflicts", conflicts);
        return result;
    }

    // ─────────────────────────────────────────────────────
    // PULL SYNC
    // ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> pullSync(User currentUser, String sinceStr) {
        LocalDateTime since = resolveSince(sinceStr);
        List<Note> changes = noteRepository.findNotesUpdatedOrDeletedSince(currentUser.getId(), since);

        List<NoteResponse> activeNotes = new ArrayList<>();
        List<Long> deletedIds = new ArrayList<>();

        for (Note note : changes) {
            if (note.getDeletedAt() == null) {
                activeNotes.add(noteService.convertToNoteResponse(note, currentUser.getId(), true));
            } else {
                deletedIds.add(note.getId());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("notes", activeNotes);
        response.put("deleted_ids", deletedIds);
        response.put("synced_at", ZonedDateTime.now(ZoneId.of("UTC")).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        return response;
    }

    // ─────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────

    private LocalDateTime resolveSince(String sinceStr) {
        if (sinceStr == null || sinceStr.trim().isEmpty()) {
            return LocalDateTime.now().minusDays(30);
        }
        try {
            return ZonedDateTime.parse(sinceStr, DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                    .withZoneSameInstant(ZoneId.systemDefault())
                    .toLocalDateTime();
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(sinceStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception ex) {
                return LocalDateTime.now().minusDays(30);
            }
        }
    }
}
