<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ContentCard extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'content_cards';

    protected $fillable = [
        'id',
        'lang',
        'user_id',
        'folder_id',
        'front_text',
        'back_text',
        'front_image',
        'next_review',
        'interval',
        'reviews',
        'ease_factor',
        'status',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'folder_id' => 'string',
            'is_system' => 'boolean',
            'next_review' => 'integer',
            'interval' => 'integer',
            'reviews' => 'integer',
            'ease_factor' => 'float',
        ];
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(ContentFolder::class, 'folder_id');
    }

    protected static function booted(): void
    {
        static::creating(function (ContentCard $m) {
            if (empty($m->id)) {
                $m->id = (string) Str::uuid();
            }
        });
    }
}
