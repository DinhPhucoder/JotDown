DROP TRIGGER IF EXISTS tr_AfterNoteDelete_Clean;
-- @@
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
END;
-- @@
DROP TRIGGER IF EXISTS tr_PreventSelfSharing;
-- @@
CREATE TRIGGER tr_PreventSelfSharing
BEFORE INSERT ON note_shares
FOR EACH ROW
BEGIN
    IF NEW.sender_id = NEW.receiver_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot share notes with yourself.';
    END IF;
END;
-- @@
DROP TRIGGER IF EXISTS tr_PreventSelfSharing_Update;
-- @@
CREATE TRIGGER tr_PreventSelfSharing_Update
BEFORE UPDATE ON note_shares
FOR EACH ROW
BEGIN
    IF NEW.sender_id = NEW.receiver_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot share notes with yourself.';
    END IF;
END;
-- @@
DROP TRIGGER IF EXISTS tr_BeforeNoteUpdate_Version;
-- @@
DROP TRIGGER IF EXISTS trg_BeforeUpdateNoteSecurity;
-- @@
DROP TRIGGER IF EXISTS tr_Notes_BeforeUpdate;
-- @@
CREATE TRIGGER tr_Notes_BeforeUpdate
BEFORE UPDATE ON notes
FOR EACH ROW
BEGIN
    IF NEW.is_protected = 1 AND (NEW.password IS NULL OR CHAR_LENGTH(TRIM(NEW.password)) = 0) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot lock note without password.';
    END IF;

    IF NEW.is_protected = 0 AND NEW.password IS NOT NULL THEN
        SET NEW.password = NULL;
    END IF;

    SET NEW.updated_at = CURRENT_TIMESTAMP;

    IF OLD.is_pinned = 0 AND NEW.is_pinned = 1 THEN
        SET NEW.pinned_at = CURRENT_TIMESTAMP;
    ELSEIF OLD.is_pinned = 1 AND NEW.is_pinned = 0 THEN
        SET NEW.pinned_at = NULL;
    END IF;

    IF NEW.title <> OLD.title
       OR COALESCE(NEW.content, '') <> COALESCE(OLD.content, '')
    THEN
        SET NEW.version = COALESCE(OLD.version, 0) + 1;
    END IF;
END;
