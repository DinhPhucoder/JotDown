package com.jotdown.api.repository;

import com.jotdown.api.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserIdOrderByIsPinnedDescUpdatedAtDesc(Long userId);

    @org.springframework.data.jpa.repository.Query(
        value = "SELECT * FROM notes WHERE user_id = :userId AND (updated_at > :since OR deleted_at > :since) ORDER BY updated_at ASC",
        nativeQuery = true
    )
    List<Note> findNotesUpdatedOrDeletedSince(
        @org.springframework.data.repository.query.Param("userId") Long userId,
        @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since
    );
}
