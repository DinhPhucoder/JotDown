package com.jotdown.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jotdown.api.dto.response.NoteResponse;
import com.jotdown.api.dto.response.UserResponse;
import com.pusher.rest.Pusher;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PusherService {

    private final ObjectMapper objectMapper;

    @Value("${app.pusher.app-id:}")
    private String appId;

    @Value("${app.pusher.key:}")
    private String key;

    @Value("${app.pusher.secret:}")
    private String secret;

    @Value("${app.pusher.cluster:ap1}")
    private String cluster;

    private Pusher pusher;

    @PostConstruct
    public void init() {
        if (appId != null && !appId.isEmpty() &&
            key != null && !key.isEmpty() &&
            secret != null && !secret.isEmpty()) {
            pusher = new Pusher(appId, key, secret);
            pusher.setCluster(cluster);
            pusher.setEncrypted(true);
            log.info("Pusher initialized successfully with app-id: {}", appId);
        } else {
            log.warn("Pusher configuration is incomplete. Realtime events will not be broadcasted.");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Object value) {
        if (value == null) return null;
        return objectMapper.convertValue(value, Map.class);
    }

    public void broadcastNoteUpdated(NoteResponse note, String updatedByUserId) {
        if (pusher == null) {
            log.warn("Pusher is not initialized. Skipping broadcast for note id: {}", note.getId());
            return;
        }

        try {
            Map<String, Object> data = new HashMap<>();
            data.put("note", toMap(note));
            data.put("updated_by", updatedByUserId);

            String channelName = "private-note." + note.getId();
            pusher.trigger(channelName, "NoteUpdated", data);
            log.info("Broadcasted NoteUpdated event to channel: {}", channelName);
        } catch (Exception e) {
            log.error("Failed to broadcast NoteUpdated event to Pusher", e);
        }
    }

    public void broadcastNoteDeleted(Long noteId) {
        if (pusher == null) {
            log.warn("Pusher is not initialized. Skipping delete broadcast for note id: {}", noteId);
            return;
        }

        try {
            Map<String, Object> data = new HashMap<>();
            Map<String, Object> noteData = new HashMap<>();
            noteData.put("id", noteId);
            data.put("note", noteData);
            data.put("isDeleted", true);

            String channelName = "private-note." + noteId;
            pusher.trigger(channelName, "NoteDeleted", data);
            log.info("Broadcasted NoteDeleted event to channel: {}", channelName);
        } catch (Exception e) {
            log.error("Failed to broadcast NoteDeleted event to Pusher", e);
        }
    }

    public void broadcastNoteShared(NoteResponse note, String receiverId, UserResponse sender, String permission) {
        if (pusher == null) {
            log.warn("Pusher is not initialized. Skipping share broadcast for receiver: {}", receiverId);
            return;
        }

        try {
            Map<String, Object> data = new HashMap<>();
            data.put("note", toMap(note));
            data.put("sender", toMap(sender));
            data.put("permission", permission);
            data.put("message", "Một ghi chú vừa được chia sẻ với bạn.");

            String channelName = "private-user." + receiverId;
            pusher.trigger(channelName, "NoteShared", data);
            log.info("Broadcasted NoteShared event to channel: {}", channelName);
        } catch (Exception e) {
            log.error("Failed to broadcast NoteShared event to Pusher", e);
        }
    }

    public void broadcastNoteRevoked(Long noteId, String receiverId) {
        if (pusher == null) {
            log.warn("Pusher is not initialized. Skipping revoke broadcast for receiver: {}", receiverId);
            return;
        }

        try {
            Map<String, Object> data = new HashMap<>();
            data.put("note_id", noteId);
            data.put("message", "Quyền truy cập ghi chú của bạn đã bị thu hồi.");

            String channelName = "private-user." + receiverId;
            pusher.trigger(channelName, "NoteRevoked", data);
            log.info("Broadcasted NoteRevoked event to channel: {}", channelName);
        } catch (Exception e) {
            log.error("Failed to broadcast NoteRevoked event to Pusher", e);
        }
    }

    public String authenticateChannel(String socketId, String channelName) {
        if (pusher == null) {
            throw new IllegalStateException("Pusher is not initialized");
        }
        return pusher.authenticate(socketId, channelName);
    }
}
