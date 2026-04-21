USE notemanagement;

DELIMITER $$

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
