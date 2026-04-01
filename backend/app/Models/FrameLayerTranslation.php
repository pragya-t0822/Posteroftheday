<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FrameLayerTranslation extends Model
{
    protected $fillable = ['frame_layer_id', 'language', 'title'];

    public function frameLayer(): BelongsTo
    {
        return $this->belongsTo(FrameLayer::class);
    }
}
