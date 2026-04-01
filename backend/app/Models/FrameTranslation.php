<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FrameTranslation extends Model
{
    protected $fillable = ['frame_id', 'language', 'title', 'file_path', 'file_name'];

    public function frame(): BelongsTo
    {
        return $this->belongsTo(Frame::class);
    }
}
