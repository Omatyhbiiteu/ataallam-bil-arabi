<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Http\Request;

class AdminMediaUploadController extends Controller
{
    private function requireAdmin(Request $request): void
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }
    }

    /**
     * رفع صورة / فيديو / صوت إلى storage/app/public وإرجاع رابط عام يُخزَّن في JSON المنهج فقط.
     */
    public function store(Request $request)
    {
        $this->requireAdmin($request);

        $request->validate([
            'kind' => ['required', 'in:image,video,audio'],
            'context' => ['sometimes', 'in:curriculum,sentences'],
            'sentenceLang' => ['required_if:context,sentences', 'in:en,de,both'],
        ]);

        $kind = (string) $request->input('kind');
        $context = (string) $request->input('context', 'curriculum');

        if ($context === 'sentences' && $kind === 'audio') {
            abort(422, 'رفع الصوت لمواضيع الجمل غير مدعوم من هذا المسار.');
        }

        $fileRules = match ($kind) {
            'image' => ['required', 'file', 'max:5120', 'mimes:jpeg,jpg,png,gif,webp'],
            'video' => ['required', 'file', 'max:102400', 'mimes:mp4,webm,ogg'],
            'audio' => ['required', 'file', 'max:20480', 'mimes:mp3,wav,ogg,m4a,aac'],
        };

        $request->validate([
            'file' => $fileRules,
        ]);

        $sl = (string) $request->input('sentenceLang');
        $langFolder = match ($sl) {
            'en' => 'english',
            'both' => 'english',
            default => 'german',
        };

        $folder = match (true) {
            $context === 'sentences' && $kind === 'image' => 'جمل/'.$langFolder.'/images',
            $context === 'sentences' && $kind === 'video' => 'جمل/'.$langFolder.'/videos',
            $kind === 'image' => 'curriculum-media/images',
            $kind === 'video' => 'curriculum-media/videos',
            default => 'curriculum-media/audio',
        };

        $path = $request->file('file')->store($folder, 'public');

        $relative = '/storage/'.str_replace('\\', '/', $path);
        $base = rtrim((string) config('app.url'), '/');
        $url = $base.$relative;

        return response()->json([
            'url' => $url,
            'path' => $relative,
        ]);
    }
}
