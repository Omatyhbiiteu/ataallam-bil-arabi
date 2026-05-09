
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

export const detectLang = (text: string): 'ar' | 'en' | 'de' => {
  // Regex for Arabic characters including extended set and presentation forms
  // Range: 0600-06FF (Arabic), 0750-077F (Arabic Supplement), 08A0-08FF (Arabic Extended-A)
  // FB50-FDFF (Arabic Pres. Forms-A), FE70-FEFF (Arabic Pres. Forms-B)
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const germanPattern = /[äöüßÄÖÜ]/;
  
  if (arabicPattern.test(text)) return 'ar';
  if (germanPattern.test(text)) return 'de';
  return 'en';
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
