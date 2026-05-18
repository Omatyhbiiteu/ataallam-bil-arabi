<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameAttempt;
use App\Models\GameQuestion;
use App\Models\GameSet;
use App\Models\User;
use App\Services\UserActivityTracker;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserGamesController extends Controller
{
    private const CAIRO_TZ = 'Africa/Cairo';

    private function effectivePlan(User $user): string
    {
        $plan = $user->plan ?? 'free';
        if (! in_array($plan, ['silver', 'pro', 'enterprise'], true)) {
            return 'free';
        }

        return $user->hasActivePaidPlan() ? $plan : 'free';
    }

    private function dailyLimitForPlan(string $plan): ?int
    {
        return match ($plan) {
            'silver' => 25,
            'pro', 'enterprise' => null,
            default => 5,
        };
    }

    private function resetHoursForPlan(string $plan): ?int
    {
        return match ($plan) {
            'silver' => 12,
            'pro', 'enterprise' => null,
            default => 24,
        };
    }

    private function todayCairo(): Carbon
    {
        return Carbon::now(self::CAIRO_TZ)->startOfDay();
    }

    private function usageFor(User $user): array
    {
        $plan = $this->effectivePlan($user);
        $limit = $this->dailyLimitForPlan($plan);
        $resetHours = $this->resetHoursForPlan($plan);
        $nowCairo = Carbon::now(self::CAIRO_TZ);
        $today = $nowCairo->copy()->startOfDay();

        if ($limit === null || $resetHours === null) {
            return [
                'plan' => $plan,
                'limit' => null,
                'used' => 0,
                'remaining' => null,
                'unlimited' => true,
                'usageDate' => $today->toDateString(),
                'resetAt' => $nowCairo->copy()->addYear()->toIso8601String(),
                'nextAttemptAt' => null,
                'resetHours' => null,
                'cooldownActive' => false,
            ];
        }

        $cutoff = $nowCairo->copy()->subHours($resetHours * 2);
        $attempts = GameAttempt::query()
            ->where('user_id', $user->id)
            ->where('started_at', '>=', $cutoff->copy()->setTimezone(config('app.timezone', 'UTC')))
            ->orderBy('started_at')
            ->get(['started_at']);

        $usedInCurrentCycle = 0;
        $cycleStartAt = null;
        $lockUntil = null;
        foreach ($attempts as $attempt) {
            if (! $attempt->started_at) {
                continue;
            }

            $startedAt = $attempt->started_at->copy()->setTimezone(self::CAIRO_TZ);
            if ($lockUntil instanceof Carbon && $startedAt->lt($lockUntil)) {
                continue;
            }
            if ($lockUntil instanceof Carbon && $startedAt->gte($lockUntil)) {
                $lockUntil = null;
                $usedInCurrentCycle = 0;
                $cycleStartAt = null;
            }

            if (! $cycleStartAt instanceof Carbon || $startedAt->gte($cycleStartAt->copy()->addHours($resetHours))) {
                $cycleStartAt = $startedAt->copy();
                $usedInCurrentCycle = 0;
            }

            $usedInCurrentCycle++;
            if ($usedInCurrentCycle >= $limit) {
                $lockUntil = $startedAt->copy()->addHours($resetHours);
                $usedInCurrentCycle = 0;
                $cycleStartAt = null;
            }
        }

        $cooldownActive = $lockUntil instanceof Carbon && $nowCairo->lt($lockUntil);
        if (! $cooldownActive && $cycleStartAt instanceof Carbon && $nowCairo->gte($cycleStartAt->copy()->addHours($resetHours))) {
            $cycleStartAt = null;
            $usedInCurrentCycle = 0;
        }

        $used = $cooldownActive ? $limit : $usedInCurrentCycle;
        $resetAt = $cooldownActive
            ? $lockUntil
            : ($cycleStartAt instanceof Carbon ? $cycleStartAt->copy()->addHours($resetHours) : $nowCairo->copy()->addHours($resetHours));

        return [
            'plan' => $plan,
            'limit' => $limit,
            'used' => $used,
            'remaining' => max(0, $limit - $used),
            'unlimited' => false,
            'usageDate' => $today->toDateString(),
            'resetAt' => $resetAt->toIso8601String(),
            'nextAttemptAt' => $cooldownActive ? $resetAt->toIso8601String() : null,
            'resetHours' => $resetHours,
            'cooldownActive' => $cooldownActive,
        ];
    }

    public function usage(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(403);
        }

        return response()->json(['usage' => $this->usageFor($user)]);
    }

    public function start(Request $request, GameSet $game): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(403);
        }
        if (! $game->is_active || ! in_array($game->lang, ['en', 'de'], true)) {
            abort(404);
        }

        $usage = $this->usageFor($user);
        if (! $usage['unlimited'] && $usage['remaining'] <= 0) {
            return response()->json([
                'message' => 'تم استهلاك عدد محاولات الألعاب اليومية لهذه الباقة.',
                'code' => 'game_limit_reached',
                'usage' => $usage,
            ], 429);
        }

        $questions = $game->questions()
            ->where('is_active', true)
            ->limit(20)
            ->get();
        if ($questions->isEmpty()) {
            return response()->json(['message' => 'لا توجد أسئلة متاحة لهذه اللعبة حالياً.'], 422);
        }

        $today = $this->todayCairo();
        $attempt = GameAttempt::query()->create([
            'user_id' => $user->id,
            'game_set_id' => $game->id,
            'lang' => $game->lang,
            'type' => $game->type,
            'plan' => $usage['plan'],
            'score' => 0,
            'total_questions' => $questions->count(),
            'correct_count' => 0,
            'xp_earned' => 0,
            'started_at' => now(),
            'completed_at' => null,
            'usage_date' => $today->toDateString(),
            'details' => null,
        ]);

        UserActivityTracker::touch($user);

        return response()->json([
            'attempt' => $this->mapAttempt($attempt),
            'game' => $this->mapGame($game, $questions),
            'usage' => $this->usageFor($user),
        ]);
    }

    public function complete(Request $request, GameAttempt $attempt): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User || (int) $attempt->user_id !== (int) $user->id) {
            abort(403);
        }

        $game = GameSet::query()->whereKey($attempt->game_set_id)->firstOrFail();
        if ($attempt->completed_at !== null) {
            return response()->json([
                'attempt' => $this->mapAttempt($attempt),
                'usage' => $this->usageFor($user),
            ]);
        }

        $data = $request->validate([
            'answers' => ['nullable', 'array'],
            'answers.*.questionId' => ['required', 'string', 'max:128'],
            'answers.*.answer' => ['nullable'],
        ]);

        $submitted = collect($data['answers'] ?? [])->mapWithKeys(function ($item) {
            return [(string) $item['questionId'] => $item['answer'] ?? ''];
        });

        $questions = GameQuestion::query()
            ->where('game_set_id', $game->id)
            ->where('is_active', true)
            ->get();

        $details = [];
        $correct = 0;
        foreach ($questions as $question) {
            $rawAnswer = $submitted->get((string) $question->id, '');
            $isCorrect = $this->answersMatch($rawAnswer, (string) $question->answer);
            if ($isCorrect) {
                $correct++;
            }
            $details[] = [
                'questionId' => (string) $question->id,
                'answer' => $rawAnswer,
                'correctAnswer' => (string) $question->answer,
                'correct' => $isCorrect,
            ];
        }

        $total = max(1, $questions->count());
        $score = (int) round(($correct / $total) * 100);
        $xpEarned = (int) round(($correct / $total) * (int) $game->xp_reward);

        $attempt->update([
            'score' => $score,
            'total_questions' => $questions->count(),
            'correct_count' => $correct,
            'xp_earned' => $xpEarned,
            'completed_at' => now(),
            'details' => $details,
        ]);

        UserActivityTracker::touch($user);

        return response()->json([
            'attempt' => $this->mapAttempt($attempt->fresh()),
            'usage' => $this->usageFor($user),
        ]);
    }

    private function answersMatch(mixed $given, string $expected): bool
    {
        if (is_array($given)) {
            $given = implode(' ', array_map(fn ($v) => (string) $v, $given));
        }

        return $this->normalizeAnswer((string) $given) === $this->normalizeAnswer($expected);
    }

    private function normalizeAnswer(string $value): string
    {
        $value = trim($value);
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
        $value = preg_replace('/[؟?!.،,;:]+$/u', '', $value) ?? $value;

        return mb_strtolower(trim($value), 'UTF-8');
    }

    private function mapGame(GameSet $game, $questions): array
    {
        return [
            'id' => (string) $game->id,
            'lang' => (string) $game->lang,
            'type' => (string) $game->type,
            'title' => (string) $game->title,
            'description' => (string) $game->description,
            'level' => (string) $game->level,
            'subLevel' => $game->sub_level ? (string) $game->sub_level : null,
            'icon' => $game->icon ? (string) $game->icon : null,
            'color' => (string) $game->color,
            'xpReward' => (int) $game->xp_reward,
            'timeLimitSeconds' => (int) $game->time_limit_seconds,
            'isActive' => (bool) $game->is_active,
            'questions' => $questions->map(fn (GameQuestion $q) => $this->mapQuestion($q))->values()->all(),
        ];
    }

    private function mapQuestion(GameQuestion $q): array
    {
        $options = is_array($q->options) ? array_values($q->options) : [];
        if (count($options) > 1) {
            shuffle($options);
        }

        return [
            'id' => (string) $q->id,
            'prompt' => (string) $q->prompt,
            'answer' => (string) $q->answer,
            'translation' => $q->translation ? (string) $q->translation : null,
            'options' => $options,
            'tokens' => is_array($q->tokens) ? $q->tokens : [],
            'audioText' => $q->audio_text ? (string) $q->audio_text : null,
            'explanation' => $q->explanation ? (string) $q->explanation : null,
            'sortOrder' => (int) $q->sort_order,
        ];
    }

    private function mapAttempt(GameAttempt $attempt): array
    {
        return [
            'id' => (string) $attempt->id,
            'gameSetId' => (string) $attempt->game_set_id,
            'lang' => (string) $attempt->lang,
            'type' => (string) $attempt->type,
            'plan' => (string) $attempt->plan,
            'score' => (int) $attempt->score,
            'totalQuestions' => (int) $attempt->total_questions,
            'correctCount' => (int) $attempt->correct_count,
            'xpEarned' => (int) $attempt->xp_earned,
            'startedAt' => optional($attempt->started_at)->toISOString(),
            'completedAt' => optional($attempt->completed_at)->toISOString(),
            'details' => is_array($attempt->details) ? $attempt->details : [],
        ];
    }
}
