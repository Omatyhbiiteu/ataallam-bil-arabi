<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\SentenceTopic;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminSentencesController extends Controller
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

        $rows = SentenceTopic::query()
            ->where('lang', $lang)
            ->orderBy('level')
            ->orderBy('sub_level')
            ->orderByDesc('updated_at')
            ->limit(700)
            ->get();

        return response()->json([
            'topics' => $rows->map(fn (SentenceTopic $t) => $this->mapTopic($t))->values()->all(),
        ]);
    }

    public function store(Request $request, string $lang)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:512'],
            'level' => ['required', 'string', 'max:32'],
            'subLevel' => ['nullable', 'string', 'max:16'],
            'sentenceLang' => ['required', 'in:en,de,both'],
            'image' => ['nullable', 'string', 'max:512'],
            'icon' => ['nullable', 'string', 'max:64'],
            'color' => ['nullable', 'string', 'max:32'],
            'mediaType' => ['nullable', 'in:none,image,video'],
            'mediaUrl' => ['nullable', 'string', 'max:8192'],
            'sentences' => ['nullable', 'array'],
            'grammarNotes' => ['nullable', 'string', 'max:65535'],
            'quizQuestions' => ['nullable', 'array'],
            'isActive' => ['sometimes', 'boolean'],
            'id' => ['sometimes', 'uuid'],
        ]);

        $this->rejectOversizedOrBase64Payload($data);

        $topic = SentenceTopic::query()->create([
            'id' => isset($data['id']) ? (string) $data['id'] : null,
            'lang' => $lang,
            'sentence_lang' => $data['sentenceLang'],
            'title' => $data['title'],
            'description' => $data['description'] ?? '',
            'level' => $data['level'],
            'sub_level' => $data['subLevel'] ?? null,
            'image' => $data['image'] ?? 'from-blue-500 to-indigo-500',
            'icon' => $data['icon'] ?? null,
            'color' => $data['color'] ?? 'blue',
            'media_type' => $data['mediaType'] ?? 'none',
            'media_url' => $data['mediaUrl'] ?? null,
            'sentences' => $data['sentences'] ?? [],
            'grammar_notes' => $data['grammarNotes'] ?? null,
            'quiz_questions' => $this->normalizeQuizQuestionsForStorage($data['quizQuestions'] ?? []),
            'is_active' => (bool) ($data['isActive'] ?? true),
        ]);

        return response()->json(['topic' => $this->mapTopic($topic)]);
    }

    public function update(Request $request, string $lang, SentenceTopic $sentenceTopic)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);
        if ($sentenceTopic->lang !== $lang) {
            abort(404);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:512'],
            'level' => ['sometimes', 'string', 'max:32'],
            'subLevel' => ['nullable', 'string', 'max:16'],
            'sentenceLang' => ['sometimes', 'in:en,de,both'],
            'image' => ['nullable', 'string', 'max:512'],
            'icon' => ['nullable', 'string', 'max:64'],
            'color' => ['nullable', 'string', 'max:32'],
            'mediaType' => ['nullable', 'in:none,image,video'],
            'mediaUrl' => ['nullable', 'string', 'max:8192'],
            'sentences' => ['nullable', 'array'],
            'grammarNotes' => ['nullable', 'string', 'max:65535'],
            'quizQuestions' => ['nullable', 'array'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $this->rejectOversizedOrBase64Payload($data);

        $sentenceTopic->update([
            'title' => $data['title'] ?? $sentenceTopic->title,
            'description' => array_key_exists('description', $data) ? ($data['description'] ?? '') : $sentenceTopic->description,
            'level' => $data['level'] ?? $sentenceTopic->level,
            'sub_level' => array_key_exists('subLevel', $data) ? ($data['subLevel'] ?? null) : $sentenceTopic->sub_level,
            'sentence_lang' => $data['sentenceLang'] ?? $sentenceTopic->sentence_lang,
            'image' => array_key_exists('image', $data) ? ($data['image'] ?? 'from-blue-500 to-indigo-500') : $sentenceTopic->image,
            'icon' => array_key_exists('icon', $data) ? $data['icon'] : $sentenceTopic->icon,
            'color' => $data['color'] ?? $sentenceTopic->color,
            'media_type' => $data['mediaType'] ?? $sentenceTopic->media_type,
            'media_url' => array_key_exists('mediaUrl', $data) ? $data['mediaUrl'] : $sentenceTopic->media_url,
            'sentences' => array_key_exists('sentences', $data) ? ($data['sentences'] ?? []) : $sentenceTopic->sentences,
            'grammar_notes' => array_key_exists('grammarNotes', $data) ? $data['grammarNotes'] : $sentenceTopic->grammar_notes,
            'quiz_questions' => array_key_exists('quizQuestions', $data)
                ? $this->normalizeQuizQuestionsForStorage($data['quizQuestions'] ?? [])
                : $sentenceTopic->quiz_questions,
            'is_active' => array_key_exists('isActive', $data) ? (bool) $data['isActive'] : $sentenceTopic->is_active,
        ]);

        return response()->json(['topic' => $this->mapTopic($sentenceTopic->fresh())]);
    }

    public function destroy(Request $request, string $lang, SentenceTopic $sentenceTopic)
    {
        $this->requireAdmin($request);
        $lang = $this->assertLang($lang);
        if ($sentenceTopic->lang !== $lang) {
            abort(404);
        }

        $sentenceTopic->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * منع إدخال base64 ضخم في JSON (يسبب تجاوز max_allowed_packet في MySQL).
     */
    private function rejectOversizedOrBase64Payload(array $data): void
    {
        $checkString = function (?string $v, string $field): void {
            if ($v === null || $v === '') {
                return;
            }
            if (strlen($v) > 65536) {
                throw ValidationException::withMessages([
                    $field => ['القيمة كبيرة جداً. لا تُحمّل ملفات كبيرة كـ base64 — استخدم زر الرفع ليُخزَّن الرابط فقط.'],
                ]);
            }
            if (str_starts_with($v, 'data:') && strlen($v) > 512) {
                throw ValidationException::withMessages([
                    $field => ['لا يُسمح بحفظ ملفات كـ base64 داخل JSON. استخدم زر الرفع بجانب الحقل ليُرسل الملف للخادم.'],
                ]);
            }
        };

        $checkString($data['mediaUrl'] ?? null, 'mediaUrl');

        foreach ($data['sentences'] ?? [] as $i => $s) {
            if (! is_array($s)) {
                continue;
            }
            foreach ($s as $key => $val) {
                if (is_string($val)) {
                    $checkString($val, "sentences.$i.$key");
                }
            }
        }

        foreach ($data['quizQuestions'] ?? [] as $qi => $q) {
            if (! is_array($q)) {
                continue;
            }
            foreach ($q as $key => $val) {
                if (is_string($val)) {
                    $checkString($val, "quizQuestions.$qi.$key");
                }
                if ($key === 'options' && is_array($val)) {
                    foreach ($val as $oi => $opt) {
                        if (is_string($opt)) {
                            $checkString($opt, "quizQuestions.$qi.options.$oi");
                        }
                    }
                }
            }
        }
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
            'isActive' => (bool) $t->is_active,
        ];
    }

    /**
     * @param  mixed  $raw
     * @return array<int, array<string, mixed>>
     */
    private function normalizeQuizQuestionsForStorage(array $raw): array
    {
        $list = array_values($raw);
        $out = [];
        foreach ($list as $q) {
            if (is_array($q)) {
                $out[] = $q;
            }
        }

        return $out;
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
