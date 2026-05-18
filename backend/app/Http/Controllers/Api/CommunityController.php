<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserCommunityStat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommunityController extends Controller
{
    /** يطابق صيغة لوحة الشرف: نشاط البطاقات + القصص + الكويزات + XP الألعاب المكتسب فعلياً. */
    private function xpFromParts(int $reviews, int $mastered, int $stories, int $quizTotal, int $gameXp): int
    {
        return ($reviews * 2) + ($mastered * 5) + ($stories * 10) + $quizTotal + $gameXp;
    }

    private function normalizeLang(string $lang): ?string
    {
        $l = strtolower($lang);

        return in_array($l, ['en', 'de'], true) ? $l : null;
    }

    /**
     * @return array<int, array{user_id: int, xp: int, streak: int, stories: int, mastered: int, reviews: int, quiz_total: int, quiz_avg_percent: int}>
     */
    private function buildParticipantRows(string $lang): array
    {
        $cardStats = DB::table('content_cards')
            ->where('lang', $lang)
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->selectRaw('user_id, SUM(reviews) as sum_reviews, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as mastered_count', ['mastered'])
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->user_id => $row]);

        $syncStats = UserCommunityStat::query()->where('lang', $lang)->get()->mapWithKeys(fn ($row) => [(int) $row->user_id => $row]);

        $gameStats = DB::table('game_attempts')
            ->where('lang', $lang)
            ->whereNotNull('completed_at')
            ->groupBy('user_id')
            ->selectRaw('user_id, SUM(xp_earned) as game_xp')
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->user_id => $row]);

        $idsFromProfile = User::query()
            ->where('target_language', $lang)
            ->pluck('id')
            ->map(fn ($id) => (int) $id);

        $ids = $cardStats->keys()
            ->merge($syncStats->keys())
            ->merge($gameStats->keys())
            ->merge($idsFromProfile)
            ->unique()
            ->sort()
            ->values()
            ->all();

        $rows = [];
        foreach ($ids as $uid) {
            $uid = (int) $uid;
            $c = $cardStats->get($uid);
            $s = $syncStats->get($uid);
            $g = $gameStats->get($uid);

            $reviews = $c ? (int) $c->sum_reviews : 0;
            $mastered = $c ? (int) $c->mastered_count : 0;
            $stories = $s ? (int) $s->stories_completed : 0;
            $quizTotal = $s ? (int) $s->quiz_total : 0;
            $quizAvg = $s ? (int) $s->quiz_avg_percent : 0;
            $streak = $s ? (int) $s->streak_days : 0;
            $gameXp = $g ? (int) $g->game_xp : 0;

            $rows[] = [
                'user_id' => $uid,
                'xp' => $this->xpFromParts($reviews, $mastered, $stories, $quizTotal, $gameXp),
                'streak' => $streak,
                'stories' => $stories,
                'mastered' => $mastered,
                'reviews' => $reviews,
                'quiz_total' => $quizTotal,
                'quiz_avg_percent' => $quizAvg,
                'game_xp' => $gameXp,
            ];
        }

        return $rows;
    }

    private function percentileBelow(array $values, int $mine): int
    {
        if ($values === []) {
            return 0;
        }

        $below = count(array_filter($values, fn ($v) => $v < $mine));

        return (int) round(($below / count($values)) * 100);
    }

    public function sync(Request $request, string $lang): JsonResponse
    {
        $langNorm = $this->normalizeLang($lang);
        if ($langNorm === null) {
            return response()->json(['message' => 'لغة غير مدعومة'], 422);
        }

        $data = $request->validate([
            'stories_completed' => 'nullable|integer|min:0|max:10000',
            'quiz_total' => 'nullable|integer|min:0|max:100000',
            'quiz_avg_percent' => 'nullable|integer|min:0|max:100',
            'streak_days' => 'nullable|integer|min:0|max:10000',
        ]);

        $user = $request->user();
        UserCommunityStat::updateOrCreate(
            ['user_id' => $user->id, 'lang' => $langNorm],
            [
                'stories_completed' => (int) ($data['stories_completed'] ?? 0),
                'quiz_total' => (int) ($data['quiz_total'] ?? 0),
                'quiz_avg_percent' => (int) ($data['quiz_avg_percent'] ?? 0),
                'streak_days' => (int) ($data['streak_days'] ?? 0),
            ]
        );

        return response()->json(['ok' => true]);
    }

    public function show(Request $request, string $lang): JsonResponse
    {
        $langNorm = $this->normalizeLang($lang);
        if ($langNorm === null) {
            return response()->json(['message' => 'لغة غير مدعومة'], 422);
        }

        /** لوحة الشرف: كل من لديه بطاقات أو إحصاءات مزامنة أو target_language يطابق اللغة (يظهر الجميع بما فيهم0 XP). */
        $rows = $this->buildParticipantRows($langNorm);

        usort($rows, function ($a, $b) {
            if ($a['xp'] !== $b['xp']) {
                return $b['xp'] <=> $a['xp'];
            }

            return $a['user_id'] <=> $b['user_id'];
        });

        $authId = (int) $request->user()->id;
        $myRow = null;
        foreach ($rows as $r) {
            if ($r['user_id'] === $authId) {
                $myRow = $r;
                break;
            }
        }

        $userRank = 0;
        if ($myRow !== null) {
            foreach ($rows as $i => $r) {
                if ($r['user_id'] === $authId) {
                    $userRank = $i + 1;
                    break;
                }
            }
        } else {
            $userRank = count($rows) + 1;
        }

        $storyValues = array_column($rows, 'stories');
        $masteredValues = array_column($rows, 'mastered');
        $myStories = $myRow['stories'] ?? 0;
        $myMastered = $myRow['mastered'] ?? 0;

        $ahead = null;
        if ($myRow !== null && $userRank > 1) {
            $above = $rows[$userRank - 2];
            $u = User::query()->find($above['user_id']);
            if ($u) {
                $need = max(0, $above['xp'] - $myRow['xp']);
                $ahead = [
                    'user_id' => $u->id,
                    'name' => $u->name,
                    'xp_needed' => $need,
                ];
            }
        }

        $users = User::query()->whereIn('id', array_column($rows, 'user_id'))->get()->keyBy('id');

        $leaderboard = [];
        foreach ($rows as $i => $r) {
            $u = $users->get($r['user_id']);
            if (! $u) {
                continue;
            }
            $leaderboard[] = [
                'rank' => $i + 1,
                'user_id' => $u->id,
                'name' => $u->name,
                'avatar' => $u->avatar,
                'xp' => $r['xp'],
                'streak' => $r['streak'],
                'stories' => $r['stories'],
                'mastered' => $r['mastered'],
                'reviews' => $r['reviews'],
                'quiz_total' => $r['quiz_total'],
                'quiz_avg_percent' => $r['quiz_avg_percent'],
                'game_xp' => $r['game_xp'] ?? 0,
                'is_you' => $u->id === $authId,
            ];
        }

        return response()->json([
            'lang' => $langNorm,
            'period' => 'all',
            'total_members' => count($rows),
            'your_rank' => $userRank,
            'your_xp' => $myRow['xp'] ?? 0,
            'your_streak' => $myRow['streak'] ?? 0,
            'percentiles' => [
                'stories' => $this->percentileBelow($storyValues, $myStories),
                'mastered' => $this->percentileBelow($masteredValues, $myMastered),
            ],
            'ahead' => $ahead,
            'leaderboard' => $leaderboard,
        ]);
    }
}
