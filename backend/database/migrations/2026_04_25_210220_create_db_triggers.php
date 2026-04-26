<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->runSqlFile('triggers.sql');
    }

    public function down(): void
    {
        if (! $this->supportsRoutines()) {
            return;
        }

        DB::unprepared('DROP TRIGGER IF EXISTS tr_Notes_BeforeUpdate');
        DB::unprepared('DROP TRIGGER IF EXISTS tr_PreventSelfSharing_Update');
        DB::unprepared('DROP TRIGGER IF EXISTS tr_PreventSelfSharing');
        DB::unprepared('DROP TRIGGER IF EXISTS tr_AfterNoteDelete_Clean');
    }

    private function supportsRoutines(): bool
    {
        return in_array(DB::getDriverName(), ['mysql', 'mariadb'], true);
    }

    private function runSqlFile(string $fileName): void
    {
        if (! $this->supportsRoutines()) {
            return;
        }

        $path = database_path('sql/'.$fileName);

        if (! is_file($path)) {
            throw new RuntimeException("Missing SQL file: {$path}");
        }

        $contents = trim((string) file_get_contents($path));

        if ($contents === '') {
            return;
        }

        $statements = preg_split('/^\s*--\s*@@\s*$/m', $contents) ?: [];

        foreach ($statements as $statement) {
            $sql = trim($statement);

            if ($sql === '') {
                continue;
            }

            DB::unprepared($sql);
        }
    }
};
