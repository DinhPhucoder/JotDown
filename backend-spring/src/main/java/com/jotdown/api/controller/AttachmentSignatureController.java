package com.jotdown.api.controller;

import com.jotdown.api.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/attachments/signature")
@RequiredArgsConstructor
public class AttachmentSignatureController {

    private final CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> getSignature() {
        Map<String, Object> payload = cloudinaryService.buildSignaturePayload();
        Map<String, Object> response = new HashMap<>();
        response.put("data", payload);
        return ResponseEntity.ok(response);
    }
}
