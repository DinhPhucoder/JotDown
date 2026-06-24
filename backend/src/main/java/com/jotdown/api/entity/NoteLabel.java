package com.jotdown.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

/**
 * NoteLabel — explicit join entity for note_labels pivot table.
 *
 * WHY explicit entity instead of @ManyToMany:
 * The pivot table has an extra column `user_id` (who attached the label).
 * This supports per-user labels on shared notes:
 * User1 and User2 can have DIFFERENT labels on the same shared note.
 * JPA @ManyToMany cannot map extra pivot columns — so we use this entity.
 */
@Entity
@Table(name = "note_labels")
@IdClass(NoteLabelId.class)
@Getter
@Setter
@NoArgsConstructor
public class NoteLabel {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "label_id", nullable = false)
    private Label label;

    /**
     * The user who attached this label to this note.
     * On a shared note, each recipient manages their own labels independently.
     */
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
