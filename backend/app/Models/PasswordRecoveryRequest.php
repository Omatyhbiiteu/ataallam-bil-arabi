<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordRecoveryRequest extends Model
{
    protected $fillable = [
        'full_name',
        'email',
        'phone',
    ];
}
