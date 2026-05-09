<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'subject',
        'status',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (SupportTicket $ticket) {
            if (empty($ticket->id)) {
                $ticket->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class, 'support_ticket_id')->orderBy('created_at');
    }
}
