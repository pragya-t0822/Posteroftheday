<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FrameLayer;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FrameLayerController extends Controller
{
    use HasAdvancedFiltering;

    public function index(Request $request)
    {
        $query = FrameLayer::with(['frame.category.translations', 'frame.translations', 'translations']);

        $this->applySearch($query, $request, ['title', 'slug']);
        $this->applyFilters($query, $request, [
            'is_active' => 'is_active',
            'frame_id' => 'frame_id',
            'category_id' => 'frame.category_id',
            'language' => 'translations.language',
        ]);
        $this->applyDateRange($query, $request);

        $query->orderBy('sort_order')->orderByDesc('created_at');

        $perPage = $request->input('per_page', 12);
        $frameLayers = $query->paginate($perPage);

        return response()->json($frameLayers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:frame_layers',
            'frame_id' => 'required|exists:frames,id',
            'layer' => 'required|image|mimes:jpeg,jpg,png,gif,webp,svg|max:5120',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'nullable|integer',
            'parameters' => 'nullable|string',
            'translations' => 'nullable|string',
        ]);

        $file = $request->file('layer');
        $path = $file->store('frame-layers', 'public');

        $parameters = null;
        if ($request->input('parameters')) {
            $parameters = json_decode($request->input('parameters'), true);
        }

        $frameLayer = FrameLayer::create([
            'title' => $request->title,
            'slug' => $request->slug,
            'frame_id' => $request->frame_id,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->input('sort_order', 0),
            'parameters' => $parameters,
        ]);

        $this->syncTranslations($frameLayer, $request->input('translations'));

        return response()->json($frameLayer->load('frame.category.translations', 'frame.translations', 'translations'), 201);
    }

    public function show(FrameLayer $frameLayer)
    {
        return response()->json($frameLayer->load('frame.category.translations', 'frame.translations', 'translations'));
    }

    public function update(Request $request, FrameLayer $frameLayer)
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:frame_layers,slug,' . $frameLayer->id,
            'frame_id' => 'sometimes|exists:frames,id',
            'layer' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp,svg|max:5120',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'nullable|integer',
            'parameters' => 'nullable|string',
            'translations' => 'nullable|string',
        ]);

        $data = $request->only('title', 'slug', 'frame_id', 'is_active', 'sort_order');

        if ($request->has('parameters')) {
            $data['parameters'] = $request->input('parameters')
                ? json_decode($request->input('parameters'), true)
                : null;
        }

        if ($request->hasFile('layer')) {
            if ($frameLayer->file_path && Storage::disk('public')->exists($frameLayer->file_path)) {
                Storage::disk('public')->delete($frameLayer->file_path);
            }

            $file = $request->file('layer');
            $data['file_path'] = $file->store('frame-layers', 'public');
            $data['file_name'] = $file->getClientOriginalName();
            $data['mime_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        }

        $frameLayer->update($data);

        $this->syncTranslations($frameLayer, $request->input('translations'));

        return response()->json($frameLayer->load('frame.category.translations', 'frame.translations', 'translations'));
    }

    public function destroy(FrameLayer $frameLayer)
    {
        try {
            $frameLayer->translations()->delete();

            if ($frameLayer->file_path && Storage::disk('public')->exists($frameLayer->file_path)) {
                Storage::disk('public')->delete($frameLayer->file_path);
            }

            $frameLayer->delete();

            return response()->json(['message' => 'Frame layer deleted']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete frame layer: ' . $e->getMessage()], 500);
        }
    }

    public function download(FrameLayer $frameLayer)
    {
        if (!$frameLayer->file_path || !Storage::disk('public')->exists($frameLayer->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('public')->download($frameLayer->file_path, $frameLayer->file_name ?: basename($frameLayer->file_path));
    }

    public function toggleActive(FrameLayer $frameLayer)
    {
        $frameLayer->update(['is_active' => !$frameLayer->is_active]);

        return response()->json($frameLayer->load('frame.category.translations', 'frame.translations', 'translations'));
    }

    private function syncTranslations(FrameLayer $frameLayer, ?string $translationsJson): void
    {
        if ($translationsJson === null) {
            return;
        }

        $translations = json_decode($translationsJson, true) ?: [];

        $languages = collect($translations)->pluck('language')->filter()->all();
        $frameLayer->translations()->whereNotIn('language', $languages)->delete();

        foreach ($translations as $t) {
            if (!empty($t['language']) && !empty($t['title'])) {
                $frameLayer->translations()->updateOrCreate(
                    ['language' => $t['language']],
                    ['title' => $t['title']]
                );
            }
        }
    }

    public function bulkActivate(Request $request)
    {
        return $this->bulkUpdateField(FrameLayer::class, $request, 'is_active', true);
    }

    public function bulkDeactivate(Request $request)
    {
        return $this->bulkUpdateField(FrameLayer::class, $request, 'is_active', false);
    }

    public function bulkDelete(Request $request)
    {
        return $this->bulkDestroy(FrameLayer::class, $request);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(FrameLayer::class, $request,
            ['id', 'title', 'slug', 'is_active', 'created_at'],
            ['ID', 'Title', 'Slug', 'Active', 'Created At'],
            'frame-layers.csv'
        );
    }
}
