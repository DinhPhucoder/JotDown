USE notemanagement;

DELIMITER $$

-- 1. Gửi thông báo khi chia sẻ ghi chú
DROP TRIGGER IF EXISTS trg_AfterInsertNoteShare$$
CREATE TRIGGER trg_AfterInsertNoteShare
AFTER INSERT ON note_shares
FOR EACH ROW
BEGIN
    -- Lưu sự kiện share vào hàng đợi sync_queue để backend xử lý gửi email
    INSERT INTO sync_queue (user_id, action, entity_id, payload)
    VALUES (
        NEW.sender_id,
        'CREATE',
        NEW.id,
        JSON_OBJECT(
            'event', 'note_shared',
            'note_id', NEW.note_id,
            'receiver_email', NEW.receiver_id,
            'permission', NEW.permission
        )
    );
END$$

-- 2. Đảm bảo tính toàn vẹn khi khoá ghi chú (trước khi update notes)
DROP TRIGGER IF EXISTS trg_BeforeUpdateNoteSecurity$$
CREATE TRIGGER trg_BeforeUpdateNoteSecurity
BEFORE UPDATE ON notes
FOR EACH ROW
BEGIN
    -- Nếu chuyển trạng thái sang khóa (1) nhưng không có password thì không cho phép
    IF NEW.is_protected = 1 AND NEW.password IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Không thể khóa ghi chú (is_protected=1) mà không có password';
    END IF;
    
    -- Nếu chuyển trạng thái sang không khóa (0) thì tự động xóa mật khẩu
    IF NEW.is_protected = 0 AND NEW.password IS NOT NULL THEN
        SET NEW.password = NULL;
    END IF;
END$$

DELIMITER ;
