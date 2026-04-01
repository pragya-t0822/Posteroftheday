<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPackage extends Model
{
    protected $fillable = [
        'name', 'slug', 'duration_type', 'duration_days', 'price',
        'original_price', 'discount_percent', 'description', 'features',
        'is_popular', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'original_price' => 'decimal:2',
            'discount_percent' => 'integer',
            'features' => 'array',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'duration_days' => 'integer',
        ];
    }

    public static $durationLabels = [
        'monthly' => 'Monthly',
        'quarterly' => 'Quarterly',
        'half_yearly' => 'Half-Yearly',
        'yearly' => 'Yearly',
    ];

    public static $durationDays = [
        'monthly' => 30,
        'quarterly' => 90,
        'half_yearly' => 180,
        'yearly' => 365,
    ];
}
