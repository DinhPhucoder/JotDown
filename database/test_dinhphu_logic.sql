-- Active: 1775224066074@@127.0.0.1@3306@notemanagement
-- =============================================================
-- FILE: test_dinhphu_logic.sql
-- MÔ TẢ: Test script cho các triggers và procedures
-- HƯỚNG DẪN: Chạy từng block một để kiểm tra kết quả
-- =============================================================
CREATE DATABASE IF NOT EXISTS notemanagement;

USE notemanagement;

-- =============================================================
-- 0. CẤU TRÚC BẢNG (Dùng cho môi trường test)
-- =============================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `note_labels`;

DROP TABLE IF EXISTS `note_shares`;

DROP TABLE IF EXISTS `note_attachments`;

DROP TABLE IF EXISTS `note_images`;

DROP TABLE IF EXISTS `notes`;

DROP TABLE IF EXISTS `labels`;

DROP TABLE IF EXISTS `users`;

DROP TABLE IF EXISTS `sync_queue`;

DROP TABLE IF EXISTS `password_reset_tokens`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `users` (
    `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    `avatar` varchar(255) DEFAULT NULL,
    `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
    `activation_token` varchar(255) DEFAULT NULL,
    `email_verified_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `notes` (
    `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` int(10) UNSIGNED NOT NULL,
    `title` varchar(255) NOT NULL,
    `content` text DEFAULT NULL,
    `color` varchar(7) DEFAULT '#ffffff',
    `is_pinned` tinyint(1) DEFAULT 0,
    `pinned_at` timestamp NULL DEFAULT NULL,
    `password` varchar(255) DEFAULT NULL,
    `is_protected` tinyint(1) DEFAULT 0,
    `version` int(10) UNSIGNED DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `note_shares` (
    `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `note_id` int(10) UNSIGNED NOT NULL,
    `sender_id` int(10) UNSIGNED NOT NULL,
    `receiver_id` int(10) UNSIGNED NOT NULL,
    `permission` enum('READ', 'EDIT') NOT NULL DEFAULT 'READ',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_noteshare_note` (`note_id`),
    KEY `fk_noteshare_sender` (`sender_id`),
    KEY `fk_noteshare_receiver` (`receiver_id`),
    CONSTRAINT `fk_noteshare_note` FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_noteshare_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_noteshare_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `note_attachments` (
    `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `note_id` int(10) UNSIGNED NOT NULL,
    `file_path` varchar(255) NOT NULL,
    `attachment_kind` enum('IMAGE', 'FILE') NOT NULL DEFAULT 'FILE',
    `original_name` varchar(255) DEFAULT NULL,
    `file_type` varchar(50) DEFAULT NULL,
    `file_size` int(10) UNSIGNED DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `note_id` (`note_id`),
    CONSTRAINT `note_attachments_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `sync_queue` (
    `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` int(10) UNSIGNED NOT NULL,
    `action` enum('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `entity_id` int(10) UNSIGNED NOT NULL,
    `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `fk_syncqueue_user` (`user_id`),
    CONSTRAINT `fk_syncqueue_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- =============================================================
-- 1. TẠO MOCK DATA
-- =============================================================
-- Xóa data cũ để test sạch (Cẩn thận nếu đang ở DB Prod)
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE users;

TRUNCATE TABLE notes;

TRUNCATE TABLE note_shares;

TRUNCATE TABLE note_attachments;

TRUNCATE TABLE sync_queue;

SET FOREIGN_KEY_CHECKS = 1;

-- Thêm 3 User giả lập
INSERT INTO
    users (id, name, email, password)
VALUES (
        1,
        'Alice Owner',
        'alice@example.com',
        'hashed_pass_1'
    ),
    (
        2,
        'Bob Receiver',
        'bob@example.com',
        'hashed_pass_2'
    ),
    (
        3,
        'Charlie Guest',
        'charlie@example.com',
        'hashed_pass_3'
    );

-- Thêm 2 Note cho Alice
INSERT INTO
    notes (id, user_id, title, content)
VALUES (
        1,
        1,
        'Kế hoạch học tập',
        'Cần học Laravel và ReactJS'
    ),
    (
        2,
        1,
        'Mật khẩu wifi',
        'Pass: 12345678'
    );

-- Thêm 1 attachment cho note 1
INSERT INTO
    note_attachments (
        id,
        note_id,
        file_path,
        original_name
    )
VALUES (
        1,
        1,
        '/uploads/plan.pdf',
        'plan.pdf'
    );

-- =============================================================
-- 2. TEST MỤC 1: tr_BeforeNoteUpdate_Version
-- =============================================================
-- Test Case 2.1: Update title/content -> Version tăng
UPDATE notes SET content = 'JHEHEHE' WHERE id = 2;

-- Test Case 2.2: Update field khác (is_pinned) -> Version KHÔNG tăng
UPDATE notes SET is_pinned = 1 WHERE id = 1;

SELECT id, title, content, version, is_pinned
FROM notes
WHERE
    id = 1;

-- =============================================================
-- 3. TEST MỤC 2: tr_PreventSelfSharing & sp_ShareNoteWithValidation
-- =============================================================
-- Test Case 3.1: Alice tự share cho chính email của mình
-- 🔔 EXPECTED ERROR: "Không thể chia sẻ ghi chú cho chính mình."
-- Bỏ comment dòng dưới để test lỗi:
CALL sp_ShareNoteWithValidation ( 1, 1, 'alice@example.com', 'READ' );

-- Test Case 3.2: Share cho email không tồn tại
-- 🔔 EXPECTED ERROR: "Email không tồn tại trong hệ thống."
-- Bỏ comment dòng dưới để test lỗi:
CALL sp_ShareNoteWithValidation ( 1, 1, 'ghost@example.com', 'READ' );

-- Test Case 3.3: Alice share đúng cho Bob (READ)
CALL sp_ShareNoteWithValidation ( 1, 1, 'bob@example.com', 'READ' );

-- Test Case 3.4: Alice đổi quyền cho Bob (EDIT) - Test update
CALL sp_ShareNoteWithValidation ( 1, 1, 'bob@example.com', 'EDIT' );

-- Test Case 3.5: Alice share note 2 cho Charlie (READ)
CALL sp_ShareNoteWithValidation (
    2,
    1,
    'charlie@example.com',
    'READ'
);

SELECT * FROM note_shares;
-- 🔔 EXPECTED: 2 records (1 cho Bob, 1 cho Charlie). Record của Bob có permission = 'EDIT'.

-- =============================================================
-- 4. TEST MỤC 3: sp_GetRecipientSharedNotes
-- =============================================================
-- Test Case 4.1: Lấy danh sách note được share cho Bob (ID = 2)
CALL sp_GetRecipientSharedNotes (2);
-- 🔔 EXPECTED: Trả về 1 record (Note 1) kèm tên người share là "Alice Owner"

-- =============================================================
-- 5. TEST MỤC 4: sp_RevokeAllShares
-- =============================================================
-- Test Case 5.1: Thu hồi toàn bộ quyền chia sẻ của Note 2
CALL sp_RevokeAllShares (2, 1);

SELECT * FROM note_shares WHERE note_id = 2;
-- 🔔 EXPECTED: deleted_at sẽ có timestamp thay vì NULL (Soft Delete)

-- Test Case 5.2: Kiểm tra lại danh sách note của Charlie
CALL sp_GetRecipientSharedNotes (3);
-- 🔔 EXPECTED: Empty result set (Vì đã bị xóa mềm)

-- =============================================================
-- 6. TEST MỤC 5: sp_BulkSyncQueue
-- =============================================================
-- Tạo queue data (1 CREATE, 1 UPDATE, 1 DELETE)
INSERT INTO
    sync_queue (
        user_id,
        action,
        entity_id,
        payload
    )
VALUES (
        2,
        'CREATE',
        0,
        '{"action":"CREATE","entity_id":null,"data":{"title":"Bob Note 1","content":"Hello from Bob"}}'
    ),
    (
        1,
        'UPDATE',
        2,
        '{"action":"UPDATE","entity_id":2,"data":{"title":"Mật khẩu wifi (Đã đổi)"}}'
    ),
    (
        1,
        'DELETE',
        2,
        '{"action":"DELETE","entity_id":2,"data":null}'
    );

-- Test Case 6.1: Thực thi Bulk Sync
SET
    @json_payload = '[
  {"action":"CREATE","entity_id":null,"data":{"title":"Bob Note 1","content":"Hello from Bob"}},
  {"action":"UPDATE","entity_id":2,"data":{"title":"Mật khẩu wifi (Đã đổi)"}},
  {"action":"DELETE","entity_id":2,"data":null}
]';

CALL sp_BulkSyncQueue (1, @json_payload);
-- Lưu ý: Thực tế Backend sẽ parse sync_queue và build ra mảng JSON truyền vào. Ở đây ta giả lập truyền param trực tiếp từ biến.
-- Do 'CREATE' là do user 1 gọi, note mới sẽ thuộc về user 1.

SELECT id, user_id, title, deleted_at FROM notes;
-- 🔔 EXPECTED:
-- - Note 2 có title mới và deleted_at IS NOT NULL (Do UPDATE rồi DELETE).
-- - Có Note mới 'Bob Note 1' được CREATE bởi user 1.

-- =============================================================
-- 7. TEST MỤC 6: tr_AfterNoteDelete_Clean
-- =============================================================
-- Lưu ý quan trọng: Vì note_shares và note_attachments có FK với cú pháp "ON DELETE CASCADE",
-- khi bạn dùng lệnh `DELETE FROM notes` thì DB sẽ xóa luôn các bảng con này VẬT LÝ trước.
-- Vì vậy, trigger `AFTER DELETE` UPDATE cột `deleted_at` sẽ không tìm thấy để mà update.
--
-- Nếu muốn giữ lại dữ liệu bảng con (chỉ soft delete), Laravel sẽ dùng:
-- `UPDATE notes SET deleted_at = NOW() WHERE id = 1;`
-- (Đây là UPDATE, không phải DELETE nên Trigger `AFTER DELETE` KHÔNG kích hoạt).
--
-- Nếu bạn định dùng Soft Delete trên Laravel, bạn NÊN đưa logic quét dọn (clean) này vào
-- Controller hoặc tạo thêm Trigger `AFTER UPDATE`.
--
-- Dưới đây là cách test nêú chúng ta thực sự xóa Hard Delete note_id = 1 (Nhưng CASCADE sẽ nuốt):
DELETE FROM notes WHERE id = 1;

SELECT * FROM note_shares WHERE note_id = 1;

SELECT * FROM note_attachments WHERE note_id = 1;
-- 🔔 EXPECTED (Nếu CASCADE): Empty (không còn record nào do đã bị DB xóa vật lý).