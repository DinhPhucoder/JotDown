package com.jotdown.api.repository;

import com.jotdown.api.entity.NoteAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NoteAttachmentRepository extends JpaRepository<NoteAttachment, Long> {
}
