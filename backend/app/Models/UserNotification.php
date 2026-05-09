<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotification extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'kind',
        'title',
        'body',
        'ticket_id',
        'broadcast_id',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'read_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (UserNotification $n) {
            if (empty($n->id)) {
                $n->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
