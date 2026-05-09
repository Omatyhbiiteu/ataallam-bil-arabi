<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SentenceTopic extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'sentence_topics';

    protected $fillable = [
        'id',
        'lang',
        'sentence_lang',
        'title',
        'description',
        'level',
        'sub_level',
        'image',
        'icon',
        'color',
        'media_type',
        'media_url',
        'sentences',
        'grammar_notes',
        'quiz_questions',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'sentences' => 'array',
            'quiz_questions' => 'array',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (SentenceTopic $m) {
            if (empty($m->id)) {
                $m->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}
