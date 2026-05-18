<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\GameQuestion;
use App\Models\GameSet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminGamesController extends Controller
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

        $rows = GameSet::query()
            ->with('questions')
            ->where('lang', $lang)
            ->orderBy('level')
            ->orderBy('type')
            ->orderByDesc('updated_at')
            ->limit(300)
            ->get();

        return response()->json([
            'games' => $rows->map(fn (GameSet $game) => $this->mapGame($game, includeQuestions: true))->values()->all(),
        ]);
    }

    public function store(Request $request, string $lang)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);
        $data = $this->validatedGameData($request, creating: true);

        $game = DB::transaction(function () use ($data, $lang) {
            $game = GameSet::query()->create([
                'id' => isset($data['id']) ? (string) $data['id'] : null,
                'lang' => $lang,
                'type' => $data['type'],
                'title' => $data['title'],
                'description' => $data['description'] ?? '',
                'level' => $data['level'],
                'sub_level' => $data['subLevel'] ?? null,
                'icon' => $data['icon'] ?? null,
                'color' => $data['color'] ?? 'indigo',
                'xp_reward' => (int) ($data['xpReward'] ?? 120),
                'time_limit_seconds' => (int) ($data['timeLimitSeconds'] ?? 90),
                'is_active' => (bool) ($data['isActive'] ?? true),
            ]);
            $this->syncQuestions($game, $data['questions'] ?? []);

            return $game->fresh('questions');
        });

        return response()->json(['game' => $this->mapGame($game, includeQuestions: true)]);
    }

    public function update(Request $request, string $lang, GameSet $game)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);
        if ($game->lang !== $lang) {
            abort(404);
        }

        $data = $this->validatedGameData($request, creating: false);

        $updated = DB::transaction(function () use ($data, $game) {
            $game->update([
                'type' => $data['type'] ?? $game->type,
                'title' => $data['title'] ?? $game->title,
                'description' => array_key_exists('description', $data) ? ($data['description'] ?? '') : $game->description,
                'level' => $data['level'] ?? $game->level,
                'sub_level' => array_key_exists('subLevel', $data) ? ($data['subLevel'] ?? null) : $game->sub_level,
                'icon' => array_key_exists('icon', $data) ? $data['icon'] : $game->icon,
                'color' => $data['color'] ?? $game->color,
                'xp_reward' => array_key_exists('xpReward', $data) ? (int) $data['xpReward'] : $game->xp_reward,
                'time_limit_seconds' => array_key_exists('timeLimitSeconds', $data) ? (int) $data['timeLimitSeconds'] : $game->time_limit_seconds,
                'is_active' => array_key_exists('isActive', $data) ? (bool) $data['isActive'] : $game->is_active,
            ]);

            if (array_key_exists('questions', $data)) {
                $this->syncQuestions($game, $data['questions'] ?? []);
            }

            return $game->fresh('questions');
        });

        return response()->json(['game' => $this->mapGame($updated, includeQuestions: true)]);
    }

    public function destroy(Request $request, string $lang, GameSet $game)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);
        if ($game->lang !== $lang) {
            abort(404);
        }

        DB::transaction(function () use ($game) {
            GameQuestion::query()->where('game_set_id', $game->id)->delete();
            $game->delete();
        });

        return response()->json(['ok' => true]);
    }

    private function validatedGameData(Request $request, bool $creating): array
    {
        return $request->validate([
            'id' => ['sometimes', 'string', 'max:64'],
            'type' => [$creating ? 'required' : 'sometimes', 'in:word_match,sentence_builder,listening'],
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1024'],
            'level' => [$creating ? 'required' : 'sometimes', 'string', 'max:32'],
            'subLevel' => ['nullable', 'string', 'max:16'],
            'icon' => ['nullable', 'string', 'max:64'],
            'color' => ['nullable', 'string', 'max:64'],
            'xpReward' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'timeLimitSeconds' => ['nullable', 'integer', 'min:15', 'max:3600'],
            'isActive' => ['sometimes', 'boolean'],
            'questions' => ['nullable', 'array', 'max:100'],
            'questions.*.id' => ['nullable', 'string', 'max:128'],
            'questions.*.prompt' => ['required_with:questions', 'string', 'max:5000'],
            'questions.*.answer' => ['required_with:questions', 'string', 'max:5000'],
            'questions.*.translation' => ['nullable', 'string', 'max:5000'],
            'questions.*.options' => ['nullable', 'array', 'max:12'],
            'questions.*.options.*' => ['string', 'max:500'],
            'questions.*.tokens' => ['nullable', 'array', 'max:30'],
            'questions.*.tokens.*' => ['string', 'max:120'],
            'questions.*.audioText' => ['nullable', 'string', 'max:5000'],
            'questions.*.explanation' => ['nullable', 'string', 'max:5000'],
            'questions.*.sortOrder' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'questions.*.isActive' => ['sometimes', 'boolean'],
        ]);
    }

    private function syncQuestions(GameSet $game, array $questions): void
    {
        GameQuestion::query()->where('game_set_id', $game->id)->delete();
        foreach (array_values($questions) as $index => $q) {
            GameQuestion::query()->create([
                'id' => ! empty($q['id']) ? (string) $q['id'] : null,
                'game_set_id' => $game->id,
                'prompt' => (string) $q['prompt'],
                'answer' => (string) $q['answer'],
                'translation' => isset($q['translation']) ? (string) $q['translation'] : null,
                'options' => $q['options'] ?? [],
                'tokens' => $q['tokens'] ?? [],
                'audio_text' => isset($q['audioText']) ? (string) $q['audioText'] : null,
                'explanation' => isset($q['explanation']) ? (string) $q['explanation'] : null,
                'sort_order' => (int) ($q['sortOrder'] ?? ($index + 1)),
                'is_active' => (bool) ($q['isActive'] ?? true),
            ]);
        }
    }

    private function mapGame(GameSet $game, bool $includeQuestions = false): array
    {
        $out = [
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
            'questionCount' => $game->relationLoaded('questions') ? $game->questions->count() : $game->questions()->count(),
        ];

        if ($includeQuestions) {
            $out['questions'] = $game->questions
                ->map(fn (GameQuestion $q) => $this->mapQuestion($q))
                ->values()
                ->all();
        }

        return $out;
    }

    private function mapQuestion(GameQuestion $q): array
    {
        return [
            'id' => (string) $q->id,
            'prompt' => (string) $q->prompt,
            'answer' => (string) $q->answer,
            'translation' => $q->translation ? (string) $q->translation : null,
            'options' => is_array($q->options) ? $q->options : [],
            'tokens' => is_array($q->tokens) ? $q->tokens : [],
            'audioText' => $q->audio_text ? (string) $q->audio_text : null,
            'explanation' => $q->explanation ? (string) $q->explanation : null,
            'sortOrder' => (int) $q->sort_order,
            'isActive' => (bool) $q->is_active,
        ];
    }
}
