<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('note_labels', function (Blueprint $table) {
            // Bỏ primary key cũ để thêm cột user_id vào
            $table->dropPrimary(['note_id', 'label_id']);

            $table->unsignedBigInteger('user_id')->default(0)->after('label_id');

            // Primary key mới gồm cả user_id để 1 note có thể có label khác nhau theo từng user
            $table->primary(['note_id', 'label_id', 'user_id']);

            // FK user_id → users
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('note_labels', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropPrimary(['note_id', 'label_id', 'user_id']);
            $table->dropColumn('user_id');
            $table->primary(['note_id', 'label_id']);
        });
    }
};
