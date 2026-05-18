<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserFeatureUsage extends Model
{
    protected $fillable = [
        'user_id',
        'feature',
        'count',
        'window_started_at',
        'exhausted_at',
        'resets_at',
    ];

    protected function casts(): array
    {
        return [
            'count' => 'integer',
            'window_started_at' => 'datetime',
            'exhausted_at' => 'datetime',
            'resets_at' => 'datetime',
        ];
    }
}
