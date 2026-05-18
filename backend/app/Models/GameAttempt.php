<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class GameAttempt extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'game_set_id',
        'lang',
        'type',
        'plan',
        'score',
        'total_questions',
        'correct_count',
        'xp_earned',
        'started_at',
        'completed_at',
        'usage_date',
        'details',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'score' => 'integer',
            'total_questions' => 'integer',
            'correct_count' => 'integer',
            'xp_earned' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'usage_date' => 'date',
            'details' => 'array',
        ];
    }

    public function gameSet(): BelongsTo
    {
        return $this->belongsTo(GameSet::class, 'game_set_id');
    }

    protected static function booted(): void
    {
        static::creating(function (GameAttempt $m) {
            if (empty($m->id)) {
                $m->id = (string) Str::uuid();
            }
        });
    }
}
