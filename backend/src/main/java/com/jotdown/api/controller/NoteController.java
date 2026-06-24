package com.jotdown.api.controller;

import com.jotdown.api.dto.request.*;
import com.jotdown.api.dto.response.NoteResponse;
import com.jotdown.api.entity.User;
import com.jotdown.api.security.CurrentUser;
import com.jotdown.api.service.NoteService;
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
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public ResponseEntity<List<NoteResponse>> index(@CurrentUser User currentUser) {
        List<NoteResponse> notes = noteService.listNotes(currentUser);
        return ResponseEntity.ok(notes);
    }

    @PostMapping
    public ResponseEntity<NoteResponse> store(
            @CurrentUser User currentUser,
            @Valid @RequestBody StoreNoteRequest request) {
        NoteResponse note = noteService.createNote(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(note);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteResponse> show(
            @CurrentUser User currentUser,
            @PathVariable("id") Long id) {
        NoteResponse note = noteService.getNote(id, currentUser);
        return ResponseEntity.ok(note);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> update(
            @CurrentUser User currentUser,
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateNoteRequest request) {
        NoteResponse note = noteService.updateNote(id, request, currentUser);
        return ResponseEntity.ok(note);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> destroy(
            @CurrentUser User currentUser,
            @PathVariable("id") Long id) {
        noteService.deleteNote(id, currentUser);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/verify-password")
    public ResponseEntity<Map<String, Object>> verifyPassword(
            @CurrentUser User currentUser,
            @PathVariable("id") Long id,
            @Valid @RequestBody VerifyNotePasswordRequest request) {
        NoteResponse note = noteService.verifyPassword(id, request, currentUser);
        Map<String, Object> response = new HashMap<>();
        response.put("valid", true);
        response.put("note", note);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/labels/attach")
    public ResponseEntity<Map<String, Object>> attachLabels(
            @CurrentUser User currentUser,
            @PathVariable("id") Long id,
            @Valid @RequestBody AttachLabelsRequest request) {
        NoteResponse note = noteService.attachLabels(id, request, currentUser);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Labels attached successfully");
        response.put("data", note);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/labels/detach")
    public ResponseEntity<Map<String, Object>> detachLabels(
            @CurrentUser User currentUser,
            @PathVariable("id") Long id,
            @Valid @RequestBody DetachLabelsRequest request) {
        NoteResponse note = noteService.detachLabels(id, request, currentUser);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Labels detached successfully");
        response.put("data", note);
        return ResponseEntity.ok(response);
    }
}
