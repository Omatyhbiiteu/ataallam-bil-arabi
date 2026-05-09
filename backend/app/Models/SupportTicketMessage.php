<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportTicketMessage extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'support_ticket_id',
        'sender',
        'text',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (SupportTicketMessage $message) {
            if (empty($message->id)) {
                $message->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }
}
