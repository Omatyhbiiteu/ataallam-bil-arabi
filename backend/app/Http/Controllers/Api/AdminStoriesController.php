<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\Story;
use Illuminate\Http\Request;

class AdminStoriesController extends Controller
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

        $rows = Story::query()
            ->where('lang', $lang)
            ->orderByDesc('updated_at')
            ->limit(700)
            ->get();

        return response()->json([
            'stories' => $rows->map(fn (Story $s) => $this->mapStory($s))->values()->all(),
        ]);
    }

    public function store(Request $request, string $lang)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'content' => ['required', 'string', 'max:500000'],
            'translation' => ['nullable', 'string', 'max:500000'],
            'image' => ['nullable', 'string', 'max:2048'],
            'level' => ['required', 'string', 'max:32'],
            'subLevel' => ['nullable', 'string', 'max:16'],
            'questions' => ['nullable', 'array'],
            'tags' => ['nullable', 'array'],
            'wordCount' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'estimatedReadingTime' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'difficulty' => ['nullable', 'integer', 'min:1', 'max:10'],
            'viewCount' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $story = Story::query()->create([
            'lang' => $lang,
            'title' => $data['title'],
            'description' => $data['description'],
            'content' => $data['content'],
            'translation' => $data['translation'] ?? null,
            'image' => $data['image'] ?? null,
            'level' => $data['level'],
            'sub_level' => $data['subLevel'] ?? null,
            'questions' => $data['questions'] ?? [],
            'tags' => $data['tags'] ?? null,
            'word_count' => $data['wordCount'] ?? null,
            'estimated_reading_time' => $data['estimatedReadingTime'] ?? null,
            'difficulty' => $data['difficulty'] ?? null,
            'view_count' => $data['viewCount'] ?? 0,
            'is_active' => (bool) ($data['isActive'] ?? true),
        ]);

        return response()->json([
            'story' => $this->mapStory($story),
        ]);
    }

    public function update(Request $request, string $lang, Story $story)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);
        if ($story->lang !== $lang) {
            abort(404);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string', 'max:5000'],
            'content' => ['sometimes', 'string', 'max:500000'],
            'translation' => ['nullable', 'string', 'max:500000'],
            'image' => ['nullable', 'string', 'max:2048'],
            'level' => ['sometimes', 'string', 'max:32'],
            'subLevel' => ['nullable', 'string', 'max:16'],
            'questions' => ['nullable', 'array'],
            'tags' => ['nullable', 'array'],
            'wordCount' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'estimatedReadingTime' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'difficulty' => ['nullable', 'integer', 'min:1', 'max:10'],
            'viewCount' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $story->update([
            'title' => $data['title'] ?? $story->title,
            'description' => $data['description'] ?? $story->description,
            'content' => $data['content'] ?? $story->content,
            'translation' => array_key_exists('translation', $data) ? ($data['translation'] ?? null) : $story->translation,
            'image' => array_key_exists('image', $data) ? ($data['image'] ?? null) : $story->image,
            'level' => $data['level'] ?? $story->level,
            'sub_level' => array_key_exists('subLevel', $data) ? ($data['subLevel'] ?? null) : $story->sub_level,
            'questions' => array_key_exists('questions', $data) ? ($data['questions'] ?? []) : $story->questions,
            'tags' => array_key_exists('tags', $data) ? ($data['tags'] ?? null) : $story->tags,
            'word_count' => array_key_exists('wordCount', $data) ? ($data['wordCount'] ?? null) : $story->word_count,
            'estimated_reading_time' => array_key_exists('estimatedReadingTime', $data) ? ($data['estimatedReadingTime'] ?? null) : $story->estimated_reading_time,
            'difficulty' => array_key_exists('difficulty', $data) ? ($data['difficulty'] ?? null) : $story->difficulty,
            'view_count' => array_key_exists('viewCount', $data) ? (int) ($data['viewCount'] ?? 0) : $story->view_count,
            'is_active' => array_key_exists('isActive', $data) ? (bool) $data['isActive'] : $story->is_active,
        ]);

        return response()->json([
            'story' => $this->mapStory($story),
        ]);
    }

    public function destroy(Request $request, string $lang, Story $story)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);
        if ($story->lang !== $lang) {
            abort(404);
        }

        $story->delete();

        return response()->json(['ok' => true]);
    }

    private function mapStory(Story $s): array
    {
        return [
            'id' => (string) $s->id,
            'title' => (string) $s->title,
            'description' => (string) $s->description,
            'content' => (string) $s->content,
            'translation' => $s->translation ? (string) $s->translation : null,
            'image' => (string) ($s->image ?? ''),
            'level' => (string) $s->level,
            'subLevel' => $s->sub_level ? (string) $s->sub_level : null,
            'questions' => is_array($s->questions) ? $s->questions : [],
            'wordCount' => $s->word_count,
            'estimatedReadingTime' => $s->estimated_reading_time,
            'difficulty' => $s->difficulty,
            'tags' => is_array($s->tags) ? $s->tags : null,
            'viewCount' => $s->view_count,
            'isActive' => (bool) $s->is_active,
        ];
    }
}

