<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;


class CustomerController extends Controller
{
    use HasAdvancedFiltering;

    public function index(Request $request)
    {
        $query = User::whereHas('role', fn($q) => $q->where('slug', 'customer'));

        $this->applySearch($query, $request, ['name', 'email', 'phone']);
        $this->applyFilters($query, $request, ['status' => 'status']);
        $this->applyDateRange($query, $request);

        // Subscription type filter: membership, renewal, free
        if ($type = $request->input('subscription_type')) {
            if ($type === 'membership') {
                $query->whereHas('subscriptions', fn($q) => $q->where('status', 'active')->where('ends_at', '>', now()));
            } elseif ($type === 'renewal') {
                $query->whereHas('subscriptions', fn($q) => $q->where('status', 'active')->where('ends_at', '<=', now()->addDays(7))->where('ends_at', '>', now()));
            } elseif ($type === 'free') {
                $query->whereDoesntHave('subscriptions', fn($sq) => $sq->where('status', 'active')->where('ends_at', '>', now()));
            }
        }

        $customers = $query->with(['role', 'subscriptions' => fn($q) => $q->where('status', 'active')->where('ends_at', '>', now())->latest('ends_at')->limit(1)])
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 10));

        return response()->json($customers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'status' => 'nullable|in:active,inactive',
            'password' => 'required|string|min:8',
        ]);

        $customerRole = Role::where('slug', 'customer')->first();

        $customer = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'status' => $request->status ?? 'active',
            'password' => $request->password,
            'role_id' => $customerRole?->id,
        ]);

        return response()->json($customer->load('role'), 201);
    }

    public function show(string $id)
    {
        $customer = User::findOrFail($id);
        $customer->load([
            'role',
            'subscriptions' => fn($q) => $q->orderByDesc('created_at'),
            'subscriptions.package',
            'subscriptions.payments',
        ]);

        // Append referral stats
        $customer->referral_stats = [
            'total_referrals' => Referral::where('referrer_id', $customer->id)->count(),
            'successful_referrals' => Referral::where('referrer_id', $customer->id)->where('status', 'successful')->count(),
            'total_rewards_earned' => Referral::where('referrer_id', $customer->id)->where('status', 'successful')->sum('reward_earned'),
        ];

        return response()->json($customer);
    }

    public function update(Request $request, string $id)
    {
        $customer = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $customer->id,
            'phone' => 'nullable|string|max:20',
            'status' => 'nullable|in:active,inactive',
            'password' => 'sometimes|string|min:8',
        ]);

        $data = $request->only('name', 'email', 'phone', 'status');
        if ($request->filled('password')) {
            $data['password'] = $request->password;
        }

        $customer->update($data);

        return response()->json($customer->load([
            'role',
            'subscriptions' => fn($q) => $q->where('status', 'active')->where('ends_at', '>', now())->latest('ends_at')->limit(1),
        ]));
    }

    public function destroy(string $id)
    {
        try {
            $customer = User::findOrFail($id);
            $customer->tokens()->delete();
            $customer->referrals()->delete();
            $customer->subscriptions()->delete();
            $customer->delete();

            return response()->json(['message' => 'Customer deleted']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete customer: ' . $e->getMessage()], 500);
        }
    }

    public function referrals(Request $request, string $id)
    {
        $customer = User::findOrFail($id);

        $query = Referral::with(['referred'])->where('referrer_id', $customer->id);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('referral_code', 'like', "%{$search}%")
                  ->orWhereHas('referred', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $referrals = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        return response()->json($referrals);
    }

    public function updateReferralStatus(Request $request, string $customerId, string $referralId)
    {
        $customer = User::findOrFail($customerId);
        $referral = Referral::where('referrer_id', $customer->id)->findOrFail($referralId);

        $request->validate([
            'status' => 'required|in:pending,successful,expired',
        ]);

        $newStatus = $request->input('status');

        // If changing to successful and wasn't already successful
        if ($newStatus === 'successful' && $referral->status !== 'successful') {
            $rewardAmount = (float) Setting::getValue('referral_reward_amount', 0);
            $referral->update([
                'status' => $newStatus,
                'reward_earned' => $rewardAmount,
            ]);

            // Credit the referrer's wallet
            $customer->increment('wallet_balance', $rewardAmount);
        } else {
            // If changing FROM successful to something else, reverse the credit
            if ($referral->status === 'successful' && $newStatus !== 'successful') {
                $deductAmount = min($referral->reward_earned, $customer->wallet_balance);
                $customer->decrement('wallet_balance', $deductAmount);
                $referral->update([
                    'status' => $newStatus,
                    'reward_earned' => 0,
                ]);
            } else {
                $referral->update(['status' => $newStatus]);
            }
        }

        return response()->json($referral->load('referred'));
    }

    public function toggleStatus(string $id)
    {
        $customer = User::whereHas('role', fn($q) => $q->where('slug', 'customer'))->findOrFail($id);
        $customer->update(['status' => $customer->status === 'active' ? 'inactive' : 'active']);

        return response()->json($customer->load([
            'role',
            'subscriptions' => fn($q) => $q->where('status', 'active')->where('ends_at', '>', now())->latest('ends_at')->limit(1),
        ]));
    }

    public function bulkActivate(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        $count = User::whereIn('id', $request->input('ids'))
            ->whereHas('role', fn($q) => $q->where('slug', 'customer'))
            ->update(['status' => 'active']);
        return response()->json(['message' => "{$count} customer(s) activated", 'count' => $count]);
    }

    public function bulkDeactivate(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        $count = User::whereIn('id', $request->input('ids'))
            ->whereHas('role', fn($q) => $q->where('slug', 'customer'))
            ->update(['status' => 'inactive']);
        return response()->json(['message' => "{$count} customer(s) deactivated", 'count' => $count]);
    }

    public function bulkDelete(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        $count = User::whereIn('id', $request->input('ids'))
            ->whereHas('role', fn($q) => $q->where('slug', 'customer'))
            ->delete();
        return response()->json(['message' => "{$count} customer(s) deleted", 'count' => $count]);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(User::class, $request,
            ['id', 'name', 'email', 'phone', 'status', 'created_at'],
            ['ID', 'Name', 'Email', 'Phone', 'Status', 'Created At'],
            'customers.csv'
        );
    }
}
