<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketingBanner extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title',
        'description',
        'emoji',
        'cta_text',
        'cta_link',
        'is_active',
        'expiry_date',
        'type',
        'related_coupon_code',
        'background_color',
        'text_color',
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
        static::creating(function (MarketingBanner $b) {
            if (empty($b->id)) {
                $b->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}

