DELIMITER //

-- =============================================
-- Mục tiêu: Tự động hóa thời gian và logic Ghim (Pin)
-- =============================================
CREATE TRIGGER tr_Notes_BeforeUpdate
BEFORE UPDATE ON notes
FOR EACH ROW
BEGIN
    -- [Tính năng Auto-save]: Luôn cập nhật mốc thời gian sửa đổi mới nhất
    SET NEW.updated_at = CURRENT_TIMESTAMP;

    -- [Tính năng Pin]: Xử lý logic ghim ghi chú
    -- Nếu người dùng bật Ghim (is_pinned: 0 -> 1)
    IF OLD.is_pinned = 0 AND NEW.is_pinned = 1 THEN
        SET NEW.pinned_at = CURRENT_TIMESTAMP;
    -- Nếu người dùng bỏ Ghim (is_pinned: 1 -> 0)
    ELSEIF OLD.is_pinned = 1 AND NEW.is_pinned = 0 THEN
        SET NEW.pinned_at = NULL;
    END IF;
END //
