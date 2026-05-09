<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InspirationalSlide extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'text',
        'source',
        'gradient',
        'icon',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (InspirationalSlide $s) {
            if (empty($s->id)) {
                $s->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}

