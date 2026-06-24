package com.jotdown.api.controller;

import com.jotdown.api.dto.request.StoreLabelRequest;
import com.jotdown.api.dto.request.UpdateLabelRequest;
import com.jotdown.api.dto.response.LabelResponse;
import com.jotdown.api.entity.User;
import com.jotdown.api.security.CurrentUser;
import com.jotdown.api.service.LabelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/labels")
@RequiredArgsConstructor
public class LabelController {

    private final LabelService labelService;

    @GetMapping
    public ResponseEntity<List<LabelResponse>> index(@CurrentUser User currentUser) {
        List<LabelResponse> labels = labelService.listLabels(currentUser);
        return ResponseEntity.ok(labels);
    }

    @PostMapping
    public ResponseEntity<LabelResponse> store(
            @CurrentUser User currentUser,
            @Valid @RequestBody StoreLabelRequest request) {
        LabelResponse label = labelService.createLabel(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(label);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LabelResponse> update(
            @CurrentUser User currentUser,
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateLabelRequest request) {
        LabelResponse label = labelService.updateLabel(id, request, currentUser);
        return ResponseEntity.ok(label);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> destroy(
            @CurrentUser User currentUser,
            @PathVariable("id") Long id) {
        labelService.deleteLabel(id, currentUser);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Deleted");
        return ResponseEntity.ok(response);
    }
}
