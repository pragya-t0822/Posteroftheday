<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Font extends Model
{
    protected $fillable = [
        'name', 'family', 'file_path', 'file_name',
        'mime_type', 'file_size', 'is_active', 'is_default', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'file_size' => 'integer',
            'sort_order' => 'integer',
        ];
    }
}
