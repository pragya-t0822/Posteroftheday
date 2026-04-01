<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\Request;

class MobileSubscriptionController extends Controller
{
    public function status(Request $request)
    {
        $user = $request->user();

        /** @var Subscription|null $activeSubscription */
        $activeSubscription = Subscription::with('package')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->where('ends_at', '>', now())
            ->latest()
            ->first();

        $subscriptionData = null;
        $hasPremium = false;

        if ($activeSubscription instanceof Subscription) {
            $hasPremium = (bool) $activeSubscription->is_premium;
            $packageName = 'N/A';
            $durationType = 'N/A';
            $daysRemaining = 0;

            $package = $activeSubscription->package;
            if ($package instanceof \App\Models\SubscriptionPackage) {
                $packageName = $package->name;
                $durationType = $package->duration_type;
            }

            $endsAt = $activeSubscription->ends_at;
            if ($endsAt instanceof \Carbon\Carbon) {
                $daysRemaining = (int) now()->diffInDays($endsAt, false);
            }

            $subscriptionData = [
                'id' => $activeSubscription->id,
                'package_name' => $packageName,
                'duration_type' => $durationType,
                'status' => $activeSubscription->status,
                'starts_at' => $activeSubscription->starts_at,
                'ends_at' => $endsAt,
                'is_premium' => $hasPremium,
                'days_remaining' => $daysRemaining,
            ];
        }

        return response()->json([
            'has_premium_access' => $hasPremium,
            'is_subscribed' => $activeSubscription !== null,
            'subscription' => $subscriptionData,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function history(Request $request)
    {
        $subscriptions = Subscription::with(['package', 'payments'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($subscriptions);
    }
}
