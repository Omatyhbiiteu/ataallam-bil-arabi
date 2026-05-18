<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\LessonRating;
use App\Models\Story;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $lang = $request->query('lang');
        if ($lang !== null && $lang !== '' && ! in_array($lang, ['en', 'de', 'both'], true)) {
            abort(422, 'lang غير صالح');
        }

        $storyBase = Story::query()->where('is_active', true);
        if (in_array($lang, ['en', 'de'], true)) {
            $storyBase->where('lang', $lang);
        }

        $totalStudents = User::query()->count();

        $activeThreshold = now()->subMinutes(15);
        $activeNow = (int) (DB::table('personal_access_tokens')
            ->where('tokenable_type', User::class)
            ->whereNotNull('last_used_at')
            ->where('last_used_at', '>=', $activeThreshold)
            ->selectRaw('count(distinct tokenable_id) as c')
            ->value('c') ?? 0);

        $weekActive = User::query()->where('updated_at', '>=', now()->subDays(7))->count();
        $completionRateAvg = $totalStudents > 0
            ? (int) round(($weekActive / $totalStudents) * 100)
            : 0;

        $totalMinutes = (int) (clone $storyBase)
            ->selectRaw('SUM(COALESCE(estimated_reading_time, 0) * COALESCE(view_count, 0)) as m')
            ->value('m') ?? 0;
        $totalTimeSpent = (int) max(0, round($totalMinutes / 60));

        $retention = $this->buildRetentionSeries();
        $topStories = $this->buildTopStories(clone $storyBase);
        $difficultQuestions = $this->buildDifficultQuestions(clone $storyBase);
        $lessonRatings = $this->buildLessonRatings($lang);

        $prevWeekUsers = User::query()->where('created_at', '<', now()->subDays(7))->count();
        $totalTrend = $prevWeekUsers > 0
            ? $this->formatTrendPercent((($totalStudents - $prevWeekUsers) / $prevWeekUsers) * 100)
            : '—';

        $prevWindowStart = now()->copy()->subDays(1)->subMinutes(15);
        $prevWindowEnd = now()->copy()->subDays(1);
        $activeYesterday = (int) (DB::table('personal_access_tokens')
            ->where('tokenable_type', User::class)
            ->whereNotNull('last_used_at')
            ->whereBetween('last_used_at', [$prevWindowStart, $prevWindowEnd])
            ->selectRaw('count(distinct tokenable_id) as c')
            ->value('c') ?? 0);
        $activeTrend = $activeYesterday > 0
            ? $this->formatTrendPercent((($activeNow - $activeYesterday) / $activeYesterday) * 100)
            : ($activeNow > 0 ? '+100%' : '—');

        $weekActivePrev = User::query()
            ->where('updated_at', '>=', now()->subDays(14))
            ->where('updated_at', '<', now()->subDays(7))
            ->count();
        $completionTrend = $weekActivePrev > 0
            ? $this->formatTrendPercent((($weekActive - $weekActivePrev) / $weekActivePrev) * 100)
            : '—';

        // لا يوجد تاريخ لـ view_count؛ المقارنة الزمنية لساعات القراءة تبقى غير دقيقة حتى يتوفر تتبع.
        $timeTrend = '—';

        return response()->json([
            'overview' => [
                'totalStudents' => $totalStudents,
                'activeNow' => $activeNow,
                'completionRateAvg' => $completionRateAvg,
                'totalTimeSpent' => $totalTimeSpent,
                'trends' => [
                    'activeNow' => $activeTrend,
                    'totalStudents' => $totalTrend,
                    'completionRateAvg' => $completionTrend,
                    'totalTimeSpent' => $timeTrend,
                ],
            ],
            'retention' => $retention,
            'topStories' => $topStories,
            'difficultQuestions' => $difficultQuestions,
            'lessonRatings' => $lessonRatings,
            'meta' => [
                'completionNote' => 'معدل الإكمال هنا = نسبة المستخدمين الذين حدّثوا ملفهم خلال 7 أيام (تقريب تفاعل).',
                'difficultNote' => 'نقاط الصعوبة من إجابات المستخدمين المسجّلين على أسئلة القصص (نسبة الخطأ = إجابات خاطئة / إجمالي المحاولات).',
                'lang' => $lang ?? 'all',
            ],
        ]);
    }

    private function buildLessonRatings(?string $lang): array
    {
        $query = LessonRating::query();
        if (in_array($lang, ['en', 'de'], true)) {
            $query->where('lang', $lang);
        }

        $totalRatings = (int) (clone $query)->count();
        $averageRating = $totalRatings > 0
            ? round((float) (clone $query)->avg('rating'), 2)
            : 0.0;

        $rows = (clone $query)
            ->selectRaw('
                lang,
                lesson_id,
                MAX(lesson_title) as lesson_title,
                MAX(module_id) as module_id,
                MAX(module_title) as module_title,
                COUNT(*) as ratings_count,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars_5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars_4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars_3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars_2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars_1
            ')
            ->groupBy('lang', 'lesson_id')
            ->orderByDesc('ratings_count')
            ->orderByDesc('average_rating')
            ->limit(120)
            ->get();

        $lessons = $rows->map(function ($row) {
            $average = round((float) $row->average_rating, 2);
            $count = (int) $row->ratings_count;

            return [
                'lang' => (string) $row->lang,
                'lessonId' => (string) $row->lesson_id,
                'lessonTitle' => (string) $row->lesson_title,
                'moduleId' => $row->module_id ? (string) $row->module_id : null,
                'moduleTitle' => $row->module_title ? (string) $row->module_title : null,
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
        })->values();

        $rankable = $lessons->filter(fn (array $lesson) => $lesson['ratingsCount'] >= 5);
        $candidates = $rankable->isNotEmpty() ? $rankable : $lessons;
        $best = $candidates
            ->sort(fn (array $a, array $b) => [$b['averageRating'], $b['ratingsCount']] <=> [$a['averageRating'], $a['ratingsCount']])
            ->first();
        $lowest = $candidates
            ->sort(fn (array $a, array $b) => [$a['averageRating'], -$a['ratingsCount']] <=> [$b['averageRating'], -$b['ratingsCount']])
            ->first();

        return [
            'overview' => [
                'totalRatings' => $totalRatings,
                'ratedLessons' => $rows->count(),
                'averageRating' => $averageRating,
                'satisfaction' => $this->satisfactionFor($averageRating, $totalRatings),
                'bestLesson' => $best ?: null,
                'lowestLesson' => $lowest ?: null,
                'minimumReliableRatings' => 5,
            ],
            'lessons' => $lessons->all(),
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

    private function formatTrendPercent(float $pct): string
    {
        if (! is_finite($pct) || abs($pct) < 0.05) {
            return '0%';
        }
        $rounded = (int) round($pct);

        return ($rounded >= 0 ? '+' : '').$rounded.'%';
    }

    /** آخر 7 أيام — نشط/عائد من جدول user_daily_activity (تسجيل دخول، /me، فتح قصة بتوكن، إجابة اختبار) */
    private function buildRetentionSeries(): array
    {
        $out = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = Carbon::now()->subDays($i)->startOfDay();
            $dayEnd = (clone $day)->endOfDay();
            $dateStr = $day->toDateString();

            $newUsers = User::query()->whereBetween('created_at', [$day, $dayEnd])->count();

            $activeUsers = (int) (DB::table('user_daily_activity')
                ->whereDate('activity_on', $dateStr)
                ->count());

            $returningUsers = (int) (DB::table('user_daily_activity as uda')
                ->join('users as u', 'u.id', '=', 'uda.user_id')
                ->whereDate('uda.activity_on', $dateStr)
                ->where('u.created_at', '<', $day)
                ->count());

            $retentionRate = $activeUsers > 0
                ? (int) round(($returningUsers / $activeUsers) * 100)
                : 0;

            $out[] = [
                'date' => $dateStr,
                'activeUsers' => $activeUsers,
                'newUsers' => $newUsers,
                'returningUsers' => $returningUsers,
                'retentionRate' => $retentionRate,
            ];
        }

        return $out;
    }

    private function buildTopStories($storyQuery): array
    {
        $rows = (clone $storyQuery)
            ->orderByDesc('view_count')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get();

        $list = [];
        foreach ($rows as $s) {
            $views = (int) ($s->view_count ?? 0);
            $diff = (int) ($s->difficulty ?? 5);
            $completions = (int) max(0, round($views * (0.45 + min(0.45, $diff / 30))));
            $completionRate = $views > 0
                ? (int) max(5, min(99, round(($completions / max(1, $views)) * 100)))
                : (int) max(20, min(95, 100 - $diff * 7));

            $list[] = [
                'id' => (string) $s->id,
                'title' => $s->title,
                'views' => $views,
                'completions' => $completions,
                'completionRate' => $completionRate,
                'avgTimeSpent' => (int) max(1, $s->estimated_reading_time ?? 5),
                'likes' => (int) max(0, round($views * 0.04)),
            ];
        }

        return $list;
    }

    /** أعلى نسب خطأ من محاولات المستخدمين المسجّلين في story_question_attempts */
    private function buildDifficultQuestions($storyQuery): array
    {
        $storyIds = (clone $storyQuery)->pluck('id')->all();
        if ($storyIds === []) {
            return [];
        }

        $sub = DB::table('story_question_attempts')
            ->selectRaw('story_id, question_id, COUNT(*) as attempts, SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END) as wrong_count')
            ->whereIn('story_id', $storyIds)
            ->groupBy('story_id', 'question_id');

        $rows = DB::query()
            ->fromSub($sub, 't')
            ->orderByRaw('(t.wrong_count / NULLIF(t.attempts, 0)) DESC')
            ->orderByDesc('t.attempts')
            ->limit(5)
            ->get();

        if ($rows->isEmpty()) {
            return [];
        }

        $byId = Story::query()
            ->whereIn('id', $rows->pluck('story_id')->unique()->values()->all())
            ->get()
            ->keyBy('id');

        $out = [];
        foreach ($rows as $row) {
            $story = $byId->get($row->story_id);
            if (! $story) {
                continue;
            }
            $text = '';
            foreach (is_array($story->questions) ? $story->questions : [] as $q) {
                if (! is_array($q)) {
                    continue;
                }
                if ((string) ($q['id'] ?? '') === (string) $row->question_id) {
                    $text = (string) ($q['text'] ?? $q['question'] ?? '');
                    break;
                }
            }
            if (trim($text) === '') {
                continue;
            }

            $attempts = (int) $row->attempts;
            $wrong = (int) $row->wrong_count;
            $errorRate = $attempts > 0 ? (int) round(($wrong / $attempts) * 100) : 0;

            $difficulty = 'Medium';
            if ($errorRate >= 72) {
                $difficulty = 'Hard';
            } elseif ($errorRate < 45) {
                $difficulty = 'Easy';
            }

            $out[] = [
                'id' => (string) $row->question_id,
                'storyTitle' => $story->title,
                'questionText' => $text,
                'errorRate' => $errorRate,
                'attempts' => $attempts,
                'difficulty' => $difficulty,
            ];
        }

        return $out;
    }
}
