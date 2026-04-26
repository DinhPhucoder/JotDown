-- Consolidated procedures file
-- Nguon: cac file procedure cu

USE notemanagement;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_ShareNoteWithValidation$$
CREATE PROCEDURE sp_ShareNoteWithValidation(
    IN p_note_id BIGINT UNSIGNED,
    IN p_sender_id BIGINT UNSIGNED,
    IN p_receiver_email VARCHAR(255),
    IN p_permission ENUM('READ', 'EDIT')
)
BEGIN
    DECLARE v_receiver_id BIGINT UNSIGNED DEFAULT NULL;
    DECLARE v_existing_id BIGINT UNSIGNED DEFAULT NULL;
    DECLARE v_note_owner_id BIGINT UNSIGNED DEFAULT NULL;

    SELECT id INTO v_receiver_id
    FROM users
    WHERE email = p_receiver_email
    LIMIT 1;

    IF v_receiver_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Email does not exist in the system.';
    END IF;

    SELECT user_id INTO v_note_owner_id
    FROM notes
    WHERE id = p_note_id
      AND deleted_at IS NULL
    LIMIT 1;

    IF v_note_owner_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Note does not exist or has been deleted.';
    END IF;

    IF v_note_owner_id <> p_sender_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'You do not have permission to share this note.';
    END IF;

    SELECT id INTO v_existing_id
    FROM note_shares
    WHERE note_id = p_note_id
      AND sender_id = p_sender_id
      AND receiver_id = v_receiver_id
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        UPDATE note_shares
        SET permission = p_permission,
            deleted_at = NULL,
            updated_at = NOW()
        WHERE id = v_existing_id;
    ELSE
        INSERT INTO note_shares (note_id, sender_id, receiver_id, permission)
        VALUES (p_note_id, p_sender_id, v_receiver_id, p_permission);
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_GetRecipientSharedNotes$$
CREATE PROCEDURE sp_GetRecipientSharedNotes(
    IN p_receiver_id BIGINT UNSIGNED
)
BEGIN
    SELECT
        n.id AS note_id,
        n.title,
        n.content,
        u.name AS shared_by_name,
        u.email AS shared_by_email,
        ns.permission,
        ns.created_at AS shared_at
    FROM note_shares ns
    JOIN notes n ON ns.note_id = n.id
    JOIN users u ON ns.sender_id = u.id
    WHERE ns.receiver_id = p_receiver_id
      AND ns.deleted_at IS NULL
      AND n.deleted_at IS NULL
    ORDER BY ns.created_at DESC;
END$$

