<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    /**
     * Get the authenticated user's notification preferences.
     */
    public function show(Request $request)
    {
        $prefs = NotificationPreference::getOrCreate($request->user()->id);

        return response()->json([
            'preferences' => $prefs->only([
                'push_enabled', 'payment_alerts', 'subscription_alerts',
                'new_templates', 'promotions', 'account_updates', 'reminders',
            ]),
        ]);
    }

    /**
     * Update the authenticated user's notification preferences.
     */
    public function update(Request $request)
    {
        $request->validate([
            'push_enabled'        => 'sometimes|boolean',
            'payment_alerts'      => 'sometimes|boolean',
            'subscription_alerts' => 'sometimes|boolean',
            'new_templates'       => 'sometimes|boolean',
            'promotions'          => 'sometimes|boolean',
            'account_updates'     => 'sometimes|boolean',
            'reminders'           => 'sometimes|boolean',
        ]);

        $prefs = NotificationPreference::getOrCreate($request->user()->id);

        $prefs->update($request->only([
            'push_enabled', 'payment_alerts', 'subscription_alerts',
            'new_templates', 'promotions', 'account_updates', 'reminders',
        ]));

        return response()->json([
            'message' => 'Preferences updated',
            'preferences' => $prefs->fresh()->only([
                'push_enabled', 'payment_alerts', 'subscription_alerts',
                'new_templates', 'promotions', 'account_updates', 'reminders',
            ]),
        ]);
    }
}
