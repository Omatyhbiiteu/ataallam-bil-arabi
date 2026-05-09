<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CurriculumModule extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'lang',
        'title',
        'level',
        'sub_level',
        'lessons',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'lessons' => 'array',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (CurriculumModule $m) {
            if (empty($m->id)) {
                $m->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}

