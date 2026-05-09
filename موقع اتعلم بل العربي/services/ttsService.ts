
let voices: SpeechSynthesisVoice[] = [];

// Helper to handle async voice loading which is common in Chrome
const loadVoices = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    voices = window.speechSynthesis.getVoices();
  }
};

// Initialize voices
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  // Chrome loads voices asynchronously, so we must listen for the change event
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

// Common German words that don't contain special characters (äöüß)
// Used as a fallback to detect German when no special chars are present
const COMMON_GERMAN_WORDS = new Set([
  // Articles & pronouns
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'einem', 'einen', 'eines',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mein', 'dein', 'sein', 'unser',
  // Common verbs
  'ist', 'bin', 'bist', 'sind', 'war', 'waren', 'hat', 'haben', 'hatte', 'hatten',
  'wird', 'werden', 'wurde', 'kann', 'konnte', 'will', 'wollen', 'muss', 'musste',
  'gehen', 'kommen', 'machen', 'gehen', 'sehen', 'sagen', 'wissen', 'geben', 'nehmen',
  'stehen', 'lesen', 'schreiben', 'sprechen', 'arbeiten', 'spielen', 'lernen', 'leben',
  // Common nouns
  'mann', 'frau', 'kind', 'hund', 'katze', 'haus', 'auto', 'buch', 'tisch', 'stuhl',
  'stadt', 'land', 'welt', 'zeit', 'tag', 'nacht', 'jahr', 'woche', 'monat',
  'wasser', 'essen', 'brot', 'milch', 'schule', 'arbeit', 'geld', 'mensch', 'leute',
  'weg', 'platz', 'raum', 'zimmer', 'strasse', 'baum', 'blume', 'tier',
  // Adjectives
  'gut', 'schlecht', 'gross', 'klein', 'alt', 'neu', 'jung', 'schnell', 'langsam',
  'schon', 'schoen', 'kalt', 'warm', 'lang', 'kurz', 'viel', 'wenig', 'mehr',
  'ganz', 'sehr', 'richtig', 'falsch', 'stark', 'schwach', 'leicht', 'schwer',
  // Common words
  'ja', 'nein', 'nicht', 'kein', 'und', 'oder', 'aber', 'denn', 'weil', 'wenn',
  'wie', 'wo', 'was', 'wer', 'warum', 'wann', 'hier', 'dort', 'noch', 'auch',
  'schon', 'nur', 'immer', 'nie', 'heute', 'morgen', 'gestern', 'jetzt', 'dann',
  'danke', 'bitte', 'hallo', 'tschuss', 'herzlich', 'willkommen',
]);

export const detectLang = (text: string): 'ar' | 'en' | 'de' => {
  // Regex for Arabic characters including extended set and presentation forms
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const germanPattern = /[äöüßÄÖÜ]/;

  if (arabicPattern.test(text)) return 'ar';
  if (germanPattern.test(text)) return 'de';

  // Fallback: check if the word (lowercased) is a known common German word
  const lowerText = text.trim().toLowerCase();
  if (COMMON_GERMAN_WORDS.has(lowerText)) return 'de';

  return 'en';
};

/** English-looking tokens for practice-mode guard (not exhaustive). */
const EN_PRACTICE_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'can', 'may', 'might', 'must', 'shall', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'their',
  'what', 'where', 'when', 'why', 'how', 'who', 'which', 'and', 'or', 'but', 'so',
  'not', 'no', 'yes', 'please', 'thank', 'thanks', 'hello', 'hi', 'hey', 'good',
  'morning', 'evening', 'afternoon', 'night', 'very', 'much', 'many', 'some', 'any',
  'here', 'there', 'with', 'from', 'for', 'about', 'into', 'like', 'want', 'know',
  'think', 'see', 'come', 'make', 'take', 'get', 'go', 'going', 'just', 'now', 'then',
  'also', 'too', 'well', 'really', 'today', 'tomorrow', 'yesterday', 'help', 'learn',
  'practice', 'tell', 'talk', 'speak', 'read', 'write', 'listen', 'understand',
]);

const OTHER_LATIN_PRACTICE_WORDS = new Set([
  'bonjour', 'merci', 'oui', 'salut', 'hola', 'gracias', 'buenos', 'ciao', 'buongiorno',
  'grazie', 'por', 'favor', 'que', 'qué', 'nada', 'si', 'sí', 'je', 'vous', 'nous',
]);

