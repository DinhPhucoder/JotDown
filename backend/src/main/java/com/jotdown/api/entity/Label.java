package com.jotdown.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Label entity — user's personal classification tags.
 *
 * Key business rule: Labels belong to a USER, not to a note.
 * The note_labels pivot includes user_id to support per-user labels
 * on shared notes (each recipient sees only their own labels).
 * Labels have no timestamps (Label.php: public $timestamps = false).
 */
@Entity
@Table(name = "labels")
@Getter
@Setter
@NoArgsConstructor
public class Label {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "label", fetch = FetchType.LAZY)
    private List<NoteLabel> noteLabels = new ArrayList<>();
}
