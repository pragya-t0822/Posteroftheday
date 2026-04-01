<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NavigationItem extends Model
{
    protected $fillable = ['title', 'icon', 'route', 'parent_id', 'permission_slug', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function children(): HasMany
    {
        return $this->hasMany(NavigationItem::class, 'parent_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(NavigationItem::class, 'parent_id');
    }
}
