<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('note_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('note_id')->constrained('notes')->cascadeOnDelete();
            $table->text('file_url');
            $table->enum('attachment_kind', ['IMAGE', 'FILE'])->default('IMAGE');
            $table->string('original_name')->nullable();
            $table->string('file_type', 50)->nullable();
            $table->unsignedInteger('file_size')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deleted_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('note_attachments');
    }
};
