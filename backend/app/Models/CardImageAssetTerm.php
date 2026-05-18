<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CardImageAssetTerm extends Model
{
    protected $fillable = [
        'asset_id',
        'lang',
        'term',
        'term_normalized',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(CardImageAsset::class, 'asset_id');
    }
}
