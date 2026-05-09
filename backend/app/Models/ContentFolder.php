<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ContentFolder extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'content_folders';

    protected $fillable = [
        'id',
        'lang',
        'user_id',
        'parent_id',
        'name',
        'color',
        'content_lang',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'parent_id' => 'string',
            'is_system' => 'boolean',
        ];
    }

    public function cards(): HasMany
    {
        return $this->hasMany(ContentCard::class, 'folder_id');
    }

    protected static function booted(): void
    {
        static::creating(function (ContentFolder $m) {
            if (empty($m->id)) {
                $m->id = (string) Str::uuid();
            }
        });
    }
}
