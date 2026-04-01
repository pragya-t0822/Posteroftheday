<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FrameLayer extends Model
{
    protected $fillable = [
        'title', 'slug', 'frame_id',
        'file_path', 'file_name', 'mime_type', 'file_size',
        'is_active', 'sort_order', 'parameters',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'file_size' => 'integer',
            'sort_order' => 'integer',
            'parameters' => 'array',
        ];
    }

    public function frame(): BelongsTo
    {
        return $this->belongsTo(Frame::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(FrameLayerTranslation::class);
    }
}
