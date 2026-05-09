<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\StoryQuestionAttempt;
use App\Models\User;
use App\Services\UserActivityTracker;
use Illuminate\Http\Request;

class StoryQuizAttemptController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(403);
        }

        $data = $request->validate([
            'storyId' => ['required', 'string', 'max:64'],
            'questionId' => ['required', 'string', 'max:128'],
            'correct' => ['required', 'boolean'],
            'lang' => ['nullable', 'string', 'in:en,de'],
        ]);

        $story = Story::query()->where('id', $data['storyId'])->where('is_active', true)->first();
        if (! $story) {
            abort(404, 'القصة غير موجودة');
        }

        if (isset($data['lang']) && $story->lang !== $data['lang']) {
            abort(422, 'لغة القصة لا تطابق الطلب');
        }

        $questions = is_array($story->questions) ? $story->questions : [];
        $found = false;
        foreach ($questions as $q) {
            if (! is_array($q)) {
                continue;
            }
            if ((string) ($q['id'] ?? '') === $data['questionId']) {
                $found = true;
                break;
            }
        }
        if (! $found) {
            abort(422, 'معرّف السؤال غير موجود في القصة');
        }

        StoryQuestionAttempt::query()->create([
            'user_id' => $user->id,
            'story_id' => $story->id,
            'question_id' => $data['questionId'],
            'correct' => $data['correct'],
        ]);

        UserActivityTracker::touch($user);

        return response()->json(['ok' => true]);
    }
}
