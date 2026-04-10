<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WalletWithdrawal;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;

class WalletWithdrawalController extends Controller
{
    use HasAdvancedFiltering;

    public function index(Request $request)
    {
        $query = WalletWithdrawal::with(['user:id,name,email', 'processor:id,name']);

        $this->applySearch($query, $request, ['user.name', 'user.email', 'payment_method', 'account_details']);
        $this->applyFilters($query, $request, [
            'status' => 'status',
            'payment_method' => 'payment_method',
        ]);
        $this->applyDateRange($query, $request);

        $withdrawals = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        return response()->json($withdrawals);
    }

    /**
     * Customer submits a withdrawal request.
     */
    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string|max:50',
            'account_details' => 'required|string|max:1000',
            'remarks' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        if ($request->amount > $user->wallet_balance) {
            return response()->json(['message' => 'Insufficient wallet balance'], 422);
        }

        // Check for pending withdrawals
        $pendingExists = WalletWithdrawal::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($pendingExists) {
            return response()->json(['message' => 'You already have a pending withdrawal request'], 422);
        }

        $withdrawal = WalletWithdrawal::create([
            'user_id' => $user->id,
            'amount' => $request->amount,
            'payment_method' => $request->payment_method,
            'account_details' => $request->account_details,
            'remarks' => $request->remarks,
        ]);

        return response()->json($withdrawal->load(['user:id,name,email']), 201);
    }

    public function show(string $id)
    {
        $withdrawal = WalletWithdrawal::with(['user:id,name,email,wallet_balance', 'processor:id,name'])
            ->findOrFail($id);
        return response()->json($withdrawal);
    }

    /**
     * Admin approves a withdrawal request.
     */
    public function approve(Request $request, string $id)
    {
        $withdrawal = WalletWithdrawal::findOrFail($id);

        if ($withdrawal->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be approved'], 422);
        }

        $user = $withdrawal->user;
        if ($withdrawal->amount > $user->wallet_balance) {
            return response()->json(['message' => 'Customer has insufficient wallet balance'], 422);
        }

        $request->validate([
            'admin_remarks' => 'nullable|string|max:500',
        ]);

        // Deduct from wallet
        $user->decrement('wallet_balance', $withdrawal->amount);

        $withdrawal->update([
            'status' => 'approved',
            'admin_remarks' => $request->admin_remarks,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return response()->json($withdrawal->load(['user:id,name,email', 'processor:id,name']));
    }

    /**
     * Admin rejects a withdrawal request.
     */
    public function reject(Request $request, string $id)
    {
        $withdrawal = WalletWithdrawal::findOrFail($id);

        if ($withdrawal->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be rejected'], 422);
        }

        $request->validate([
            'admin_remarks' => 'required|string|max:500',
        ]);

        $withdrawal->update([
            'status' => 'rejected',
            'admin_remarks' => $request->admin_remarks,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return response()->json($withdrawal->load(['user:id,name,email', 'processor:id,name']));
    }

    public function destroy(string $id)
    {
        $withdrawal = WalletWithdrawal::findOrFail($id);
        $withdrawal->delete();
        return response()->json(['message' => 'Withdrawal request deleted']);
    }

    /**
     * Customer views their own withdrawal requests.
     */
    public function myWithdrawals(Request $request)
    {
        $withdrawals = WalletWithdrawal::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        return response()->json($withdrawals);
    }

    public function bulkDelete(Request $request)
    {
        return $this->bulkDestroy(WalletWithdrawal::class, $request);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(WalletWithdrawal::class, $request,
            ['id', 'amount', 'payment_method', 'status', 'created_at'],
            ['ID', 'Amount', 'Payment Method', 'Status', 'Created At'],
            'wallet-withdrawals.csv'
        );
    }
}
