package com.jotdown.api.controller;

import com.jotdown.api.dto.request.SyncRequest;
import com.jotdown.api.entity.User;
import com.jotdown.api.security.CurrentUser;
import com.jotdown.api.service.SyncService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    @PostMapping("/push")
    public ResponseEntity<Map<String, Object>> push(
            @CurrentUser User currentUser,
            @Valid @RequestBody SyncRequest request) {
        Map<String, Object> result = syncService.pushSync(currentUser, request.getChanges());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/pull")
    public ResponseEntity<Map<String, Object>> pull(
            @CurrentUser User currentUser,
            @RequestParam(value = "since", required = false) String since) {
        Map<String, Object> result = syncService.pullSync(currentUser, since);
        return ResponseEntity.ok(result);
    }
}
