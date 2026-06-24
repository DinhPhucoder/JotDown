package com.jotdown.api.controller;

import com.jotdown.api.dto.request.ShareNoteRequest;
import com.jotdown.api.dto.request.UpdateShareRequest;
import com.jotdown.api.dto.response.NoteShareResponse;
import com.jotdown.api.entity.User;
import com.jotdown.api.security.CurrentUser;
import com.jotdown.api.service.NoteShareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class NoteShareController {

    private final NoteShareService noteShareService;

    @PostMapping("/{noteId}/share")
    public ResponseEntity<Map<String, Object>> share(
            @CurrentUser User currentUser,
            @PathVariable("noteId") Long noteId,
            @Valid @RequestBody ShareNoteRequest request) {
        NoteShareResponse shareResponse = noteShareService.shareNote(noteId, request, currentUser);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Chia sẻ ghi chú thành công.");
        response.put("data", shareResponse);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<Map<String, Object>> sharedWithMe(@CurrentUser User currentUser) {
        List<NoteShareResponse> sharedShares = noteShareService.listSharedWithMe(currentUser);

        Map<String, Object> response = new HashMap<>();
        response.put("data", sharedShares);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{noteId}/shares/{shareId}")
    public ResponseEntity<Map<String, Object>> update(
            @CurrentUser User currentUser,
            @PathVariable("noteId") Long noteId,
            @PathVariable("shareId") Long shareId,
            @Valid @RequestBody UpdateShareRequest request) {
        NoteShareResponse shareResponse = noteShareService.updateShare(noteId, shareId, request, currentUser);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Cập nhật quyền thành công.");
        response.put("data", shareResponse);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{noteId}/shares/{shareId}")
    public ResponseEntity<Map<String, Object>> revoke(
            @CurrentUser User currentUser,
            @PathVariable("noteId") Long noteId,
            @PathVariable("shareId") Long shareId) {
        noteShareService.revokeShare(noteId, shareId, currentUser);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Thu hồi quyền chia sẻ thành công.");

        return ResponseEntity.ok(response);
    }
}
