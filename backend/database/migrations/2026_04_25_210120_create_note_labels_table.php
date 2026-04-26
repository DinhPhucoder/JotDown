<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('note_labels', function (Blueprint $table) {
            $table->foreignId('note_id')->constrained('notes')->cascadeOnDelete();
            $table->foreignId('label_id')->constrained('labels')->cascadeOnDelete();
            $table->primary(['note_id', 'label_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('note_labels');
    }
};
