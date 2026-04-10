<?php

namespace App\Services;

use App\Models\AdminNotification;
use App\Models\FcmToken;
use App\Models\NotificationPreference;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\AndroidConfig;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FcmService
{
    protected Messaging $messaging;

    public function __construct(Messaging $messaging)
    {
        $this->messaging = $messaging;
    }

    /**
     * Send an admin notification to targeted users via FCM.
     */
    public function sendAdminNotification(AdminNotification $notification): array
    {
        $users = $notification->targetUsers();
        $successCount = 0;
        $failCount = 0;

        foreach ($users as $user) {
            // Check user preferences
            $prefs = NotificationPreference::getOrCreate($user->id);

            // Always create the in-app notification record
            UserNotification::create([
                'user_id' => $user->id,
                'admin_notification_id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'icon' => 'bell',
            ]);

            // Skip FCM push if user disabled push notifications
            if (!$prefs->push_enabled) {
                continue;
            }

            // Send FCM push if type includes push
            if (in_array($notification->type, ['push', 'in_app'])) {
                $tokens = FcmToken::where('user_id', $user->id)->pluck('token')->toArray();

                if (empty($tokens)) {
                    continue;
                }

                try {
                    $message = CloudMessage::new()
                        ->withNotification(Notification::create(
                            $notification->title,
                            $notification->message
                        ))
                        ->withAndroidConfig(AndroidConfig::fromArray([
                            'priority' => 'high',
                            'notification' => [
                                'channel_id' => 'poster_of_the_day_notifications',
                                'icon' => 'ic_notification',
                                'color' => '#6C63FF',
                                'sound' => 'default',
                                'default_vibrate_timings' => true,
                                'notification_priority' => 'PRIORITY_HIGH',
                                'visibility' => 'PUBLIC',
                            ],
                        ]))
                        ->withData([
                            'notification_id' => (string) $notification->id,
                            'type' => $notification->type,
                            'title' => $notification->title,
                            'message' => $notification->message,
                            'click_action' => 'OPEN_NOTIFICATIONS',
                        ]);

                    $report = $this->messaging->sendMulticast($message, $tokens);
                    $successCount += $report->successes()->count();
                    $failCount += $report->failures()->count();

                    // Remove invalid tokens
                    foreach ($report->invalidTokens() as $invalidToken) {
                        FcmToken::where('token', $invalidToken)->delete();
                    }
                } catch (\Throwable $e) {
                    Log::error('FCM send error for user ' . $user->id . ': ' . $e->getMessage());
                    $failCount += count($tokens);
                }
            }
        }

        return [
            'total_users' => $users->count(),
            'push_success' => $successCount,
            'push_failed' => $failCount,
        ];
    }

    /**
     * Send a push notification to a single user by ID.
     */
    public function sendToUser(int $userId, string $title, string $message, array $data = []): bool
    {
        $tokens = FcmToken::where('user_id', $userId)->pluck('token')->toArray();

        if (empty($tokens)) {
            return false;
        }

        try {
            $cloudMessage = CloudMessage::new()
                ->withNotification(Notification::create($title, $message))
                ->withAndroidConfig(AndroidConfig::fromArray([
                    'priority' => 'high',
                    'notification' => [
                        'channel_id' => 'poster_of_the_day_notifications',
                        'icon' => 'ic_notification',
                        'color' => '#6C63FF',
                        'sound' => 'default',
                        'default_vibrate_timings' => true,
                        'notification_priority' => 'PRIORITY_HIGH',
                        'visibility' => 'PUBLIC',
                    ],
                ]))
                ->withData(array_merge([
                    'title' => $title,
                    'message' => $message,
                ], $data));

            $this->messaging->sendMulticast($cloudMessage, $tokens);
            return true;
        } catch (\Throwable $e) {
            Log::error('FCM send to user error: ' . $e->getMessage());
            return false;
        }
    }
}
