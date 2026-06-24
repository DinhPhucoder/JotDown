package com.jotdown.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * SyncQueue — audit log for offline sync operations.
 *
 * Every push operation (CREATE/UPDATE/DELETE/ATTACHMENT_ADD/ATTACHMENT_REMOVE)
 * is written here BEFORE processing — serves as audit trail and debug log.
 *
 * Note: no updated_at column (mirrors Laravel: const UPDATED_AT = null)
 */
@Entity
@Table(name = "sync_queue")
@Getter
@Setter
@NoArgsConstructor
public class SyncQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** One of: CREATE, UPDATE, DELETE, ATTACHMENT_ADD, ATTACHMENT_REMOVE */
    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "entity_id")
    private Long entityId;

    /** The payload sent by the client for this operation */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> payload;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // No updated_at — matches Laravel: const UPDATED_AT = null

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
