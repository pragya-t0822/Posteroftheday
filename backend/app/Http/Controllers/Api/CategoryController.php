<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Frame;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use HasAdvancedFiltering;

    /**
     * Mobile app endpoint — returns only active root categories with active children.
     */
    public function mobileIndex()
    {
        $categories = Category::whereNull('parent_id')
            ->where('is_active', true)
            ->with(['recursiveChildren' => function ($q) {
                $q->where('is_active', true);
            }, 'translations'])
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }

    /**
     * Mobile app endpoint — returns active frames for a category and its descendants.
     */
    public function mobileFrames(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        $categoryId = $request->input('category_id');
        $perPage = $request->input('per_page', 20);

        // Collect the selected category + all active descendant category IDs
        $categoryIds = $this->collectDescendantIds($categoryId);

        $frames = Frame::whereIn('category_id', $categoryIds)
            ->where('is_active', true)
            ->with('translations')
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        // Append full file_url to each frame
        $frames->getCollection()->transform(function ($frame) {
            $frame->file_url = $frame->file_path ? asset('storage/' . $frame->file_path) : null;
            return $frame;
        });

        return response()->json($frames);
    }

    /**
     * Recursively collect a category ID and all its active descendant IDs.
     */
    private function collectDescendantIds(int $categoryId): array
    {
        $ids = [$categoryId];

        $children = Category::where('parent_id', $categoryId)
            ->where('is_active', true)
            ->pluck('id');

        foreach ($children as $childId) {
            $ids = array_merge($ids, $this->collectDescendantIds($childId));
        }

        return $ids;
    }

    public function index()
    {
        $categories = Category::whereNull('parent_id')
            ->with(['recursiveChildren', 'translations'])
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }

    public function flat()
    {
        $categories = Category::with(['parent', 'translations'])
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'sort_order' => 'nullable|integer',
            'is_active' => 'sometimes|boolean',
            'translations' => 'nullable|array',
            'translations.*.language' => 'required_with:translations|string|max:50',
            'translations.*.name' => 'required_with:translations|string|max:255',
        ]);

        $category = Category::create($request->only('name', 'slug', 'description', 'parent_id', 'sort_order', 'is_active'));

        if ($request->has('translations')) {
            foreach ($request->translations as $t) {
                if (!empty($t['language']) && !empty($t['name'])) {
                    $category->translations()->updateOrCreate(
                        ['language' => $t['language']],
                        ['name' => $t['name']]
                    );
                }
            }
        }

        return response()->json($category->load('parent', 'recursiveChildren', 'translations'), 201);
    }

    public function show(Category $category)
    {
        return response()->json($category->load('parent', 'recursiveChildren', 'translations'));
    }

    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:categories,slug,' . $category->id,
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'sort_order' => 'nullable|integer',
            'is_active' => 'sometimes|boolean',
            'translations' => 'nullable|array',
            'translations.*.language' => 'required_with:translations|string|max:50',
            'translations.*.name' => 'required_with:translations|string|max:255',
        ]);

        if ($request->has('parent_id') && $request->parent_id == $category->id) {
            return response()->json(['message' => 'A category cannot be its own parent'], 422);
        }

        if ($request->has('parent_id') && $request->parent_id) {
            if ($this->isDescendant($category->id, $request->parent_id)) {
                return response()->json(['message' => 'Cannot move a category under its own descendant'], 422);
            }
        }

        $category->update($request->only('name', 'slug', 'description', 'parent_id', 'sort_order', 'is_active'));

        if ($request->has('translations')) {
            // Remove translations not in the new list
            $languages = collect($request->translations)->pluck('language')->filter()->all();
            $category->translations()->whereNotIn('language', $languages)->delete();

            foreach ($request->translations as $t) {
                if (!empty($t['language']) && !empty($t['name'])) {
                    $category->translations()->updateOrCreate(
                        ['language' => $t['language']],
                        ['name' => $t['name']]
                    );
                }
            }
        }

        return response()->json($category->load('parent', 'recursiveChildren', 'translations'));
    }

    public function destroy(Category $category)
    {
        $childCount = $category->children()->count();

        if ($childCount > 0) {
            return response()->json([
                'message' => "Cannot delete category with {$childCount} sub-categories. Delete or move them first.",
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }

    private function isDescendant(int $ancestorId, int $targetId): bool
    {
        $category = Category::find($targetId);

        while ($category) {
            if ($category->parent_id === $ancestorId) {
                return true;
            }
            $category = $category->parent;
        }

        return false;
    }
}
