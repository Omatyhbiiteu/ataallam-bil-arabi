<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\CurriculumModule;
use Illuminate\Http\Request;

class AdminCurriculumController extends Controller
{
    private function assertLang(string $lang): string
    {
        $lang = strtolower(trim($lang));
        if (! in_array($lang, ['en', 'de'], true)) {
            abort(404);
        }
        return $lang;
    }

    private function requireAdmin(Request $request): void
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }
    }

    public function index(Request $request, string $lang)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);

        $rows = CurriculumModule::query()
            ->where('lang', $lang)
            ->orderBy('level')
            ->orderBy('sub_level')
            ->orderByDesc('updated_at')
            ->limit(700)
            ->get();

        return response()->json([
            'modules' => $rows->map(fn (CurriculumModule $m) => $this->mapModule($m))->values()->all(),
        ]);
    }

    public function store(Request $request, string $lang)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'level' => ['required', 'string', 'max:32'],
            'subLevel' => ['nullable', 'string', 'max:16'],
            'lessons' => ['nullable', 'array'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $module = CurriculumModule::query()->create([
            'lang' => $lang,
            'title' => $data['title'],
            'level' => $data['level'],
            'sub_level' => $data['subLevel'] ?? null,
            'lessons' => $data['lessons'] ?? [],
            'is_active' => (bool) ($data['isActive'] ?? true),
        ]);

        return response()->json(['module' => $this->mapModule($module)]);
    }

    public function update(Request $request, string $lang, CurriculumModule $module)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);
        if ($module->lang !== $lang) {
            abort(404);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'level' => ['sometimes', 'string', 'max:32'],
            'subLevel' => ['nullable', 'string', 'max:16'],
            'lessons' => ['nullable', 'array'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $module->update([
            'title' => $data['title'] ?? $module->title,
            'level' => $data['level'] ?? $module->level,
            'sub_level' => array_key_exists('subLevel', $data) ? ($data['subLevel'] ?? null) : $module->sub_level,
            'lessons' => array_key_exists('lessons', $data) ? ($data['lessons'] ?? []) : $module->lessons,
            'is_active' => array_key_exists('isActive', $data) ? (bool) $data['isActive'] : $module->is_active,
        ]);

        return response()->json(['module' => $this->mapModule($module)]);
    }

    public function destroy(Request $request, string $lang, CurriculumModule $module)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);
        if ($module->lang !== $lang) {
            abort(404);
        }

        $module->delete();

        return response()->json(['ok' => true]);
    }

    private function mapModule(CurriculumModule $m): array
    {
        return [
            'id' => (string) $m->id,
            'title' => (string) $m->title,
            'level' => (string) $m->level,
            'subLevel' => $m->sub_level ? (string) $m->sub_level : null,
            'lessons' => is_array($m->lessons) ? $m->lessons : [],
            'isActive' => (bool) $m->is_active,
        ];
    }
}

