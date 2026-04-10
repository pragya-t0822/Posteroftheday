<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use App\Services\FcmService;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    use HasAdvancedFiltering;

    protected FcmService $fcmService;

    public function __construct(FcmService $fcmService)
    {
        $this->fcmService = $fcmService;
    }

    public function index(Request $request)
    {
        $query = AdminNotification::with('creator:id,name');

        $this->applySearch($query, $request, ['title', 'message']);
        $this->applyFilters($query, $request, [
            'status' => 'status',
            'type' => 'type',
            'subscription_target' => 'subscription_target',
        ]);
        $this->applyDateRange($query, $request);

        $notifications = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        return response()->json($notifications);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'               => 'required|string|max:255',
            'message'             => 'required|string|max:5000',
            'target'              => 'required|in:all,specific',
            'target_user_ids'     => 'required_if:target,specific|array',
            'target_user_ids.*'   => 'exists:users,id',
            'subscription_target' => 'nullable|in:all,paid,renewal,free',
            'type'                => 'required|in:push,email,in_app',
            'status'              => 'sometimes|in:draft,sent,scheduled',
            'scheduled_at'        => 'nullable|date',
        ]);

        $data = $request->only('title', 'message', 'target', 'target_user_ids', 'subscription_target', 'type', 'scheduled_at');
        $data['created_by'] = $request->user()->id;

        if ($request->scheduled_at) {
            $data['status'] = 'scheduled';
        } else {
            $data['status'] = $request->input('status', 'sent');
            if ($data['status'] === 'sent') {
                $data['sent_at'] = now();
            }
        }

        $notification = AdminNotification::create($data);

        // Auto-send FCM if status is 'sent' (not draft/scheduled)
        $delivery = null;
        if ($notification->status === 'sent') {
            $delivery = $this->fcmService->sendAdminNotification($notification);
        }

        $notification->load('creator:id,name');

        $response = $notification->toArray();
        if ($delivery) {
            $response['delivery'] = $delivery;
        }

        return response()->json($response, 201);
    }

    public function show(string $id)
    {
        $notification = AdminNotification::with('creator:id,name')->findOrFail($id);
        return response()->json($notification);
    }

    public function update(Request $request, string $id)
    {
        $notification = AdminNotification::findOrFail($id);

        $request->validate([
            'title'               => 'sometimes|string|max:255',
            'message'             => 'sometimes|string|max:5000',
            'target'              => 'sometimes|in:all,specific',
            'target_user_ids'     => 'nullable|array',
            'target_user_ids.*'   => 'exists:users,id',
            'subscription_target' => 'nullable|in:all,paid,renewal,free',
            'type'                => 'sometimes|in:push,email,in_app',
            'status'              => 'sometimes|in:draft,sent,scheduled',
            'scheduled_at'        => 'nullable|date',
        ]);

        $data = $request->only('title', 'message', 'target', 'target_user_ids', 'subscription_target', 'type', 'status', 'scheduled_at');

        if (isset($data['status']) && $data['status'] === 'sent' && !$notification->sent_at) {
            $data['sent_at'] = now();
        }

        $notification->update($data);
        $notification->load('creator:id,name');

        return response()->json($notification);
    }

    public function destroy(string $id)
    {
        $notification = AdminNotification::findOrFail($id);
        $notification->delete();
        return response()->json(['message' => 'Notification deleted']);
    }

    public function send(string $id)
    {
        $notification = AdminNotification::findOrFail($id);
        $notification->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        // Send FCM push notifications to targeted users
        $result = $this->fcmService->sendAdminNotification($notification);

        $notification->load('creator:id,name');
        return response()->json([
            'notification' => $notification,
            'delivery' => $result,
        ]);
    }

    public function bulkDelete(Request $request)
    {
        return $this->bulkDestroy(AdminNotification::class, $request);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(AdminNotification::class, $request,
            ['id', 'title', 'message', 'target', 'type', 'status', 'created_at'],
            ['ID', 'Title', 'Message', 'Target', 'Type', 'Status', 'Created At'],
            'notifications.csv'
        );
    }
}
