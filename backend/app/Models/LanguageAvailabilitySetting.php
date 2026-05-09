<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LanguageAvailabilitySetting extends Model
{
    protected $table = 'language_availability_settings';

    protected $fillable = [
        'en_enabled',
        'de_enabled',
    ];

    protected $casts = [
        'en_enabled' => 'boolean',
        'de_enabled' => 'boolean',
    ];
}

