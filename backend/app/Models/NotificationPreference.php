<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id', 'push_enabled', 'payment_alerts', 'subscription_alerts',
        'new_templates', 'promotions', 'account_updates', 'reminders',
    ];

    protected function casts(): array
    {
        return [
            'push_enabled' => 'boolean',
            'payment_alerts' => 'boolean',
            'subscription_alerts' => 'boolean',
            'new_templates' => 'boolean',
            'promotions' => 'boolean',
            'account_updates' => 'boolean',
            'reminders' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get preferences for a user, creating defaults if none exist.
     */
    public static function getOrCreate(int $userId): self
    {
        return self::firstOrCreate(
            ['user_id' => $userId],
            [
                'push_enabled' => true,
                'payment_alerts' => true,
                'subscription_alerts' => true,
                'new_templates' => true,
                'promotions' => false,
                'account_updates' => true,
                'reminders' => true,
            ]
        );
    }
}
