<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class CardImageAsset extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'lang',
        'ar_label',
        'target_word',
        'image_url',
        'is_active',
        'created_by_admin_id',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'is_active' => 'boolean',
        ];
    }

    public function terms(): HasMany
    {
        return $this->hasMany(CardImageAssetTerm::class, 'asset_id');
    }

    protected static function booted(): void
    {
        static::creating(function (CardImageAsset $asset) {
            if (empty($asset->id)) {
                $asset->id = (string) Str::uuid();
            }
        });
    }
}
