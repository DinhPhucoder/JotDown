package com.jotdown.api.entity;

import java.io.Serializable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode
public class NoteLabelId implements Serializable {
    private Long note;  // Matches the field name 'note' in NoteLabel, and its type is the ID type of Note (Long)
    private Long label; // Matches the field name 'label' in NoteLabel, and its type is the ID type of Label (Long)
    private Long user;  // Matches the field name 'user' in NoteLabel, and its type is the ID type of User (Long)

    public NoteLabelId(Long note, Long label, Long user) {
        this.note = note;
        this.label = label;
        this.user = user;
    }
}
