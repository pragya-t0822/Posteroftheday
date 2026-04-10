<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FrameRequest;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FrameRequestController extends Controller
{
    use HasAdvancedFiltering;

    // Admin: List all frame layer requests with search, filter, pagination
    public function index(Request $request)
    {
        $query = FrameRequest::with(['customer', 'frameLayer']);

        $this->applySearch($query, $request, ['title', 'customer.name', 'customer.email']);
        $this->applyFilters($query, $request, [
            'status' => 'status',
            'customer_id' => 'customer_id',
        ]);
        $this->applyDateRange($query, $request);

        $requests = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        return response()->json($requests);
    }

    // Admin: View single frame layer request
    public function show(string $id)
    {
        $request = FrameRequest::with(['customer', 'frameLayer'])->findOrFail($id);
        return response()->json($request);
    }

    // Admin: Update status, add notes, upload delivered frame
    public function update(Request $request, string $id)
    {
        $frameRequest = FrameRequest::findOrFail($id);

        $request->validate([
            'status' => 'sometimes|in:pending,in_progress,completed,rejected',
            'admin_notes' => 'sometimes|nullable|string|max:1000',
            'frame_layer_id' => 'sometimes|nullable|exists:frame_layers,id',
            'delivered_file' => 'sometimes|nullable|file|image|max:5120',
        ]);

        $data = $request->only('status', 'admin_notes', 'frame_layer_id');

        // Handle delivered file upload
        if ($request->hasFile('delivered_file')) {
            // Delete old file if exists
            if ($frameRequest->delivered_file) {
                Storage::disk('public')->delete($frameRequest->delivered_file);
            }
            $data['delivered_file'] = $request->file('delivered_file')->store('frame-requests', 'public');
        }

        // Set completed_at when status changes to completed
        if ($request->input('status') === 'completed' && $frameRequest->status !== 'completed') {
            $data['completed_at'] = now();
        }

        // Clear completed_at if changing away from completed
        if ($request->has('status') && $request->input('status') !== 'completed' && $frameRequest->status === 'completed') {
            $data['completed_at'] = null;
        }

        $frameRequest->update($data);

        return response()->json($frameRequest->load(['customer', 'frameLayer']));
    }

    // Admin: Delete a frame layer request
    public function destroy(string $id)
    {
        $frameRequest = FrameRequest::findOrFail($id);

        if ($frameRequest->reference_image) {
            Storage::disk('public')->delete($frameRequest->reference_image);
        }
        if ($frameRequest->delivered_file) {
            Storage::disk('public')->delete($frameRequest->delivered_file);
        }

        $frameRequest->delete();
        return response()->json(['message' => 'Frame layer request deleted']);
    }

    // ──────── Customer / Mobile APIs ────────

    // Customer: Submit a new frame layer request
    public function customerStore(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'reference_image' => 'nullable|file|image|max:5120',
        ]);

        $data = [
            'customer_id' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'status' => 'pending',
        ];

        if ($request->hasFile('reference_image')) {
            $data['reference_image'] = $request->file('reference_image')->store('frame-requests/references', 'public');
        }

        $frameRequest = FrameRequest::create($data);
        return response()->json($frameRequest->load('customer'), 201);
    }

    // Customer: List their own frame layer requests
    public function customerIndex(Request $request)
    {
        $query = FrameRequest::with(['frameLayer'])
            ->where('customer_id', $request->user()->id);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $requests = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        return response()->json($requests);
    }

    // Customer: Get their completed/custom frame layers
    public function customerCustomFrames(Request $request)
    {
        $customFrames = FrameRequest::with(['frameLayer'])
            ->where('customer_id', $request->user()->id)
            ->where('status', 'completed')
            ->whereNotNull('delivered_file')
            ->orderByDesc('completed_at')
            ->get();

        return response()->json($customFrames);
    }

    // Admin: Get frame layer requests for a specific customer (used in CustomerDetails)
    public function customerRequests(Request $request, string $customerId)
    {
        $query = FrameRequest::with(['frameLayer'])
            ->where('customer_id', $customerId);

        if ($search = $request->input('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $requests = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        return response()->json($requests);
    }

    public function bulkDelete(Request $request)
    {
        return $this->bulkDestroy(FrameRequest::class, $request);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(FrameRequest::class, $request,
            ['id', 'title', 'status', 'created_at'],
            ['ID', 'Title', 'Status', 'Created At'],
            'frame-requests.csv'
        );
    }
}
