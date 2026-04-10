<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FollowUp;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;

class FollowUpController extends Controller
{
    use HasAdvancedFiltering;

    public function index(Request $request)
    {
        $query = FollowUp::with(['customer:id,name,email,phone', 'creator:id,name']);

        $this->applySearch($query, $request, ['notes', 'customer.name', 'customer.email', 'customer.phone']);
        $this->applyFilters($query, $request, [
            'status' => 'status',
            'customer_id' => 'customer_id',
        ]);
        $this->applyDateRange($query, $request, 'scheduled_at');

        $followUps = $query->orderByDesc('scheduled_at')
            ->paginate($request->input('per_page', 10));

        return response()->json($followUps);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id'  => 'required|exists:users,id',
            'notes'        => 'required|string|max:2000',
            'scheduled_at' => 'required|date',
            'status'       => 'sometimes|in:pending,completed,missed',
        ]);

        $followUp = FollowUp::create([
            ...$request->only('customer_id', 'notes', 'scheduled_at', 'status'),
            'created_by' => $request->user()->id,
        ]);

        $followUp->load(['customer:id,name,email,phone', 'creator:id,name']);

        return response()->json($followUp, 201);
    }

    public function show(string $id)
    {
        $followUp = FollowUp::with(['customer:id,name,email,phone', 'creator:id,name'])->findOrFail($id);
        return response()->json($followUp);
    }

    public function update(Request $request, string $id)
    {
        $followUp = FollowUp::findOrFail($id);

        $request->validate([
            'customer_id'  => 'sometimes|exists:users,id',
            'notes'        => 'sometimes|string|max:2000',
            'scheduled_at' => 'sometimes|date',
            'status'       => 'sometimes|in:pending,completed,missed',
        ]);

        $followUp->update($request->only('customer_id', 'notes', 'scheduled_at', 'status'));
        $followUp->load(['customer:id,name,email,phone', 'creator:id,name']);

        return response()->json($followUp);
    }

    public function destroy(string $id)
    {
        $followUp = FollowUp::findOrFail($id);
        $followUp->delete();
        return response()->json(['message' => 'Follow-up deleted']);
    }

    public function markCompleted(string $id)
    {
        $followUp = FollowUp::findOrFail($id);
        $followUp->update(['status' => 'completed']);
        $followUp->load(['customer:id,name,email,phone', 'creator:id,name']);
        return response()->json($followUp);
    }

    public function upcoming(Request $request)
    {
        $followUps = FollowUp::with(['customer:id,name,email,phone'])
            ->where('status', 'pending')
            ->where('scheduled_at', '>=', now())
            ->where('scheduled_at', '<=', now()->addHours(24))
            ->orderBy('scheduled_at')
            ->limit(10)
            ->get();

        return response()->json($followUps);
    }

    public function bulkDelete(Request $request)
    {
        return $this->bulkDestroy(FollowUp::class, $request);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(FollowUp::class, $request,
            ['id', 'notes', 'status', 'scheduled_at', 'created_at'],
            ['ID', 'Notes', 'Status', 'Scheduled At', 'Created At'],
            'follow-ups.csv'
        );
    }
}
