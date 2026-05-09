<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\User;
use App\Services\UserActivityTracker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class StoriesController extends Controller
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

        $rows = Story::query()
            ->where('lang', $lang)
            ->where('is_active', true)
            ->orderByDesc('updated_at')
            ->limit(500)
            ->get();

        return response()->json([
            'stories' => $rows->map(fn (Story $s) => $this->mapStory($s, includeContent: false))->values()->all(),
        ]);
    }

    public function show(Request $request, string $lang, Story $story)
    {
        $lang = $this->assertLang($lang);
        if ($story->lang !== $lang) {
            abort(404);
        }
        if (! $story->is_active) {
            abort(404);
        }

        Story::query()->whereKey($story->id)->update([
            'view_count' => DB::raw('COALESCE(view_count, 0) + 1'),
        ]);
        $story->refresh();

        $bearer = $request->bearerToken();
        if ($bearer) {
            $pat = PersonalAccessToken::findToken($bearer);
            if ($pat && $pat->tokenable instanceof User) {
                UserActivityTracker::touch($pat->tokenable);
            }
        }

        return response()->json([
            'story' => $this->mapStory($story, includeContent: true),
        ]);
    }

    private function mapStory(Story $s, bool $includeContent): array
    {
        $base = [
            'id' => (string) $s->id,
            'title' => (string) $s->title,
            'description' => (string) $s->description,
            'image' => (string) ($s->image ?? ''),
            'level' => (string) $s->level,
            'subLevel' => $s->sub_level ? (string) $s->sub_level : null,
            'isSystem' => true,
            'wordCount' => $s->word_count,
            'estimatedReadingTime' => $s->estimated_reading_time,
            'difficulty' => $s->difficulty,
            'tags' => is_array($s->tags) ? $s->tags : null,
            'viewCount' => $s->view_count,
        ];

        if ($includeContent) {
            $base['content'] = (string) $s->content;
            $base['translation'] = $s->translation ? (string) $s->translation : null;
            $base['questions'] = is_array($s->questions) ? $s->questions : [];
        }

        return $base;
    }
}

