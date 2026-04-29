<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;
use App\Models\Label;
use App\Models\NoteShare;

class Note extends Model
{
    use HasFactory, SoftDeletes;

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
}
