<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SentenceTopic;
use Illuminate\Http\Request;

class SentencesController extends Controller
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

        // يظهر للمتعلّم حسب لغة المحتوى (sentence_lang) وليس حسب عمود lang (مسار حفظ الإدارة).
        // موضوع "للغتين" أو المحفوظ تحت /en/... يظهر لمتعلّم الألمانية عندما sentence_lang = both أو de.
        $rows = SentenceTopic::query()
            ->where('is_active', true)
            ->where(function ($q) use ($lang) {
                $q->where('sentence_lang', 'both')
                    ->orWhere('sentence_lang', $lang);
            })
            ->orderBy('level')
            ->orderBy('sub_level')
            ->orderByDesc('updated_at')
            ->limit(500)
            ->get();

        return response()->json([
            'topics' => $rows->map(fn (SentenceTopic $t) => $this->mapTopic($t))->values()->all(),
        ]);
    }

    private function mapTopic(SentenceTopic $t): array
    {
        return [
            'id' => (string) $t->id,
            'sentenceLang' => (string) $t->sentence_lang,
            'title' => (string) $t->title,
            'description' => (string) $t->description,
            'level' => (string) $t->level,
            'subLevel' => $t->sub_level ? (string) $t->sub_level : null,
            'image' => (string) $t->image,
            'icon' => $t->icon ? (string) $t->icon : null,
            'progress' => 0,
            'color' => (string) $t->color,
            'mediaType' => (string) $t->media_type,
            'mediaUrl' => $t->media_url ? (string) $t->media_url : null,
            'sentences' => is_array($t->sentences) ? $t->sentences : [],
            'grammarNotes' => $t->grammar_notes ? (string) $t->grammar_notes : null,
            'quizQuestions' => $this->mapQuizQuestionsForApi($t->quiz_questions),
        ];
    }

    /**
     * @param  mixed  $raw
     * @return array<int, array<string, mixed>>
     */
    private function mapQuizQuestionsForApi($raw): array
    {
        if (! is_array($raw)) {
            return [];
        }
        $list = array_values($raw);
        $out = [];
        foreach ($list as $i => $q) {
            if (! is_array($q)) {
                continue;
            }
            if (empty($q['id']) || ! is_string($q['id'])) {
                $base = ($q['text'] ?? '').'|'.($q['type'] ?? '').'|'.$i;
                $q['id'] = 'q-'.$i.'-'.substr(sha1($base), 0, 12);
            }
            $out[] = $q;
        }

        return $out;
    }
}
