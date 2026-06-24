package com.jotdown.api.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/up")
    public ResponseEntity<String> up() {
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "ok");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/ping")
    public ResponseEntity<?> ping() {
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (result != null && result == 1) {
                Map<String, Object> response = new HashMap<>();
                response.put("status", "ok");
                response.put("db", "connected");
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Database ping returned unexpected result");
        } catch (Exception e) {
            log.error("Database connectivity check failed", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Database connectivity check failed: " + e.getMessage());
        }
    }
}
