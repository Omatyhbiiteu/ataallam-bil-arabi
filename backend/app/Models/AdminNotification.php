<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminNotification extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'admin_user_id',
        'kind',
        'title',
        'body',
        'ticket_id',
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
        static::creating(function (AdminNotification $n) {
            if (empty($n->id)) {
                $n->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'admin_user_id');
    }
}
