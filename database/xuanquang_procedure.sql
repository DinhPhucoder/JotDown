USE notemanagement;

DELIMITER $$

-- 1. Đăng ký người dùng
DROP PROCEDURE IF EXISTS sp_RegisterUser$$
CREATE PROCEDURE sp_RegisterUser(
    IN p_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_activation_token VARCHAR(255)
)
BEGIN
    INSERT INTO users (name, email, password, activation_token)
    VALUES (p_name, p_email, p_password_hash, p_activation_token);
END$$

-- 2. Đổi mật khẩu tài khoản
DROP PROCEDURE IF EXISTS sp_ChangeUserPassword$$
CREATE PROCEDURE sp_ChangeUserPassword(
    IN p_user_id INT UNSIGNED,
    IN p_new_password_hash VARCHAR(255)
)
BEGIN
    UPDATE users 
    SET password = p_new_password_hash 
    WHERE id = p_user_id;
END$$

-- 3. Tạo token thiết lập lại mật khẩu
DROP PROCEDURE IF EXISTS sp_CreatePasswordResetToken$$
CREATE PROCEDURE sp_CreatePasswordResetToken(
    IN p_email VARCHAR(255),
    IN p_token VARCHAR(255)
)
BEGIN
    -- Sử dụng ON DUPLICATE KEY UPDATE để cập nhật token nếu email đã tồn tại
    INSERT INTO password_reset_tokens (email, token, created_at)
    VALUES (p_email, p_token, NOW())
    ON DUPLICATE KEY UPDATE 
    token = p_token, 
    created_at = NOW();
END$$

-- 4. Xác thực và đổi mật khẩu (Quên mật khẩu)
DROP PROCEDURE IF EXISTS sp_ResetPassword$$
CREATE PROCEDURE sp_ResetPassword(
    IN p_email VARCHAR(255),
    IN p_new_password_hash VARCHAR(255)
)
BEGIN
    UPDATE users 
    SET password = p_new_password_hash 
    WHERE email = p_email;
    
    -- Xoá token sau khi đổi thành công
    DELETE FROM password_reset_tokens WHERE email = p_email;
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
