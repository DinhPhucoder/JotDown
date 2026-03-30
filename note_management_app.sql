-- 1. Khởi tạo Database
CREATE DATABASE IF NOT EXISTS notemanagement;
USE notemanagement;

-- 2. Bảng người dùng (Lưu trữ thông tin và Tùy chỉnh cá nhân)
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL, -- Lưu hash bcrypt 
    is_activated BOOLEAN DEFAULT FALSE,
    font_size INT DEFAULT 14,            -- Tùy chỉnh font 
    theme ENUM('light', 'dark') DEFAULT 'light', -- Tùy chỉnh giao diện 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng ghi chú (Trung tâm của hệ thống)
CREATE TABLE notes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL, -- Chỉ yêu cầu title và content 
    content TEXT,
    color VARCHAR(7) DEFAULT '#ffffff', -- Màu sắc ghi chú 
    is_pinned BOOLEAN DEFAULT FALSE,    -- Tính năng ghim 
    pinned_at TIMESTAMP NULL,           -- Sắp xếp theo thời gian ghim 
    password VARCHAR(255) DEFAULT NULL, -- Khóa ghi chú bằng mật khẩu 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Phục vụ Auto-save 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Bảng hình ảnh đính kèm 
CREATE TABLE note_images (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    note_id INT UNSIGNED NOT NULL,
    image_path VARCHAR(255) NOT NULL, -- Lưu đường dẫn ảnh
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

-- 5. Bảng nhãn dán 
CREATE TABLE labels (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Bảng trung gian Ghi chú - Nhãn 
-- Đảm bảo khi xóa nhãn không mất ghi chú 
CREATE TABLE note_labels (
    note_id INT UNSIGNED NOT NULL,
    label_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (note_id, label_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- 7. Bảng cộng tác/chia sẻ 
CREATE TABLE collaborations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    note_id INT UNSIGNED NOT NULL,
    share_with_user_id INT UNSIGNED NOT NULL, -- ID người nhận 
    permission ENUM('read', 'edit') DEFAULT 'read', -- Quyền xem/sửa 
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (share_with_user_id) REFERENCES users(id) ON DELETE CASCADE
);