<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
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
