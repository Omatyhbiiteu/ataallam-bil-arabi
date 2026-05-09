<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\LanguageAvailabilitySetting;
use Illuminate\Http\Request;

class LanguageAvailabilityController extends Controller
{
    private function getOrCreate(): LanguageAvailabilitySetting
    {
        $row = LanguageAvailabilitySetting::query()->first();
        if ($row) {
            return $row;
        }

        return LanguageAvailabilitySetting::query()->create([
            'en_enabled' => true,
            'de_enabled' => true,
        ]);
    }

    /** عام للمستخدمين (بدون توكن) */
    public function public()
    {
        $row = $this->getOrCreate();

        return response()->json([
            'availability' => [
                'en' => (bool) $row->en_enabled,
                'de' => (bool) $row->de_enabled,
            ],
        ]);
    }

    /** للمسئول (Sanctum) */
    public function adminShow(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        return $this->public();
    }

    /** للمسئول (Sanctum) */
    public function adminUpdate(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $data = $request->validate([
            'en' => ['required', 'boolean'],
            'de' => ['required', 'boolean'],
        ]);

        $row = $this->getOrCreate();
        $row->update([
            'en_enabled' => (bool) $data['en'],
            'de_enabled' => (bool) $data['de'],
        ]);

        return $this->public();
    }
}

