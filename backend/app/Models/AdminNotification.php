<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminNotification extends Model
{
    protected $table = 'admin_notifications';

    protected $fillable = [
        'created_by', 'title', 'message', 'target', 'target_user_ids',
        'subscription_target', 'type', 'status', 'scheduled_at', 'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'target_user_ids' => 'array',
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function targetUsers()
    {
        if ($this->target === 'specific') {
            return User::whereIn('id', $this->target_user_ids ?? [])->get();
        }

        $query = User::whereHas('role', fn($q) => $q->where('slug', 'customer'));

        // Filter by subscription type
        if ($this->subscription_target && $this->subscription_target !== 'all') {
            $subTarget = $this->subscription_target;
            $query->whereHas('subscriptions', function ($q) use ($subTarget) {
                if ($subTarget === 'paid') {
                    $q->where('status', 'active')->whereHas('payments', fn($p) => $p->where('status', 'paid'));
                } elseif ($subTarget === 'renewal') {
                    $q->where('status', 'active')
                      ->where('ends_at', '<=', now()->addDays(7));
                } elseif ($subTarget === 'free') {
                    $q->where('status', 'active')
                      ->whereHas('package', fn($p) => $p->where('price', 0));
                }
            });
        }

        return $query->get();
    }
}
