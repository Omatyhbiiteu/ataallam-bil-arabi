<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CurriculumModule;
use App\Models\LessonRating;
use App\Models\User;
use Illuminate\Http\Request;

class UserLessonRatingController extends Controller
{
    public function index(Request $request)
    {
        $user = $this->requireUser($request);
        $lang = $this->assertLang((string) $request->query('lang', 'en'));

        $ratings = LessonRating::query()
            ->where('user_id', $user->id)
            ->where('lang', $lang)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (LessonRating $rating) => [
                'lessonId' => $rating->lesson_id,
                'rating' => (int) $rating->rating,
                'updatedAt' => optional($rating->updated_at)->toISOString(),
            ])
            ->values()
            ->all();

        return response()->json(['ratings' => $ratings]);
    }

    public function store(Request $request)
    {
        $user = $this->requireUser($request);

        $data = $request->validate([
            'lang' => ['required', 'string', 'in:en,de'],
            'lessonId' => ['required', 'string', 'max:191'],
            'lessonTitle' => ['nullable', 'string', 'max:255'],
            'moduleId' => ['nullable', 'string', 'max:191'],
            'moduleTitle' => ['nullable', 'string', 'max:255'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $snapshot = $this->findLessonSnapshot($data['lang'], $data['lessonId']);
        if ($snapshot === null) {
            $snapshot = [
                'moduleId' => $data['moduleId'] ?? null,
                'moduleTitle' => $data['moduleTitle'] ?? null,
                'lessonTitle' => $data['lessonTitle'] ?? 'Lesson',
            ];
        }

        $rating = LessonRating::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'lang' => $data['lang'],
                'lesson_id' => $data['lessonId'],
            ],
            [
                'module_id' => $snapshot['moduleId'],
                'module_title' => $snapshot['moduleTitle'],
                'lesson_title' => $snapshot['lessonTitle'],
                'rating' => (int) $data['rating'],
            ],
        );

        return response()->json([
            'rating' => [
                'lessonId' => $rating->lesson_id,
                'rating' => (int) $rating->rating,
                'updatedAt' => optional($rating->updated_at)->toISOString(),
            ],
            'summary' => $this->buildLessonSummary($data['lang'], $data['lessonId']),
        ]);
    }

    private function requireUser(Request $request): User
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(403);
        }

        return $user;
    }

    private function assertLang(string $lang): string
    {
        $lang = strtolower(trim($lang));
        if (! in_array($lang, ['en', 'de'], true)) {
            abort(404);
        }

        return $lang;
    }

    private function findLessonSnapshot(string $lang, string $lessonId): ?array
    {
        $modules = CurriculumModule::query()
            ->where('lang', $lang)
            ->where('is_active', true)
            ->orderBy('level')
            ->orderBy('sub_level')
            ->get();

        foreach ($modules as $module) {
            foreach (is_array($module->lessons) ? $module->lessons : [] as $lesson) {
                if (! is_array($lesson)) {
                    continue;
                }

                if ((string) ($lesson['id'] ?? '') !== $lessonId) {
                    continue;
                }

                return [
                    'moduleId' => (string) $module->id,
                    'moduleTitle' => (string) $module->title,
                    'lessonTitle' => (string) ($lesson['title'] ?? 'Lesson'),
                ];
            }
        }

        return null;
    }

    private function buildLessonSummary(string $lang, string $lessonId): array
    {
        $rows = LessonRating::query()
            ->where('lang', $lang)
            ->where('lesson_id', $lessonId)
            ->get(['rating']);

        $count = $rows->count();
        $avg = $count > 0 ? round((float) $rows->avg('rating'), 2) : 0.0;
        $distribution = [];
        for ($star = 5; $star >= 1; $star--) {
            $distribution[(string) $star] = $rows->where('rating', $star)->count();
        }

        return [
            'averageRating' => $avg,
            'ratingsCount' => $count,
            'distribution' => $distribution,
            'satisfaction' => $this->satisfactionFor($avg, $count),
        ];
    }

    private function satisfactionFor(float $average, int $count): array
    {
        if ($count < 5) {
            return [
                'status' => 'insufficient',
                'label' => 'بيانات غير كافية',
                'color' => 'gray',
                'description' => 'انتظر المزيد من التقييمات قبل الحكم على جودة الدرس.',
            ];
        }

        if ($average >= 4.5) {
            return [
                'status' => 'excellent',
                'label' => 'ممتاز',
                'color' => 'green',
                'description' => 'رد فعل الطلاب قوي جدا. الدرس واضح ومحبوب.',
            ];
        }

        if ($average >= 4) {
            return [
                'status' => 'very_good',
                'label' => 'جيد جدا',
                'color' => 'emerald',
                'description' => 'رد الفعل إيجابي. الدرس يعمل بشكل جيد.',
            ];
        }

        if ($average >= 3) {
            return [
                'status' => 'average',
                'label' => 'متوسط',
                'color' => 'amber',
                'description' => 'الدرس مقبول، لكن يستحق مراجعة الشرح أو الأمثلة.',
            ];
        }

        if ($average >= 2) {
            return [
                'status' => 'weak',
                'label' => 'ضعيف',
                'color' => 'orange',
                'description' => 'يوجد عدم رضا واضح. راجع بنية الدرس والاختبار.',
            ];
        }

        return [
            'status' => 'very_bad',
            'label' => 'سيئ جدا',
            'color' => 'red',
            'description' => 'الدرس يحتاج مراجعة عاجلة من المحتوى إلى طريقة العرض.',
        ];
    }
}
