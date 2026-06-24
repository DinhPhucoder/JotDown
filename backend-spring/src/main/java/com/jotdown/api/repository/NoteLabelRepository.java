package com.jotdown.api.repository;

import com.jotdown.api.entity.NoteLabel;
import com.jotdown.api.entity.NoteLabelId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteLabelRepository extends JpaRepository<NoteLabel, NoteLabelId> {
    List<NoteLabel> findByNote_IdAndUser_Id(Long noteId, Long userId);

    @Modifying
    @Query("DELETE FROM NoteLabel nl WHERE nl.note.id = :noteId AND nl.user.id = :userId AND nl.label.id IN :labelIds")
    void deleteByNoteIdAndUserIdAndLabelIdIn(
            @Param("noteId") Long noteId,
            @Param("userId") Long userId,
            @Param("labelIds") List<Long> labelIds
    );
}
