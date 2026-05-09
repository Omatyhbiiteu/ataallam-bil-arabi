<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    protected $fillable = [
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }
}
