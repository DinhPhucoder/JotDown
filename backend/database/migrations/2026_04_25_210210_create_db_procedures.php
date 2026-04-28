<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->runSqlFile('procedures.sql');
    }

    public function down(): void
    {
        if (! $this->supportsRoutines()) {
            return;
        }

        $procedures = [
            'sp_UI_UpdateSettings',
            'sp_UI_UpdateNoteColor',
            'sp_Organize_FilterByLabel',
            'sp_Organize_Search',
            'sp_Organize_TogglePin',
            'sp_ManageNotes_Delete',
            'sp_ManageNotes_AutoSave',
            'sp_ManageNotes_Init',
            'sp_ManageNotes_GetHome',
            'sp_ChangeNotePassword',
            'sp_RemoveNotePassword',
            'sp_SetNotePassword',
            'sp_ChangeUserPassword',
            'sp_RegisterUser',
            'sp_BulkSyncQueue',
            'sp_RevokeAllShares',
            'sp_GetRecipientSharedNotes',
            'sp_ShareNoteWithValidation',
        ];

        foreach ($procedures as $procedure) {
            DB::unprepared("DROP PROCEDURE IF EXISTS {$procedure}");
        }
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
