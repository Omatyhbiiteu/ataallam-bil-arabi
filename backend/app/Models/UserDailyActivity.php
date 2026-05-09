<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDailyActivity extends Model
{
    protected $table = 'user_daily_activity';

    protected $fillable = [
        'user_id',
        'activity_on',
    ];

    protected function casts(): array
    {
        return [
            'activity_on' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
