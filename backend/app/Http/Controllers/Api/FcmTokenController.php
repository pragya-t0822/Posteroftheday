<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FcmToken;
use Illuminate\Http\Request;

class FcmTokenController extends Controller
{
    /**
     * Store or update FCM token for the authenticated user.
     */
    public function store(Request $request)
    {
        $request->validate([
            'token'       => 'required|string',
            'device_type' => 'nullable|string|in:android,ios',
            'device_id'   => 'nullable|string|max:255',
        ]);

        $userId = $request->user()->id;

        // Upsert: if same device_id exists, update the token
        $fcmToken = FcmToken::updateOrCreate(
            [
                'user_id'   => $userId,
                'device_id' => $request->input('device_id', 'default'),
            ],
            [
                'token'        => $request->token,
                'device_type'  => $request->device_type,
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'FCM token registered successfully',
            'data'    => $fcmToken,
        ]);
    }

    /**
     * Remove FCM token (on logout or token invalidation).
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        FcmToken::where('user_id', $request->user()->id)
            ->where('token', $request->token)
            ->delete();

        return response()->json(['message' => 'FCM token removed']);
    }
}
