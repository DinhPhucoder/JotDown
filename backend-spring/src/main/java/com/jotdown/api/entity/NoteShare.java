package com.jotdown.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * NoteShare entity — represents a sharing relationship between note owner and recipient.
 *
 * Business rules:
 * - permission = READ: recipient can view only
 * - permission = EDIT: recipient can view + edit + manage attachments
 * - Only the owner can share, update permission, or revoke
 * - Self-sharing is blocked at application level (422) AND DB trigger
 * - When revoked → soft delete. When re-shared with same user → RESTORE the record
 */
@Entity
@Table(name = "note_shares")
@SQLDelete(sql = "UPDATE note_shares SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class NoteShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    /**
     * Permission level: "READ" or "EDIT" (stored uppercase in DB).
     */
    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.CHAR)
    private String permission;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
