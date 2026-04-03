DELIMITER //

-- =============================================
-- 1. TRIGGER TRƯỚC KHI CẬP NHẬT (BEFORE UPDATE)
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


-- =============================================
-- 2. NHÓM TRIGGER ĐỒNG BỘ HÓA (AFTER INSERT/UPDATE/DELETE)
-- Mục tiêu: Tự động đẩy dữ liệu vào sync_queue cho Smartphone/Tablet
-- =============================================

-- Tự động log khi có ghi chú MỚI
CREATE TRIGGER tr_Notes_AfterInsert_Sync
AFTER INSERT ON notes
FOR EACH ROW
BEGIN
    INSERT INTO sync_queue (user_id, action, entity_id, payload)
    VALUES (NEW.user_id, 'CREATE', NEW.id, 
            JSON_OBJECT('title', NEW.title, 'color', NEW.color, 'created_at', NEW.created_at));
END //

-- Tự động log khi CẬP NHẬT (Phục vụ Auto-save và đổi màu)
CREATE TRIGGER tr_Notes_AfterUpdate_Sync
AFTER UPDATE ON notes
FOR EACH ROW
BEGIN
    INSERT INTO sync_queue (user_id, action, entity_id, payload)
    VALUES (NEW.user_id, 'UPDATE', NEW.id, 
            JSON_OBJECT('title', NEW.title, 'content', NEW.content, 'is_pinned', NEW.is_pinned));
END //

-- Tự động log khi XÓA
CREATE TRIGGER tr_Notes_AfterDelete_Sync
AFTER DELETE ON notes
FOR EACH ROW
BEGIN
    INSERT INTO sync_queue (user_id, action, entity_id, payload)
    VALUES (OLD.user_id, 'DELETE', OLD.id, NULL);
END //


-- =============================================
-- 3. TRIGGER BẢO MẬT & NHÃN (LABEL SAFETY)
-- Mục tiêu: Kiểm soát dữ liệu liên quan
-- =============================================

-- Tự động cập nhật số lượng hoặc kiểm tra khi gán nhãn (Tùy chọn mở rộng)
CREATE TRIGGER tr_NoteLabels_AfterInsert
AFTER INSERT ON note_labels
FOR EACH ROW
BEGIN
    
END //

DELIMITER ;
