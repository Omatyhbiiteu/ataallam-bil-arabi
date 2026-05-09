<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\InspirationalSlide;
use Illuminate\Http\Request;

class AdminInspirationalController extends Controller
{
    public function index(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $slides = InspirationalSlide::query()
            ->orderByRaw('sort_order is null') // non-null first
            ->orderBy('sort_order')
            ->orderByDesc('updated_at')
            ->limit(300)
            ->get();

        return response()->json([
            'slides' => $slides->map(fn (InspirationalSlide $s) => [
                'id' => (string) $s->id,
                'text' => (string) $s->text,
                'source' => (string) $s->source,
                'gradient' => (string) $s->gradient,
                'icon' => (string) $s->icon,
                'createdAt' => $s->created_at ? (int) ($s->created_at->getTimestamp() * 1000) : 0,
                'isActive' => (bool) $s->is_active,
                'sortOrder' => $s->sort_order,
            ])->values()->all(),
        ]);
    }

    public function store(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $data = $request->validate([
            'text' => ['required', 'string', 'max:5000'],
            'source' => ['required', 'string', 'max:255'],
            'gradient' => ['required', 'string', 'max:255'],
            'icon' => ['required', 'string', 'max:64'],
            'isActive' => ['sometimes', 'boolean'],
            'sortOrder' => ['nullable', 'integer', 'min:0', 'max:1000000'],
        ]);

        $slide = InspirationalSlide::query()->create([
            'text' => $data['text'],
            'source' => $data['source'],
            'gradient' => $data['gradient'],
            'icon' => $data['icon'],
            'is_active' => (bool) ($data['isActive'] ?? true),
            'sort_order' => $data['sortOrder'] ?? null,
        ]);

        return response()->json([
            'slide' => [
                'id' => (string) $slide->id,
                'text' => (string) $slide->text,
                'source' => (string) $slide->source,
                'gradient' => (string) $slide->gradient,
                'icon' => (string) $slide->icon,
                'createdAt' => $slide->created_at ? (int) ($slide->created_at->getTimestamp() * 1000) : 0,
                'isActive' => (bool) $slide->is_active,
                'sortOrder' => $slide->sort_order,
            ],
        ]);
    }

    public function update(Request $request, InspirationalSlide $slide)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $data = $request->validate([
            'text' => ['sometimes', 'string', 'max:5000'],
            'source' => ['sometimes', 'string', 'max:255'],
            'gradient' => ['sometimes', 'string', 'max:255'],
            'icon' => ['sometimes', 'string', 'max:64'],
            'isActive' => ['sometimes', 'boolean'],
            'sortOrder' => ['nullable', 'integer', 'min:0', 'max:1000000'],
        ]);

        $slide->update([
            'text' => $data['text'] ?? $slide->text,
            'source' => $data['source'] ?? $slide->source,
            'gradient' => $data['gradient'] ?? $slide->gradient,
            'icon' => $data['icon'] ?? $slide->icon,
            'is_active' => array_key_exists('isActive', $data) ? (bool) $data['isActive'] : $slide->is_active,
            'sort_order' => array_key_exists('sortOrder', $data) ? $data['sortOrder'] : $slide->sort_order,
        ]);

        return response()->json([
            'slide' => [
                'id' => (string) $slide->id,
                'text' => (string) $slide->text,
                'source' => (string) $slide->source,
                'gradient' => (string) $slide->gradient,
                'icon' => (string) $slide->icon,
                'createdAt' => $slide->created_at ? (int) ($slide->created_at->getTimestamp() * 1000) : 0,
                'isActive' => (bool) $slide->is_active,
                'sortOrder' => $slide->sort_order,
            ],
        ]);
    }

    public function destroy(Request $request, InspirationalSlide $slide)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $slide->delete();

        return response()->json(['ok' => true]);
    }
}

