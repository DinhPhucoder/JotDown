-- Active: 1775224066074@@127.0.0.1@3306@notemanagement
USE notemanagement;

DELIMITER $$

-- ---------------------------------------------------------------
-- PROCEDURE 1: sp_ShareNoteWithValidation
-- INPUT : p_note_id        INT      – ID của ghi chú cần share
--         p_sender_id      INT      – ID chủ sở hữu (người share)
--         p_receiver_email VARCHAR  – Email người nhận
--         p_permission     ENUM     – 'READ' hoặc 'EDIT'
-- LOGIC :
--   1. Tìm receiver_id từ email → lỗi nếu email không tồn tại
--   2. Kiểm tra đã share chưa:
--      - Nếu rồi  → UPDATE permission
--      - Nếu chưa → INSERT bản ghi mới
-- ---------------------------------------------------------------
CREATE PROCEDURE sp_ShareNoteWithValidation(
    IN p_note_id        INT UNSIGNED,
    IN p_sender_id      INT UNSIGNED,
    IN p_receiver_email VARCHAR(255),
    IN p_permission     ENUM('READ', 'EDIT')
)
BEGIN
    DECLARE v_receiver_id  INT UNSIGNED DEFAULT NULL;
    DECLARE v_existing_id  INT UNSIGNED DEFAULT NULL;

    -- Bước 1: Resolve email → user ID
    SELECT id INTO v_receiver_id
    FROM users
    WHERE email = p_receiver_email
    LIMIT 1;

    IF v_receiver_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Email does not exist in the system.';
    END IF;

    -- Bước 2: Kiểm tra đã share chưa (kể cả record đã soft-delete)
    SELECT id INTO v_existing_id
    FROM note_shares
    WHERE note_id   = p_note_id
      AND sender_id = p_sender_id
      AND receiver_id = v_receiver_id
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Đã share → cập nhật permission và xóa soft-delete (khôi phục nếu đã revoke)
        UPDATE note_shares
        SET permission = p_permission,
            deleted_at = NULL,
            updated_at = NOW()
        WHERE id = v_existing_id;
    ELSE
        -- Chưa share → tạo mới
        INSERT INTO note_shares (note_id, sender_id, receiver_id, permission)
        VALUES (p_note_id, p_sender_id, v_receiver_id, p_permission);
    END IF;
END$$

-- ---------------------------------------------------------------
-- PROCEDURE 2: sp_GetRecipientSharedNotes
-- INPUT : p_receiver_id INT – ID của người nhận
-- OUTPUT: Danh sách ghi chú được chia sẻ kèm thông tin chi tiết:
--         note_id, title, content, shared_by_name, shared_by_email,
--         permission, shared_at
-- LOGIC : JOIN note_shares → notes → users (sender)
--         Lọc deleted_at IS NULL ở cả note_shares và notes
-- ---------------------------------------------------------------
CREATE PROCEDURE sp_GetRecipientSharedNotes(
    IN p_receiver_id INT UNSIGNED
)
BEGIN
    SELECT
        n.id              AS note_id,
        n.title,
        n.content,
        u.name            AS shared_by_name,
        u.email           AS shared_by_email,
        ns.permission,
        ns.created_at     AS shared_at
    FROM note_shares  ns
    JOIN notes        n  ON ns.note_id   = n.id
    JOIN users        u  ON ns.sender_id = u.id
    WHERE ns.receiver_id = p_receiver_id
      AND ns.deleted_at  IS NULL
      AND n.deleted_at   IS NULL
    ORDER BY ns.created_at DESC;
END$$

-- ---------------------------------------------------------------
-- PROCEDURE 3: sp_RevokeAllShares
-- INPUT : p_note_id   INT – ID ghi chú cần thu hồi toàn bộ share
--         p_owner_id  INT – ID chủ sở hữu (để xác minh quyền)
-- LOGIC :
--   1. Kiểm tra p_owner_id có thực sự là chủ của p_note_id không
--      → Lỗi nếu không đúng
--   2. Soft DELETE tất cả share records của note đó
--      (đặt deleted_at = NOW() thay vì DELETE vật lý)
-- ---------------------------------------------------------------
CREATE PROCEDURE sp_RevokeAllShares(
    IN p_note_id  INT UNSIGNED,
    IN p_owner_id INT UNSIGNED
)
BEGIN
    DECLARE v_note_exists INT DEFAULT 0;

    -- Bước 1: Xác minh quyền sở hữu
    SELECT COUNT(*) INTO v_note_exists
    FROM notes
    WHERE id      = p_note_id
      AND user_id = p_owner_id
      AND deleted_at IS NULL;

    IF v_note_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'You do not have permission to perform this action.';
    END IF;

    -- Bước 2: Soft delete tất cả share records
    UPDATE note_shares
    SET deleted_at = NOW()
    WHERE note_id  = p_note_id
      AND deleted_at IS NULL;
END$$

-- ---------------------------------------------------------------
-- PROCEDURE 4: sp_BulkSyncQueue
-- INPUT : p_user_id INT  – ID của user thực hiện sync
--         p_payload JSON – Mảng JSON các thay đổi cần đồng bộ
-- FORMAT JSON:
--   [
--     { "action": "CREATE", "entity_id": null, "data": { "title": "...", "content": "..." } },
--     { "action": "UPDATE", "entity_id": 5,    "data": { "title": "New title" } },
--     { "action": "DELETE", "entity_id": 7,    "data": null }
--   ]
-- LOGIC :
--   Lặp qua từng item trong JSON array, thực thi CREATE/UPDATE/DELETE
--   Toàn bộ wrapped trong TRANSACTION: 1 item lỗi → ROLLBACK tất cả
-- ---------------------------------------------------------------
CREATE PROCEDURE sp_BulkSyncQueue(
    IN p_user_id INT UNSIGNED,
    IN p_payload  JSON
)
BEGIN
    DECLARE v_total    INT DEFAULT 0;
    DECLARE v_index    INT DEFAULT 0;
    DECLARE v_action   VARCHAR(10);
    DECLARE v_entity_id INT UNSIGNED;
    DECLARE v_title    VARCHAR(255);
    DECLARE v_content  TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET v_total = JSON_LENGTH(p_payload);

    START TRANSACTION;

    WHILE v_index < v_total DO
        SET v_action    = JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$[', v_index, '].action')));
        SET v_entity_id = JSON_EXTRACT(p_payload, CONCAT('$[', v_index, '].entity_id'));
        SET v_title     = JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$[', v_index, '].data.title')));
        SET v_content   = JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$[', v_index, '].data.content')));

        CASE v_action
            WHEN 'CREATE' THEN
                INSERT INTO notes (user_id, title, content)
                VALUES (p_user_id, v_title, v_content);

            WHEN 'UPDATE' THEN
                UPDATE notes
                SET title   = COALESCE(v_title,   title),
                    content = COALESCE(v_content, content)
                WHERE id      = v_entity_id
                  AND user_id = p_user_id
                  AND deleted_at IS NULL;

            WHEN 'DELETE' THEN
                UPDATE notes
                SET deleted_at = NOW()
                WHERE id      = v_entity_id
                  AND user_id = p_user_id
                  AND deleted_at IS NULL;

            ELSE
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Invalid action in sync payload.';
        END CASE;

        DELETE FROM sync_queue
        WHERE user_id   = p_user_id
          AND action    = v_action
          AND entity_id = COALESCE(v_entity_id, 0)
        LIMIT 1;

        SET v_index = v_index + 1;
    END WHILE;

    COMMIT;
END$$

DELIMITER;