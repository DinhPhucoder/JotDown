<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class NoteAttachment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'note_attachments';

    protected $fillable = [
        'note_id',
        'file_url',
        'attachment_kind',
        'original_name',
        'file_type',
        'file_size',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    protected $touches = ['note'];

    public function note(): BelongsTo
    {
        return $this->belongsTo(Note::class);
    }
}
