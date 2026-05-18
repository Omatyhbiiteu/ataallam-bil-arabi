<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameSet;
use Illuminate\Http\Request;

class GamesController extends Controller
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

        $rows = GameSet::query()
            ->withCount(['questions' => fn ($q) => $q->where('is_active', true)])
            ->where('lang', $lang)
            ->where('is_active', true)
            ->orderBy('level')
            ->orderBy('type')
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get();

        return response()->json([
            'games' => $rows->map(fn (GameSet $game) => $this->mapGame($game))->values()->all(),
        ]);
    }

    private function mapGame(GameSet $game): array
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
            'questionCount' => (int) ($game->questions_count ?? 0),
        ];
    }
}
