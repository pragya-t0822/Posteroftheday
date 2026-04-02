<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FrameRequest extends Model
{
    protected $fillable = [
        'customer_id',
        'title',
        'description',
        'reference_image',
        'status',
        'admin_notes',
        'frame_layer_id',
        'delivered_file',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function frameLayer(): BelongsTo
    {
        return $this->belongsTo(FrameLayer::class);
    }
}
