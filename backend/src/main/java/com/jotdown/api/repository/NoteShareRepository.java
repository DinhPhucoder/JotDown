package com.jotdown.api.repository;

import com.jotdown.api.entity.NoteShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteShareRepository extends JpaRepository<NoteShare, Long> {
    boolean existsByNoteIdAndReceiverIdAndDeletedAtIsNull(Long noteId, Long receiverId);
    boolean existsByNoteIdAndReceiverIdAndPermissionAndDeletedAtIsNull(Long noteId, Long receiverId, String permission);
    List<NoteShare> findByReceiverIdAndDeletedAtIsNull(Long receiverId);

    @Query(value = "SELECT * FROM note_shares WHERE note_id = :noteId AND receiver_id = :receiverId", nativeQuery = true)
    Optional<NoteShare> findAnyShareWithTrashed(@Param("noteId") Long noteId, @Param("receiverId") Long receiverId);

    @Modifying
    @Query(value = "UPDATE note_shares SET deleted_at = NULL, sender_id = :senderId, permission = :permission, updated_at = NOW() WHERE id = :id", nativeQuery = true)
    void restoreShare(@Param("id") Long id, @Param("senderId") Long senderId, @Param("permission") String permission);

    @Query("SELECT ns FROM NoteShare ns JOIN FETCH ns.note n WHERE ns.receiver.id = :receiverId AND ns.deletedAt IS NULL AND n.deletedAt IS NULL ORDER BY ns.createdAt DESC")
    List<NoteShare> findActiveSharesForReceiver(@Param("receiverId") Long receiverId);
}

