<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('content')->nullable();
            $table->string('color', 7)->default('#ffffff');
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('pinned_at')->nullable();
            $table->string('password')->nullable();
            $table->boolean('is_protected')->default(false);
            $table->unsignedInteger('version')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deleted_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
