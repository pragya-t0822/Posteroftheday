<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reminder extends Model
{
    protected $fillable = [
        'title',
        'occasion',
        'reminder_date',
        'category_ids',
        'is_active',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'reminder_date' => 'date',
            'category_ids' => 'array',
            'is_active' => 'boolean',
        ];
    }

    // Helper: get the actual Category models
    public function getCategoriesAttribute()
    {
        if (empty($this->category_ids)) return collect();
        return Category::with(['children', 'translations'])->whereIn('id', $this->category_ids)->get();
    }
}
