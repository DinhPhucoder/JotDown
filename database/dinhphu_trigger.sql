-- Active: 1775224066074@@127.0.0.1@3306@notemanagement

USE notemanagement;

DELIMITER $$

-- -------------------------------------------------------------
-- TRIGGER 1: tr_AfterNoteDelete_Clean
-- TIMING   : AFTER DELETE ON notes
-- MỤC ĐÍCH : Soft-delete propagation – Khi một note bị xóa (hard
--             delete), tự động đánh dấu deleted_at trên các bảng
--             note_shares và note_attachments liên quan, tránh dữ
--             liệu mồ côi và đảm bảo đồng bộ cho offline/PWA sync.
-- GHI CHÚ  : note_shares và note_attachments có FK ON DELETE CASCADE,
--             nhưng trigger này phục vụ soft-delete logic riêng biệt
--             (bản ghi vẫn tồn tại trong DB với deleted_at được điền).
-- -------------------------------------------------------------
CREATE TRIGGER tr_AfterNoteDelete_Clean
AFTER DELETE ON notes
FOR EACH ROW
BEGIN
    -- Đánh dấu soft delete cho tất cả share records của note vừa bị xóa
    UPDATE note_shares
    SET deleted_at = NOW()
    WHERE note_id = OLD.id
      AND deleted_at IS NULL;

    -- Đánh dấu soft delete cho tất cả attachment records của note vừa bị xóa
    UPDATE note_attachments
    SET deleted_at = NOW()
    WHERE note_id = OLD.id
      AND deleted_at IS NULL;
END$$

-- -------------------------------------------------------------
-- TRIGGER 2: tr_PreventSelfSharing
-- TIMING   : BEFORE INSERT ON note_shares
-- MỤC ĐÍCH : Ngăn chặn người dùng tự chia sẻ ghi chú cho chính
--             mình (sender_id = receiver_id), tránh gây lỗi logic
--             trên UI và dữ liệu rác trong bảng note_shares.
-- GHI CHÚ  : receiver_id là INT (FK → users.id), so sánh trực tiếp
--             với sender_id mà không cần JOIN, hiệu suất tối ưu.
-- -------------------------------------------------------------
CREATE TRIGGER tr_PreventSelfSharing
BEFORE INSERT ON note_shares
FOR EACH ROW
BEGIN
    IF NEW.sender_id = NEW.receiver_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Can not share notes with myself.';
    END IF;
END$$

-- -------------------------------------------------------------
-- TRIGGER 3: tr_BeforeNoteUpdate_Version
-- TIMING   : BEFORE UPDATE ON notes
-- MỤC ĐÍCH : Tự động tăng version lên 1 và cập nhật updated_at
--             thành NOW() mỗi khi title hoặc content của note thay
--             đổi. Các thay đổi khác (is_pinned, color, is_protected,
--             deleted_at...) KHÔNG kích hoạt tăng version.
-- GHI CHÚ  : Sử dụng COALESCE để xử lý trường hợp content = NULL,
--             tránh so sánh NULL gây ra kết quả UNKNOWN thay vì TRUE.
-- -------------------------------------------------------------
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

DELIMITER;