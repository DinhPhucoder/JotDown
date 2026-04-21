USE notemanagement;

DELIMITER $$

-- 1. Đăng ký người dùng
DROP PROCEDURE IF EXISTS sp_RegisterUser$$
CREATE PROCEDURE sp_RegisterUser(
    IN p_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255)
)
BEGIN
    INSERT INTO users (name, email, password_hash)
    VALUES (p_name, p_email, p_password_hash);
END$$

-- 2. Đổi mật khẩu tài khoản
DROP PROCEDURE IF EXISTS sp_ChangeUserPassword$$
CREATE PROCEDURE sp_ChangeUserPassword(
    IN p_user_id INT UNSIGNED,
    IN p_new_password_hash VARCHAR(255)
)
BEGIN
    UPDATE users 
    SET password_hash = p_new_password_hash 
    WHERE id = p_user_id;
END$$


-- 5. Bật bảo mật ghi chú (Đặt mật khẩu)
DROP PROCEDURE IF EXISTS sp_SetNotePassword$$
CREATE PROCEDURE sp_SetNotePassword(
    IN p_note_id INT UNSIGNED,
    IN p_password_hash VARCHAR(255)
)
BEGIN
    UPDATE notes 
    SET password = p_password_hash,
        is_protected = 1
    WHERE id = p_note_id;
END$$

-- 6. Tắt bảo mật ghi chú (Xoá mật khẩu)
DROP PROCEDURE IF EXISTS sp_RemoveNotePassword$$
CREATE PROCEDURE sp_RemoveNotePassword(
    IN p_note_id INT UNSIGNED
)
BEGIN
    UPDATE notes 
    SET password = NULL,
        is_protected = 0
    WHERE id = p_note_id;
END$$

-- 7. Đổi mật khẩu ghi chú
DROP PROCEDURE IF EXISTS sp_ChangeNotePassword$$
CREATE PROCEDURE sp_ChangeNotePassword(
    IN p_note_id INT UNSIGNED,
    IN p_new_password_hash VARCHAR(255)
)
BEGIN
    UPDATE notes 
    SET password = p_new_password_hash 
    WHERE id = p_note_id;
END$$

DELIMITER ;
