<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Story extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'lang',
        'title',
        'description',
        'content',
        'translation',
        'image',
        'level',
        'sub_level',
        'questions',
        'tags',
        'word_count',
        'estimated_reading_time',
        'difficulty',
        'view_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'questions' => 'array',
            'tags' => 'array',
            'word_count' => 'integer',
            'estimated_reading_time' => 'integer',
            'difficulty' => 'integer',
            'view_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Story $s) {
            if (empty($s->id)) {
                $s->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}

