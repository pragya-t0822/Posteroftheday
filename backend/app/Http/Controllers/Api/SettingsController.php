<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $group = $request->input('group');

        $query = Setting::query();
        if ($group) {
            $query->where('group', $group);
        }

        $settings = $query->get()->pluck('value', 'key');

        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable|string',
            'settings.*.group' => 'nullable|string',
        ]);

        foreach ($request->input('settings') as $item) {
            Setting::setValue(
                $item['key'],
                $item['value'] ?? null,
                $item['group'] ?? 'general'
            );
        }

        return response()->json(['message' => 'Settings saved']);
    }

    public function clearAppData(Request $request)
    {
        $request->validate([
            'type' => 'required|in:cache,sessions,temp_files,all',
        ]);

        $type = $request->input('type');
        $cleared = [];

        if (in_array($type, ['cache', 'all'])) {
            \Artisan::call('cache:clear');
            $cleared[] = 'cache';
        }

        if (in_array($type, ['sessions', 'all'])) {
            \Artisan::call('session:flush');
            $cleared[] = 'sessions';
        }

        if (in_array($type, ['temp_files', 'all'])) {
            $files = \Storage::disk('public')->files('temp');
            \Storage::disk('public')->delete($files);
            $cleared[] = 'temp_files';
        }

        return response()->json([
            'message' => 'App data cleared',
            'cleared' => $cleared,
        ]);
    }
}
