<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;
use App\Models\Label;
use App\Models\NoteShare;
use App\Models\NoteAttachment;

class Note extends Model
{
    use HasFactory, SoftDeletes;
    
    /**
     * Boot the model.
     */
    protected static function booted()
    {
        static::deleting(function ($note) {
            // Tự động xóa mềm các attachment và shares liên quan khi note bị xóa mềm
            $note->attachments()->delete();
            $note->shares()->delete();
        });
    }


    protected $fillable = [
        'user_id',
        'title',
        'content',
        'color',
        'is_pinned',
        'pinned_at',
        'password',
        'is_protected',
        'version'
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_protected' => 'boolean',
        'pinned_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shares()
    {
        return $this->hasMany(NoteShare::class);
    }

    public function labels()
    {
        return $this->belongsToMany(Label::class, 'note_labels');
    }

    public function attachments()
    {
        return $this->hasMany(NoteAttachment::class, 'note_id');
    }
}
