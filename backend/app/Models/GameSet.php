<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class GameSet extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'lang',
        'type',
        'title',
        'description',
        'level',
        'sub_level',
        'icon',
        'color',
        'xp_reward',
        'time_limit_seconds',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'xp_reward' => 'integer',
            'time_limit_seconds' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function questions(): HasMany
    {
        return $this->hasMany(GameQuestion::class, 'game_set_id')->orderBy('sort_order');
    }

    protected static function booted(): void
    {
        static::creating(function (GameSet $m) {
            if (empty($m->id)) {
                $m->id = (string) Str::uuid();
            }
        });
    }
}
