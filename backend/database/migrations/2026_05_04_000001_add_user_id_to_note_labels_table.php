<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Aiven MySQL bật sql_require_primary_key=ON — bảng không được tồn tại
        // dù chỉ 1ms mà không có PK. Phải thực hiện tất cả trong 1 ALTER TABLE duy nhất.
        DB::statement('
            ALTER TABLE `note_labels`
                ADD COLUMN `user_id` BIGINT UNSIGNED NOT NULL DEFAULT 0,
                DROP PRIMARY KEY,
                ADD PRIMARY KEY (`note_id`, `label_id`, `user_id`),
                ADD CONSTRAINT `note_labels_user_id_foreign`
                    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
                    ON DELETE CASCADE
        ');
    }

    public function down(): void
    {
        DB::statement('
            ALTER TABLE `note_labels`
                DROP FOREIGN KEY `note_labels_user_id_foreign`,
                DROP PRIMARY KEY,
                DROP COLUMN `user_id`,
                ADD PRIMARY KEY (`note_id`, `label_id`)
        ');
    }
};
