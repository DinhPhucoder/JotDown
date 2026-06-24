package com.jotdown.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Note entity — maps to the `notes` table.
 *
 * Key business rules (from migration-context.md):
 * - Soft delete: deleted_at is set, record stays in DB
 * - version field used for optimistic locking (conflict detection)
 * - is_protected = true → content and attachment URLs must be masked before returning to client
 * - Cascade: when note is soft-deleted → its attachments and shares are also soft-deleted
 */
@Entity
@Table(name = "notes")
@SQLDelete(sql = "UPDATE notes SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 7)
    private String color = "#ffffff";

    @Column(name = "is_pinned")
    private Boolean isPinned = false;

    @Column(name = "pinned_at")
    private LocalDateTime pinnedAt;

    /**
     * BCrypt-hashed password for protected notes.
     * Only set when is_protected = true.
     */
    private String password;

    @Column(name = "is_protected")
    private Boolean isProtected = false;

    /**
     * Optimistic version for conflict detection.
     * Client must send current version on UPDATE.
     * If client_version < server_version → 409 Conflict.
     */
    @Column(nullable = false)
    private Integer version = 1;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Soft delete timestamp — null means active */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "note", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<NoteAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "note", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<NoteShare> shares = new ArrayList<>();

    @OneToMany(mappedBy = "note", fetch = FetchType.LAZY)
    private List<NoteLabel> noteLabels = new ArrayList<>();

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
