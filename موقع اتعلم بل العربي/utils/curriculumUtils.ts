import type { Lesson, Module, Question } from '../types';

/** يوحّد شكل وحدات المنهج القادمة من الـ API مع نوع الواجهة (يدعم sub_level احتياطيًا). */
export function normalizeCurriculumModules(raw: unknown): Module[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((m: any) => {
            const moduleId = String(m?.id ?? '').trim() || fallbackId('module');
            const lessonsRaw = Array.isArray(m?.lessons) ? m.lessons : [];
            const lessons: Lesson[] = lessonsRaw.map((l: any, idx: number) => normalizeLesson(l, moduleId, idx));
            const sub =
                m?.subLevel != null && String(m.subLevel).trim() !== ''
                    ? String(m.subLevel)
                    : m?.sub_level != null && String(m.sub_level).trim() !== ''
                      ? String(m.sub_level)
                      : 'A1.1';
            return {
                id: moduleId,
                title: String(m?.title ?? ''),
                level: String(m?.level ?? 'A1'),
                subLevel: sub,
                lessons,
            } as Module;
        })
        .filter((m) => m.id.length > 0);
}

function fallbackId(prefix: string): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeLesson(l: any, moduleId: string, index: number): Lesson {
    const rawLessonId = String(l?.id ?? '').trim() || `lesson_${index + 1}`;
    const normalizedLessonId = rawLessonId.includes('::') ? rawLessonId : `${moduleId}::${rawLessonId}`;
    return {
        id: normalizedLessonId,
        title: String(l?.title ?? ''),
        description: String(l?.description ?? ''),
        duration: String(l?.duration ?? '10 min'),
        level: l?.level != null ? String(l.level) : undefined,
        content: l?.content != null ? String(l.content) : undefined,
        image: l?.image != null ? String(l.image) : undefined,
        videoUrl: l?.videoUrl != null ? String(l.videoUrl) : l?.video_url != null ? String(l.video_url) : undefined,
        audioUrl: l?.audioUrl != null ? String(l.audioUrl) : l?.audio_url != null ? String(l.audio_url) : undefined,
        resources: Array.isArray(l?.resources) ? l.resources : undefined,
        questions: Array.isArray(l?.questions) ? l.questions.map(normalizeQuestion) : undefined,
    };
}

function normalizeQuestion(q: any): Question {
    return {
        id: String(q?.id ?? '').trim() || fallbackId('q'),
        type: (q?.type as Question['type']) || 'multiple-choice',
        text: String(q?.text ?? ''),
        options: Array.isArray(q?.options) ? q.options.map((o: unknown) => String(o)) : undefined,
        correctAnswer: q?.correctAnswer,
        explanation: q?.explanation != null ? String(q.explanation) : undefined,
        image: q?.image != null ? String(q.image) : undefined,
        mediaType:
            q?.mediaType === 'image' || q?.mediaType === 'video' || q?.mediaType === 'audio' || q?.mediaType === 'none'
                ? q.mediaType
                : undefined,
        mediaUrl: q?.mediaUrl != null ? String(q.mediaUrl) : undefined,
    };
}
