package com.jotdown.api.controller;

import com.jotdown.api.entity.Note;
import com.jotdown.api.entity.User;
import com.jotdown.api.repository.NoteRepository;
import com.jotdown.api.repository.NoteShareRepository;
import com.jotdown.api.security.CurrentUser;
import com.jotdown.api.service.PusherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/broadcasting")
@RequiredArgsConstructor
@Slf4j
public class PusherAuthController {

    private final PusherService pusherService;
    private final NoteRepository noteRepository;
    private final NoteShareRepository noteShareRepository;

    @PostMapping(value = "/auth", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> authenticate(
            @CurrentUser User currentUser,
            @RequestBody Map<String, String> body) {

        String socketId = body.get("socket_id");
        String channelName = body.get("channel_name");

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User not found");
        }

        Long userId = currentUser.getId();

        try {
            boolean authorized = false;

            if (channelName.startsWith("private-user.")) {
                String channelUserIdStr = channelName.substring("private-user.".length());
                if (String.valueOf(userId).equals(channelUserIdStr)) {
                    authorized = true;
                }
            } else if (channelName.startsWith("private-note.")) {
                String noteIdStr = channelName.substring("private-note.".length());
                Long noteId = Long.parseLong(noteIdStr);

                Optional<Note> noteOpt = noteRepository.findById(noteId);
                if (noteOpt.isPresent()) {
                    Note note = noteOpt.get();
                    if (note.getUser().getId().equals(userId)) {
                        authorized = true;
                    } else if (noteShareRepository.existsByNoteIdAndReceiverIdAndDeletedAtIsNull(noteId, userId)) {
                        authorized = true;
                    }
                }
            }

            if (!authorized) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
            }

            String authResponse = pusherService.authenticateChannel(socketId, channelName);
            return ResponseEntity.ok(authResponse);

        } catch (Exception e) {
            log.error("Error authenticating Pusher channel", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Authentication failed");
        }
    }
}