const DE_PRACTICE_WORDS = new Set<string>([
  ...COMMON_GERMAN_WORDS,
  'guten', 'morgen', 'abend', 'nachmittag', 'mittag', 'freund', 'freunde', 'freundin',
  'lerne', 'lernt', 'gern', 'gerne', 'super', 'schade', 'leider', 'wieder', 'nochmal',
  'woche', 'minute', 'sekunde', 'frage', 'antwort', 'übung', 'ubung', 'wort', 'satz',
]);

/**
 * Coarse classification for "which language is the user practicing in this message?".
 * Used to enforce English-only / German-only chat with the assistant.
 */
export const classifyPracticeInputLang = (text: string): 'ar' | 'de' | 'en' | 'other' | 'neutral' => {
  const s = text.trim();
  if (!s) return 'neutral';

  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(s)) return 'ar';
  if (/[\u0400-\u04FF]/.test(s)) return 'other';
  if (/[\u0370-\u03FF]/.test(s)) return 'other';
  if (/[\u0590-\u05FF]/.test(s)) return 'other';

  if (/[äöüßÄÖÜ]/.test(s)) return 'de';

  const words = s.toLowerCase().match(/[a-zäöüß]+/g) || [];
  for (const w of words) {
    if (OTHER_LATIN_PRACTICE_WORDS.has(w)) return 'other';
  }

  if (words.length === 0) return 'neutral';

  let g = 0;
  let e = 0;
  for (const w of words) {
    if (DE_PRACTICE_WORDS.has(w)) g += 1;
    if (EN_PRACTICE_WORDS.has(w)) e += 1;
  }

  if (g >= 2 && g > e) return 'de';
  if (e >= 2 && e > g) return 'en';
  if (g >= 1 && e === 0 && words.length <= 6) return 'de';
  if (e >= 1 && g === 0 && words.length <= 6) return 'en';
  if (g >= 1 && e >= 1) {
    if (Math.abs(g - e) <= 1) return 'neutral';
    return g > e ? 'de' : 'en';
  }

  return 'neutral';
};

export const speakText = (text: string, lang?: 'ar' | 'en' | 'de') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Stop any current speech to prevent overlapping
  window.speechSynthesis.cancel();

  // Retry loading voices if we haven't found them yet (sometimes needed on mobile/first load)
  if (voices.length === 0) {
    loadVoices();
  }

  // Detect language if not provided
  const targetLang = lang || detectLang(text);

  const utterance = new SpeechSynthesisUtterance(text);

  // Smart Voice Selection Strategy
  let selectedVoice: SpeechSynthesisVoice | undefined;

  if (targetLang === 'ar') {
    // Strategy:
    // 1. Look for "Google Arabic" (High Quality on Android/Chrome)
    // 2. Look for "Microsoft" Arabic (High Quality on Windows)
    // 3. Look for specific iOS/Mac voices (Maged, Tariq)
    // 4. Fallback to common regional codes (ar-SA, ar-EG)
    // 5. Fallback to any voice starting with 'ar'

    const arabicVoices = voices.filter(v => v.lang.includes('ar'));

    selectedVoice = arabicVoices.find(v => v.name.includes('Google')) ||
      arabicVoices.find(v => v.name.includes('Microsoft')) ||
      arabicVoices.find(v => v.name.includes('Maged') || v.name.includes('Tariq')) ||
      arabicVoices.find(v => v.lang === 'ar-SA' || v.lang === 'ar-EG') ||
      arabicVoices[0]; // First available Arabic voice

    // Set fallback lang if no voice object is found, so OS tries to use default engine
    utterance.lang = selectedVoice ? selectedVoice.lang : 'ar-SA';

    // Slightly slower for Arabic to ensure clarity of diacritics
    utterance.rate = 0.85;

  } else if (targetLang === 'de') {
    selectedVoice = voices.find(v => v.lang.startsWith('de') && v.name.includes('Google')) ||
      voices.find(v => v.lang.startsWith('de'));
    utterance.lang = selectedVoice ? selectedVoice.lang : 'de-DE';
    utterance.rate = 0.9;
  } else {
    // English defaults
    selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
      voices.find(v => v.lang.startsWith('en'));
    utterance.lang = selectedVoice ? selectedVoice.lang : 'en-US';
    utterance.rate = 1.0;
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    // CRITICAL: Sync utterance lang with voice lang. 
    // If utterance.lang is 'en-US' but voice is 'ar-SA', some browsers will force English pronunciation on Arabic text.
    utterance.lang = selectedVoice.lang;
  }

  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
