-- Consolidated triggers file
-- Nguon: cac file trigger cu

USE notemanagement;

DELIMITER $$

CREATE TRIGGER tr_AfterNoteDelete_Clean
AFTER DELETE ON notes
FOR EACH ROW
BEGIN
    UPDATE note_shares
    SET deleted_at = NOW()
    WHERE note_id = OLD.id
      AND deleted_at IS NULL;

    UPDATE note_attachments
    SET deleted_at = NOW()
    WHERE note_id = OLD.id
      AND deleted_at IS NULL;
END$$

CREATE TRIGGER tr_PreventSelfSharing
BEFORE INSERT ON note_shares
FOR EACH ROW
BEGIN
    IF NEW.sender_id = NEW.receiver_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Can not share notes with myself.';
    END IF;
END$$

CREATE TRIGGER tr_BeforeNoteUpdate_Version
BEFORE UPDATE ON notes
FOR EACH ROW
BEGIN
    IF NEW.title <> OLD.title
       OR COALESCE(NEW.content, '') <> COALESCE(OLD.content, '')
    THEN
        SET NEW.version    = OLD.version + 1;
        SET NEW.updated_at = NOW();
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_BeforeUpdateNoteSecurity$$
CREATE TRIGGER trg_BeforeUpdateNoteSecurity
BEFORE UPDATE ON notes
FOR EACH ROW
BEGIN
    IF NEW.is_protected = 1 AND NEW.password IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Không thể khóa ghi chú (is_protected=1) mà không có password';
    END IF;

    IF NEW.is_protected = 0 AND NEW.password IS NOT NULL THEN
        SET NEW.password = NULL;
    END IF;
END$$

DELIMITER //

CREATE TRIGGER tr_Notes_BeforeUpdate
BEFORE UPDATE ON notes
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;

    IF OLD.is_pinned = 0 AND NEW.is_pinned = 1 THEN
        SET NEW.pinned_at = CURRENT_TIMESTAMP;
    ELSEIF OLD.is_pinned = 1 AND NEW.is_pinned = 0 THEN
        SET NEW.pinned_at = NULL;
    END IF;
END //

DELIMITER ;
