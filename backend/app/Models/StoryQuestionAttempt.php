<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoryQuestionAttempt extends Model
{
    protected $fillable = [
        'user_id',
        'story_id',
        'question_id',
        'correct',
    ];

    protected function casts(): array
    {
        return [
            'correct' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function story(): BelongsTo
    {
        return $this->belongsTo(Story::class, 'story_id', 'id');
    }
}
