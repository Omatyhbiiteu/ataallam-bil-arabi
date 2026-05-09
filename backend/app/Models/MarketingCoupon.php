<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketingCoupon extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'code',
        'discount_percentage',
        'is_active',
        'expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'is_active' => 'boolean',
            'expiry_date' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (MarketingCoupon $c) {
            if (empty($c->id)) {
                $c->id = (string) \Illuminate\Support\Str::uuid();
            }
            $c->code = strtoupper(trim((string) $c->code));
        });
    }
}

