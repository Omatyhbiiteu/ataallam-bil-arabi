<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BroadcastNotification extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'type',
        'icon',
        'target_audience',
        'title',
        'message',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (BroadcastNotification $n) {
            if (empty($n->id)) {
                $n->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    // Note: no relations needed for now (history only)
}

