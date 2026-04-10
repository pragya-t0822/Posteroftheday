<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reminder;
use App\Models\Category;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    use HasAdvancedFiltering;

    public function index(Request $request)
    {
        $query = Reminder::query();

        $this->applySearch($query, $request, ['title', 'occasion']);

        // Status filter maps active/inactive to is_active boolean
        if ($status = $request->input('status')) {
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $this->applyDateRange($query, $request, 'reminder_date');

        $reminders = $query->orderByDesc('reminder_date')
            ->paginate($request->input('per_page', 10));

        // Append categories to each reminder
        $reminders->getCollection()->transform(function ($reminder) {
            $reminder->categories = $reminder->categories;
            return $reminder;
        });

        return response()->json($reminders);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'occasion' => 'nullable|string|max:255',
            'reminder_date' => 'required|date',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:categories,id',
            'is_active' => 'sometimes|boolean',
            'description' => 'nullable|string|max:2000',
        ]);

        $reminder = Reminder::create($request->only(
            'title', 'occasion', 'reminder_date', 'category_ids', 'is_active', 'description'
        ));

        $reminder->categories = $reminder->categories;

        return response()->json($reminder, 201);
    }

    public function show(string $id)
    {
        $reminder = Reminder::findOrFail($id);
        $reminder->categories = $reminder->categories;
        return response()->json($reminder);
    }

    public function update(Request $request, string $id)
    {
        $reminder = Reminder::findOrFail($id);

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'occasion' => 'sometimes|nullable|string|max:255',
            'reminder_date' => 'sometimes|date',
            'category_ids' => 'sometimes|nullable|array',
            'category_ids.*' => 'exists:categories,id',
            'is_active' => 'sometimes|boolean',
            'description' => 'sometimes|nullable|string|max:2000',
        ]);

        $reminder->update($request->only(
            'title', 'occasion', 'reminder_date', 'category_ids', 'is_active', 'description'
        ));

        $reminder->categories = $reminder->categories;

        return response()->json($reminder);
    }

    public function destroy(string $id)
    {
        $reminder = Reminder::findOrFail($id);
        $reminder->delete();
        return response()->json(['message' => 'Reminder deleted']);
    }

    public function toggleActive(string $id)
    {
        $reminder = Reminder::findOrFail($id);
        $reminder->update(['is_active' => !$reminder->is_active]);
        $reminder->categories = $reminder->categories;
        return response()->json($reminder);
    }

    // Mobile API: Get today's priority categories from active reminders
    public function todayPriority()
    {
        $today = now()->toDateString();

        $reminders = Reminder::where('reminder_date', $today)
            ->where('is_active', true)
            ->get();

        $categoryIds = $reminders->pluck('category_ids')->flatten()->filter()->unique()->values()->toArray();

        $categories = Category::with(['translations', 'children.translations'])
            ->whereIn('id', $categoryIds)
            ->where('is_active', true)
            ->get();

        return response()->json([
            'reminders' => $reminders,
            'priority_categories' => $categories,
        ]);
    }

    public function bulkActivate(Request $request)
    {
        return $this->bulkUpdateField(Reminder::class, $request, 'is_active', true);
    }

    public function bulkDeactivate(Request $request)
    {
        return $this->bulkUpdateField(Reminder::class, $request, 'is_active', false);
    }

    public function bulkDelete(Request $request)
    {
        return $this->bulkDestroy(Reminder::class, $request);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(Reminder::class, $request,
            ['id', 'title', 'occasion', 'is_active', 'reminder_date', 'created_at'],
            ['ID', 'Title', 'Occasion', 'Active', 'Reminder Date', 'Created At'],
            'reminders.csv'
        );
    }
}
