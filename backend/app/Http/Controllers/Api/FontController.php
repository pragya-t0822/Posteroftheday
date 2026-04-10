<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Font;
use App\Traits\HasAdvancedFiltering;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FontController extends Controller
{
    use HasAdvancedFiltering;

    public function index(Request $request)
    {
        $query = Font::query();

        $this->applySearch($query, $request, ['name', 'family']);
        $this->applyFilters($query, $request, ['is_active' => 'is_active']);
        $this->applyDateRange($query, $request);

        $query->orderBy('sort_order')->orderByDesc('created_at');

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'family' => 'required|string|max:255',
            'font_file' => 'required|file|mimes:ttf,otf,woff,woff2|max:5120',
            'is_active' => 'sometimes|boolean',
            'is_default' => 'sometimes|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $file = $request->file('font_file');
        $path = $file->store('fonts', 'public');

        if ($request->boolean('is_default')) {
            Font::where('is_default', true)->update(['is_default' => false]);
        }

        $font = Font::create([
            'name' => $request->name,
            'family' => $request->family,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'is_active' => $request->boolean('is_active', true),
            'is_default' => $request->boolean('is_default', false),
            'sort_order' => $request->input('sort_order', 0),
        ]);

        return response()->json($font, 201);
    }

    public function show(Font $font)
    {
        return response()->json($font);
    }

    public function update(Request $request, Font $font)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'family' => 'sometimes|string|max:255',
            'font_file' => 'nullable|file|mimes:ttf,otf,woff,woff2|max:5120',
            'is_active' => 'sometimes|boolean',
            'is_default' => 'sometimes|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $data = $request->only('name', 'family', 'is_active', 'is_default', 'sort_order');

        if ($request->boolean('is_default') && !$font->is_default) {
            Font::where('is_default', true)->update(['is_default' => false]);
        }

        if ($request->hasFile('font_file')) {
            if ($font->file_path && Storage::disk('public')->exists($font->file_path)) {
                Storage::disk('public')->delete($font->file_path);
            }

            $file = $request->file('font_file');
            $data['file_path'] = $file->store('fonts', 'public');
            $data['file_name'] = $file->getClientOriginalName();
            $data['mime_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        }

        $font->update($data);

        return response()->json($font);
    }

    public function destroy(Font $font)
    {
        if ($font->file_path && Storage::disk('public')->exists($font->file_path)) {
            Storage::disk('public')->delete($font->file_path);
        }

        $font->delete();

        return response()->json(['message' => 'Font deleted']);
    }

    public function toggleActive(Font $font)
    {
        $font->update(['is_active' => !$font->is_active]);

        return response()->json($font);
    }

    public function setDefault(Font $font)
    {
        Font::where('is_default', true)->update(['is_default' => false]);
        $font->update(['is_default' => true]);

        return response()->json($font);
    }

    public function bulkActivate(Request $request)
    {
        return $this->bulkUpdateField(Font::class, $request, 'is_active', true);
    }

    public function bulkDeactivate(Request $request)
    {
        return $this->bulkUpdateField(Font::class, $request, 'is_active', false);
    }

    public function bulkDelete(Request $request)
    {
        return $this->bulkDestroy(Font::class, $request);
    }

    public function export(Request $request)
    {
        return $this->exportCsv(Font::class, $request,
            ['id', 'name', 'family', 'is_active', 'created_at'],
            ['ID', 'Name', 'Family', 'Active', 'Created At'],
            'fonts.csv'
        );
    }
}
