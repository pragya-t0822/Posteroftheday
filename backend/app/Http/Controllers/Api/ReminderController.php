<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reminder;
use App\Models\Category;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index(Request $request)
    {
        $query = Reminder::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('occasion', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->where('reminder_date', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->where('reminder_date', '<=', $dateTo);
        }

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
}
