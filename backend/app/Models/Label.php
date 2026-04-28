<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Note;

class Label extends Model
{
    protected $fillable = [
        'name',
        'color'
    ];

    public function notes()
    {
        return $this->belongsToMany(Note::class);
    }
}
