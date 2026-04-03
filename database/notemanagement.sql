--
-- Cơ sở dữ liệu: `notemanagement`
--

CREATE DATABASE IF NOT EXISTS notemanagement;

USE notemanagement;

--
-- 2. Cấu trúc bảng cho bảng `labels`
--

CREATE TABLE `labels` (
    `id` int(10) UNSIGNED NOT NULL,
    `user_id` int(10) UNSIGNED NOT NULL,
    `name` varchar(100) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- 3. Cấu trúc bảng cho bảng `notes`
--

CREATE TABLE `notes` (
    `id` int(10) UNSIGNED NOT NULL,
    `user_id` int(10) UNSIGNED NOT NULL,
    `title` varchar(255) NOT NULL,
    `content` text DEFAULT NULL,
    `color` varchar(7) DEFAULT '#ffffff',
    `is_pinned` tinyint(1) DEFAULT 0,
    `pinned_at` timestamp NULL DEFAULT NULL,
    `password` varchar(255) DEFAULT NULL,
    `is_protected` tinyint(1) DEFAULT 0 COMMENT '0: Không khóa, 1: Có khóa',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- 4. Cấu trúc bảng cho bảng `note_images`
--

CREATE TABLE `note_images` (
    `id` int(10) UNSIGNED NOT NULL,
    `note_id` int(10) UNSIGNED NOT NULL,
    `image_path` varchar(255) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- 5. Cấu trúc bảng cho bảng `note_labels`
--

CREATE TABLE `note_labels` (
    `note_id` int(10) UNSIGNED NOT NULL,
    `label_id` int(10) UNSIGNED NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- 6. Cấu trúc bảng cho bảng `note_shares`
--

CREATE TABLE `note_shares` (
    `id` int(10) UNSIGNED NOT NULL,
    `note_id` int(10) UNSIGNED NOT NULL,
    `sender_id` int(10) UNSIGNED NOT NULL,
    `receiver_id` varchar(255) NOT NULL,
    `permission` enum('READ', 'EDIT') NOT NULL DEFAULT 'READ',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- 7. Cấu trúc bảng cho bảng `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
    `email` varchar(255) NOT NULL,
    `token` varchar(255) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- 8. Cấu trúc bảng cho bảng `sync_queue`
--

CREATE TABLE `sync_queue` (
    `id` int(10) UNSIGNED NOT NULL,
    `user_id` int(10) UNSIGNED NOT NULL,
    `action` enum('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `entity_id` int(10) UNSIGNED NOT NULL,
    `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
    `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- 9. Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
    `id` int(10) UNSIGNED NOT NULL,
    `name` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    `avatar` varchar(255) DEFAULT NULL,
    `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preferences`)),
    `activation_token` varchar(255) DEFAULT NULL,
    `email_verified_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `labels`
--
ALTER TABLE `labels`
ADD PRIMARY KEY (`id`),
ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `notes`
--
ALTER TABLE `notes`
ADD PRIMARY KEY (`id`),
ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `note_images`
--
ALTER TABLE `note_images`
ADD PRIMARY KEY (`id`),
ADD KEY `note_id` (`note_id`);

--
-- Chỉ mục cho bảng `note_labels`
--
ALTER TABLE `note_labels`
ADD PRIMARY KEY (`note_id`, `label_id`),
ADD KEY `label_id` (`label_id`);

--
-- Chỉ mục cho bảng `note_shares`
--
ALTER TABLE `note_shares`
ADD PRIMARY KEY (`id`),
ADD KEY `fk_noteshare_note` (`note_id`),
ADD KEY `fk_noteshare_sender` (`sender_id`);

--
-- Chỉ mục cho bảng `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens` ADD PRIMARY KEY (`email`);

--
-- Chỉ mục cho bảng `sync_queue`
--
ALTER TABLE `sync_queue`
ADD PRIMARY KEY (`id`),
ADD KEY `fk_syncqueue_user` (`user_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `labels`
--
ALTER TABLE `labels`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `notes`
--
ALTER TABLE `notes`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `note_images`
--
ALTER TABLE `note_images`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `note_shares`
--
ALTER TABLE `note_shares`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `sync_queue`
--
ALTER TABLE `sync_queue`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `labels`
--
ALTER TABLE `labels`
ADD CONSTRAINT `labels_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `notes`
--
ALTER TABLE `notes`
ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `note_images`
--
ALTER TABLE `note_images`
ADD CONSTRAINT `note_images_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `note_labels`
--
ALTER TABLE `note_labels`
ADD CONSTRAINT `note_labels_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `note_labels_ibfk_2` FOREIGN KEY (`label_id`) REFERENCES `labels` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `note_shares`
--
ALTER TABLE `note_shares`
ADD CONSTRAINT `fk_noteshare_note` FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_noteshare_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `sync_queue`
--
ALTER TABLE `sync_queue`
ADD CONSTRAINT `fk_syncqueue_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

COMMIT;