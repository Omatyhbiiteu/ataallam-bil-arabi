import type { Question } from '../types';

/** يضمن مصفوفة + معرّف لكل سؤال (للاستجابة من JSON قد يكون كائناً أو بدون id) */
export function normalizeQuizQuestions(raw: unknown): Question[] {
    if (raw == null) return [];
    const arr = Array.isArray(raw) ? raw : Object.values(raw as Record<string, Question>);
    return arr
        .map((q, i) => {
            if (!q || typeof q !== 'object') return null;
            const o = q as Partial<Question>;
            const id =
                typeof o.id === 'string' && o.id.trim()
                    ? o.id.trim()
                    : stableQuestionId(o, i);
            return { ...o, id } as Question;
        })
        .filter(Boolean) as Question[];
}

function stableQuestionId(q: Partial<Question>, index: number): string {
    const base = `${q.type ?? ''}|${q.text ?? ''}|${index}`;
    let h = 0;
    for (let i = 0; i < base.length; i++) h = (Math.imul(31, h) + base.charCodeAt(i)) | 0;
    return `q-${index}-${(h >>> 0).toString(16)}`;
}
