<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\CurriculumModule;
use App\Models\LessonRating;
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
        $ratingsByLesson = $this->ratingSummaryByLesson($lang);

        return response()->json([
            'modules' => $rows->map(fn (CurriculumModule $m) => $this->mapModule($m, $ratingsByLesson))->values()->all(),
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

    private function mapModule(CurriculumModule $m, array $ratingsByLesson = []): array
    {
        $lessons = is_array($m->lessons) ? $m->lessons : [];
        $lessons = array_map(function ($lesson) use ($ratingsByLesson) {
            if (! is_array($lesson)) {
                return $lesson;
            }

            $lessonId = (string) ($lesson['id'] ?? '');
            if ($lessonId !== '' && isset($ratingsByLesson[$lessonId])) {
                $lesson['ratingSummary'] = $ratingsByLesson[$lessonId];
            }

            return $lesson;
        }, $lessons);

        return [
            'id' => (string) $m->id,
            'title' => (string) $m->title,
            'level' => (string) $m->level,
            'subLevel' => $m->sub_level ? (string) $m->sub_level : null,
            'lessons' => $lessons,
            'isActive' => (bool) $m->is_active,
        ];
    }

    private function ratingSummaryByLesson(string $lang): array
    {
        $rows = LessonRating::query()
            ->where('lang', $lang)
            ->selectRaw('
                lesson_id,
                COUNT(*) as ratings_count,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars_5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars_4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars_3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars_2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars_1
            ')
            ->groupBy('lesson_id')
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $average = round((float) $row->average_rating, 2);
            $count = (int) $row->ratings_count;
            $out[(string) $row->lesson_id] = [
                'averageRating' => $average,
                'ratingsCount' => $count,
                'distribution' => [
                    '5' => (int) $row->stars_5,
                    '4' => (int) $row->stars_4,
                    '3' => (int) $row->stars_3,
                    '2' => (int) $row->stars_2,
                    '1' => (int) $row->stars_1,
                ],
                'satisfaction' => $this->satisfactionFor($average, $count),
            ];
        }

        return $out;
    }

    private function satisfactionFor(float $average, int $count): array
    {
        if ($count < 5) {
            return ['status' => 'insufficient', 'label' => 'بيانات غير كافية', 'color' => 'gray'];
        }
        if ($average >= 4.5) {
            return ['status' => 'excellent', 'label' => 'ممتاز', 'color' => 'green'];
        }
        if ($average >= 4) {
            return ['status' => 'very_good', 'label' => 'جيد جدا', 'color' => 'emerald'];
        }
        if ($average >= 3) {
            return ['status' => 'average', 'label' => 'متوسط', 'color' => 'amber'];
        }
        if ($average >= 2) {
            return ['status' => 'weak', 'label' => 'ضعيف', 'color' => 'orange'];
        }

        return ['status' => 'very_bad', 'label' => 'سيئ جدا', 'color' => 'red'];
    }
}

