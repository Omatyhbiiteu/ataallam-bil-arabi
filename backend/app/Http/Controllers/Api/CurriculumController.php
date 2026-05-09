<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CurriculumModule;
use Illuminate\Http\Request;

class CurriculumController extends Controller
{
    private function assertLang(string $lang): string
    {
        $lang = strtolower(trim($lang));
        if (! in_array($lang, ['en', 'de'], true)) {
            abort(404);
        }
        return $lang;
    }

    public function index(Request $request, string $lang)
    {
        $lang = $this->assertLang($lang);

        $rows = CurriculumModule::query()
            ->where('lang', $lang)
            ->where('is_active', true)
            ->orderBy('level')
            ->orderBy('sub_level')
            ->orderByDesc('updated_at')
            ->limit(400)
            ->get();

        return response()->json([
            'modules' => $rows->map(fn (CurriculumModule $m) => $this->mapModule($m))->values()->all(),
        ]);
    }

    public function show(Request $request, string $lang, CurriculumModule $module)
    {
        $lang = $this->assertLang($lang);
        if ($module->lang !== $lang || ! $module->is_active) {
            abort(404);
        }

        return response()->json([
            'module' => $this->mapModule($module),
        ]);
    }

    private function mapModule(CurriculumModule $m): array
    {
        return [
            'id' => (string) $m->id,
            'title' => (string) $m->title,
            'level' => (string) $m->level,
            'subLevel' => $m->sub_level ? (string) $m->sub_level : null,
            'lessons' => is_array($m->lessons) ? $m->lessons : [],
        ];
    }
}

