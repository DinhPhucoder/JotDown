USE notemanagement;

DELIMITER $$

-- 1. Kiểm tra email người dùng đã tồn tại chưa
DROP FUNCTION IF EXISTS fn_CheckUserExists$$
CREATE FUNCTION fn_CheckUserExists(p_email VARCHAR(255))
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_exists TINYINT(1) DEFAULT 0;
    
    SELECT 1 INTO v_exists 
    FROM users 
    WHERE email = p_email 
    LIMIT 1;
    
    RETURN v_exists;
END$$

-- 2. Kiểm tra tài khoản đã xác thực email chưa
DROP FUNCTION IF EXISTS fn_IsEmailVerified$$
CREATE FUNCTION fn_IsEmailVerified(p_email VARCHAR(255))
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_is_verified TINYINT(1) DEFAULT 0;
    
    SELECT CASE WHEN email_verified_at IS NOT NULL THEN 1 ELSE 0 END INTO v_is_verified 
    FROM users 
    WHERE email = p_email 
    LIMIT 1;
    
    RETURN v_is_verified;
END$$

-- 3. Kiểm tra xem ghi chú có đang bị khóa hay không
DROP FUNCTION IF EXISTS fn_IsNoteProtected$$
CREATE FUNCTION fn_IsNoteProtected(p_note_id INT UNSIGNED)
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_is_protected TINYINT(1) DEFAULT 0;
    
    SELECT is_protected INTO v_is_protected 
    FROM notes 
    WHERE id = p_note_id;
    
    RETURN v_is_protected;
END$$

DELIMITER ;
