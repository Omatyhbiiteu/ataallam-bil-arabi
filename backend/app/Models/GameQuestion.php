<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class GameQuestion extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'game_set_id',
        'prompt',
        'answer',
        'translation',
        'options',
        'tokens',
        'audio_text',
        'explanation',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'options' => 'array',
            'tokens' => 'array',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function gameSet(): BelongsTo
    {
        return $this->belongsTo(GameSet::class, 'game_set_id');
    }

    protected static function booted(): void
    {
        static::creating(function (GameQuestion $m) {
            if (empty($m->id)) {
                $m->id = (string) Str::uuid();
            }
        });
    }
}
