<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Frame;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FrameController extends Controller
{
    use HasAdvancedFiltering;

    public function index(Request $request)
    {
        $query = Frame::with(['category.translations', 'translations']);

        $this->applySearch($query, $request, ['title', 'slug']);

        // Category filter: parent categories include direct children, others exact match
        if ($categoryId = $request->input('category_id')) {
            $category = Category::find($categoryId);
            if ($category && $category->children()->exists()) {
                // Parent category: show frames from its direct children
                $childIds = $category->children()->pluck('id')->toArray();
                $query->whereIn('category_id', array_merge([$categoryId], $childIds));
            } else {
                // Leaf category: exact match only
                $query->where('category_id', $categoryId);
            }
        }

        $this->applyFilters($query, $request, [
            'is_active' => 'is_active',
        ]);
        $this->applyDateRange($query, $request);

        $query->orderBy('sort_order')->orderByDesc('created_at');

        $perPage = $request->input('per_page', 12);
        $frames = $query->paginate($perPage);

        return response()->json($frames);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:frames',
            'category_id' => 'required|exists:categories,id',
            'frame' => 'required|image|mimes:jpeg,jpg,png,gif,webp,svg|max:5120',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'nullable|integer',
            'translations' => 'nullable|string',
]);

        $file = $request->file('frame');
        $path = $file->store('frames', 'public');

        $frame = Frame::create([
            'title' => $request->title,
            'slug' => $request->slug,
            'category_id' => $request->category_id,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->input('sort_order', 0),
        ]);

        $this->syncTranslations($frame, $request->input('translations'));

        return response()->json($frame->load('category.translations', 'translations'), 201);
    }

    public function show(Frame $frame)
    {
        return response()->json($frame->load('category.translations', 'translations'));
    }

    public function update(Request $request, Frame $frame)
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:frames,slug,' . $frame->id,
            'category_id' => 'sometimes|exists:categories,id',
            'frame' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp,svg|max:5120',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'nullable|integer',
            'translations' => 'nullable|string',
]);

        $data = $request->only('title', 'slug', 'category_id', 'is_active', 'sort_order');

        if ($request->hasFile('frame')) {
            if ($frame->file_path && Storage::disk('public')->exists($frame->file_path)) {
                Storage::disk('public')->delete($frame->file_path);
            }

            $file = $request->file('frame');
            $data['file_path'] = $file->store('frames', 'public');
            $data['file_name'] = $file->getClientOriginalName();
            $data['mime_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        }

        $frame->update($data);

        $this->syncTranslations($frame, $request->input('translations'));

        return response()->json($frame->load('category.translations', 'translations'));
    }

    public function destroy(Frame $frame)
    {
        try {
            // Delete related layer files from storage
            foreach ($frame->layers as $layer) {
                if ($layer->file_path && Storage::disk('public')->exists($layer->file_path)) {
                    Storage::disk('public')->delete($layer->file_path);
                }
                $layer->translations()->delete();
            }
            $frame->layers()->delete();
            $frame->translations()->delete();

            // Delete the frame file from storage
            if ($frame->file_path && Storage::disk('public')->exists($frame->file_path)) {
                Storage::disk('public')->delete($frame->file_path);
            }

            $frame->delete();

            return response()->json(['message' => 'Frame deleted']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete frame: ' . $e->getMessage()], 500);
        }
    }

    public function download(Frame $frame)
    {
        if (!$frame->file_path || !Storage::disk('public')->exists($frame->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('public')->download($frame->file_path, $frame->file_name ?: basename($frame->file_path));
    }

    public function toggleActive(Frame $frame)
    {
        $frame->update(['is_active' => !$frame->is_active]);

        return response()->json($frame->load('category.translations', 'translations'));
    }

    private function syncTranslations(Frame $frame, ?string $translationsJson): void
    {
        if ($translationsJson === null) {
            return;
        }

        $translations = json_decode($translationsJson, true) ?: [];

        $languages = collect($translations)->pluck('language')->filter()->all();
        $frame->translations()->whereNotIn('language', $languages)->delete();

        foreach ($translations as $t) {
            if (!empty($t['language']) && !empty($t['title'])) {
                $frame->translations()->updateOrCreate(
                    ['language' => $t['language']],
                    ['title' => $t['title']]
                );
            }
        }
    }

    public function bulkActivate(Request $request)
    {
        return $this->bulkUpdateField(Frame::class, $request, 'is_active', true);
    }

    public function bulkDeactivate(Request $request)
    {
        return $this->bulkUpdateField(Frame::class, $request, 'is_active', false);
    }

    public function bulkDelete(Request $request)
    {
        return $this->bulkDestroy(Frame::class, $request);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(Frame::class, $request,
            ['id', 'title', 'slug', 'is_active', 'created_at'],
            ['ID', 'Title', 'Slug', 'Active', 'Created At'],
            'frames.csv'
        );
    }

}
