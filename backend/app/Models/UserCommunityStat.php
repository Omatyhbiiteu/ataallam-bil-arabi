<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCommunityStat extends Model
{
    protected $fillable = [
        'user_id',
        'lang',
        'stories_completed',
        'quiz_total',
        'quiz_avg_percent',
        'streak_days',
    ];

    protected function casts(): array
    {
        return [
            'stories_completed' => 'integer',
            'quiz_total' => 'integer',
            'quiz_avg_percent' => 'integer',
            'streak_days' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
