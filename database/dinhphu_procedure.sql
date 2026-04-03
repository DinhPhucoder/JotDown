DELIMITER //
-- Lấy danh sách ghi chú cho HomePage (Hỗ trợ Grid/List View)
-- Ưu tiên Ghim (Pin) -> Thời gian Ghim -> Thời gian cập nhật mới nhất
CREATE PROCEDURE sp_ManageNotes_GetHome(IN p_user_id INT)
BEGIN
    SELECT * FROM notes 
    WHERE user_id = p_user_id 
    ORDER BY is_pinned DESC, pinned_at DESC, updated_at DESC;
END //

-- Khởi tạo ghi chú mới 
CREATE PROCEDURE sp_ManageNotes_Init(IN p_user_id INT)
BEGIN
    INSERT INTO notes (user_id, title, content, color) VALUES (p_user_id, '', '', '#ffffff');
    SELECT LAST_INSERT_ID() AS note_id;
END //

-- Cập nhật liên tục khi người dùng đang nhập liệu
CREATE PROCEDURE sp_ManageNotes_AutoSave(
    IN p_note_id INT, 
    IN p_title VARCHAR(255), 
    IN p_content TEXT
)
BEGIN
    UPDATE notes SET title = p_title, content = p_content WHERE id = p_note_id;
END //

-- Xóa ghi chú 
CREATE PROCEDURE sp_ManageNotes_Delete(IN p_note_id INT)
BEGIN
    DELETE FROM notes WHERE id = p_note_id;
END //

-- Bật/Tắt Ghim ghi chú 
CREATE PROCEDURE sp_Organize_TogglePin(IN p_note_id INT)
BEGIN
    UPDATE notes SET is_pinned = NOT is_pinned WHERE id = p_note_id;
END //

--Tìm kiếm với độ trễ 300ms 
CREATE PROCEDURE sp_Organize_Search(IN p_user_id INT, IN p_keyword VARCHAR(255))
BEGIN
    SELECT * FROM notes 
    WHERE user_id = p_user_id 
      AND (title LIKE CONCAT('%', p_keyword, '%') OR content LIKE CONCAT('%', p_keyword, '%'))
    ORDER BY is_pinned DESC, updated_at DESC;
END //

-- Lọc ghi chú theo Nhãn 
CREATE PROCEDURE sp_Organize_FilterByLabel(IN p_user_id INT, IN p_label_id INT)
BEGIN
    SELECT n.* FROM notes n
    INNER JOIN note_labels nl ON n.id = nl.note_id
    WHERE n.user_id = p_user_id AND nl.label_id = p_label_id
    ORDER BY n.is_pinned DESC, n.updated_at DESC;
END //

-- Đổi màu sắc Card ghi chú 
CREATE PROCEDURE sp_UI_UpdateNoteColor(IN p_note_id INT, IN p_color VARCHAR(7))
BEGIN
    UPDATE notes SET color = p_color WHERE id = p_note_id;
END //

-- Lưu cài đặt cá nhân (Dark Mode, Font Size) vào JSON Preferences
CREATE PROCEDURE sp_UI_UpdateSettings(
    IN p_user_id INT, 
    IN p_key VARCHAR(50), 
    IN p_value VARCHAR(100)
)
BEGIN
    UPDATE users 
    SET preferences = JSON_SET(IFNULL(preferences, '{}'), CONCAT('$.', p_key), p_value)
    WHERE id = p_user_id;
END //

DELIMITER ;