DROP PROCEDURE IF EXISTS sp_RevokeAllShares$$
CREATE PROCEDURE sp_RevokeAllShares(
    IN p_note_id BIGINT UNSIGNED,
    IN p_owner_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_note_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_note_exists
    FROM notes
    WHERE id = p_note_id
      AND user_id = p_owner_id
      AND deleted_at IS NULL;

    IF v_note_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'You do not have permission to perform this action.';
    END IF;

    UPDATE note_shares
    SET deleted_at = NOW()
    WHERE note_id = p_note_id
      AND deleted_at IS NULL;
END$$

DROP PROCEDURE IF EXISTS sp_BulkSyncQueue$$
CREATE PROCEDURE sp_BulkSyncQueue(
    IN p_user_id BIGINT UNSIGNED,
    IN p_payload JSON
)
BEGIN
    DECLARE v_total INT DEFAULT 0;
    DECLARE v_index INT DEFAULT 0;
    DECLARE v_action VARCHAR(10);
    DECLARE v_entity_id BIGINT UNSIGNED;
    DECLARE v_title VARCHAR(255);
    DECLARE v_content TEXT;
    DECLARE v_queue_id BIGINT UNSIGNED DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET v_total = COALESCE(JSON_LENGTH(p_payload), 0);

    START TRANSACTION;

    WHILE v_index < v_total DO
        SET v_action = UPPER(JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$[', v_index, '].action'))));
        SET v_entity_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$[', v_index, '].entity_id'))) AS UNSIGNED);
        SET v_title = JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$[', v_index, '].data.title')));
        SET v_content = JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$[', v_index, '].data.content')));

        CASE v_action
            WHEN 'CREATE' THEN
                INSERT INTO notes (user_id, title, content)
                VALUES (p_user_id, v_title, v_content);

            WHEN 'UPDATE' THEN
                UPDATE notes
                SET title = COALESCE(v_title, title),
                    content = COALESCE(v_content, content)
                WHERE id = v_entity_id
                  AND user_id = p_user_id
                  AND deleted_at IS NULL;

            WHEN 'DELETE' THEN
                UPDATE notes
                SET deleted_at = NOW()
                WHERE id = v_entity_id
                  AND user_id = p_user_id
                  AND deleted_at IS NULL;

            ELSE
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Invalid action in sync payload.';
        END CASE;

        SET v_queue_id = NULL;

        SELECT id INTO v_queue_id
        FROM sync_queue
        WHERE user_id = p_user_id
          AND action = v_action
          AND entity_id = COALESCE(v_entity_id, 0)
        ORDER BY id ASC
        LIMIT 1;

        IF v_queue_id IS NOT NULL THEN
            DELETE FROM sync_queue
            WHERE id = v_queue_id;
        END IF;

        SET v_index = v_index + 1;
    END WHILE;

    COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_RegisterUser$$
CREATE PROCEDURE sp_RegisterUser(
    IN p_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255)
)
BEGIN
    INSERT INTO users (name, email, password)
    VALUES (p_name, p_email, p_password);
END$$

DROP PROCEDURE IF EXISTS sp_ChangeUserPassword$$
CREATE PROCEDURE sp_ChangeUserPassword(
    IN p_user_id BIGINT UNSIGNED,
    IN p_new_password VARCHAR(255)
)
BEGIN
    UPDATE users
    SET password = p_new_password
    WHERE id = p_user_id;
END$$

DROP PROCEDURE IF EXISTS sp_SetNotePassword$$
CREATE PROCEDURE sp_SetNotePassword(
    IN p_note_id BIGINT UNSIGNED,
    IN p_password VARCHAR(255)
)
BEGIN
    UPDATE notes
    SET password = p_password,
        is_protected = 1
    WHERE id = p_note_id
      AND deleted_at IS NULL;
END$$

DROP PROCEDURE IF EXISTS sp_RemoveNotePassword$$
CREATE PROCEDURE sp_RemoveNotePassword(
    IN p_note_id BIGINT UNSIGNED
)
BEGIN
    UPDATE notes
    SET password = NULL,
        is_protected = 0
    WHERE id = p_note_id
      AND deleted_at IS NULL;
END$$

DROP PROCEDURE IF EXISTS sp_ChangeNotePassword$$
CREATE PROCEDURE sp_ChangeNotePassword(
    IN p_note_id BIGINT UNSIGNED,
    IN p_new_password VARCHAR(255)
)
BEGIN
    UPDATE notes
    SET password = p_new_password
    WHERE id = p_note_id
      AND deleted_at IS NULL;
END$$

DROP PROCEDURE IF EXISTS sp_ManageNotes_GetHome$$
CREATE PROCEDURE sp_ManageNotes_GetHome(IN p_user_id BIGINT UNSIGNED)
BEGIN
    SELECT *
    FROM notes
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
    ORDER BY is_pinned DESC, pinned_at DESC, updated_at DESC;
END$$

DROP PROCEDURE IF EXISTS sp_ManageNotes_Init$$
CREATE PROCEDURE sp_ManageNotes_Init(IN p_user_id BIGINT UNSIGNED)
BEGIN
    INSERT INTO notes (user_id, title, content, color)
    VALUES (p_user_id, '', '', '#ffffff');

    SELECT LAST_INSERT_ID() AS note_id;
END$$

DROP PROCEDURE IF EXISTS sp_ManageNotes_AutoSave$$
CREATE PROCEDURE sp_ManageNotes_AutoSave(
    IN p_note_id BIGINT UNSIGNED,
    IN p_title VARCHAR(255),
    IN p_content TEXT
)
BEGIN
    UPDATE notes
    SET title = p_title,
        content = p_content
    WHERE id = p_note_id
      AND deleted_at IS NULL;
END$$

DROP PROCEDURE IF EXISTS sp_ManageNotes_Delete$$
CREATE PROCEDURE sp_ManageNotes_Delete(IN p_note_id BIGINT UNSIGNED)
BEGIN
    UPDATE notes
    SET deleted_at = NOW()
    WHERE id = p_note_id
      AND deleted_at IS NULL;
END$$

DROP PROCEDURE IF EXISTS sp_Organize_TogglePin$$
CREATE PROCEDURE sp_Organize_TogglePin(IN p_note_id BIGINT UNSIGNED)
BEGIN
    UPDATE notes
    SET is_pinned = NOT is_pinned
    WHERE id = p_note_id
      AND deleted_at IS NULL;
END$$

DROP PROCEDURE IF EXISTS sp_Organize_Search$$
CREATE PROCEDURE sp_Organize_Search(
    IN p_user_id BIGINT UNSIGNED,
    IN p_keyword VARCHAR(255)
)
BEGIN
    SELECT *
    FROM notes
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
      AND (
          title LIKE CONCAT('%', p_keyword, '%')
          OR content LIKE CONCAT('%', p_keyword, '%')
      )
    ORDER BY is_pinned DESC, updated_at DESC;
END$$

DROP PROCEDURE IF EXISTS sp_Organize_FilterByLabel$$
CREATE PROCEDURE sp_Organize_FilterByLabel(
    IN p_user_id BIGINT UNSIGNED,
    IN p_label_id BIGINT UNSIGNED
)
BEGIN
    SELECT n.*
    FROM notes n
    INNER JOIN note_labels nl ON n.id = nl.note_id
    WHERE n.user_id = p_user_id
      AND n.deleted_at IS NULL
      AND nl.label_id = p_label_id
    ORDER BY n.is_pinned DESC, n.updated_at DESC;
END$$

DROP PROCEDURE IF EXISTS sp_UI_UpdateNoteColor$$
CREATE PROCEDURE sp_UI_UpdateNoteColor(
    IN p_note_id BIGINT UNSIGNED,
    IN p_color VARCHAR(7)
)
BEGIN
    UPDATE notes
    SET color = p_color
    WHERE id = p_note_id
      AND deleted_at IS NULL;
END$$

DROP PROCEDURE IF EXISTS sp_UI_UpdateSettings$$
CREATE PROCEDURE sp_UI_UpdateSettings(
    IN p_user_id BIGINT UNSIGNED,
    IN p_key VARCHAR(50),
    IN p_value VARCHAR(100)
)
BEGIN
    UPDATE users
    SET preferences = JSON_SET(IFNULL(preferences, '{}'), CONCAT('$.', p_key), p_value)
    WHERE id = p_user_id;
END$$

DELIMITER ;
