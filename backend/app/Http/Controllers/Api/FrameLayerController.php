<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FrameLayer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FrameLayerController extends Controller
{
    public function index(Request $request)
    {
        $query = FrameLayer::with(['frame.category.translations', 'frame.translations', 'translations']);

        // Server-side search
        if ($search = $request->input('search')) {
            $query->whereAny(['title', 'slug'], 'like', "%{$search}%");
        }

        // Filter by frame
        if ($frameId = $request->input('frame_id')) {
            $query->where('frame_id', $frameId);
        }

        // Filter by category (through frame)
        if ($categoryId = $request->input('category_id')) {
            $query->whereHas('frame', function ($q) use ($categoryId) {
                $q->where('category_id', $categoryId);
            });
        }

        // Filter by language (layers that have a translation in this language)
        if ($language = $request->input('language')) {
            $query->whereHas('translations', function ($q) use ($language) {
                $q->where('language', $language);
            });
        }

        // Filter by status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

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
        if ($frameLayer->file_path && Storage::disk('public')->exists($frameLayer->file_path)) {
            Storage::disk('public')->delete($frameLayer->file_path);
        }

        $frameLayer->delete();

        return response()->json(['message' => 'Frame layer deleted']);
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
}
