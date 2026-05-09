<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentSession extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'plan_id',
        'original_amount',
        'discount_amount',
        'final_amount',
        'coupon_code',
        'payment_method',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'original_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'final_amount' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (PaymentSession $s) {
            if (empty($s->id)) {
                $s->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

