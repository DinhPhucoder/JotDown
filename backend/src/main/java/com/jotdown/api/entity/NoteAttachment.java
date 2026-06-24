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
 * NoteAttachment — metadata record for Cloudinary-hosted images.
 *
 * Business rules:
 * - Max 3 attachments per note
 * - Max 15MB total per note
 * - Only JPG/PNG accepted (file_type stored as "image/jpeg" or "image/png")
 * - File is stored on Cloudinary; this entity only stores the URL + metadata
 * - attachment_kind = "IMAGE" always (current app only supports images)
 * - Soft-deleted when note is deleted or user removes attachment
 *
 * Protected note rule: if note.is_protected = true,
 * file_url must be transformed to blurred URL before returning to client.
 * The URL transformation adds "/e_blur:2000/" to the Cloudinary path.
 */
@Entity
@Table(name = "note_attachments")
@SQLDelete(sql = "UPDATE note_attachments SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
public class NoteAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "attachment_kind")
    @JdbcTypeCode(SqlTypes.CHAR)
    private String attachmentKind = "IMAGE";

    @Column(name = "original_name")
    private String originalName;

    @Column(name = "file_type")
    private String fileType;

    /** File size in bytes */
    @Column(name = "file_size")
    @JdbcTypeCode(SqlTypes.INTEGER)
    private Long fileSize;

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
