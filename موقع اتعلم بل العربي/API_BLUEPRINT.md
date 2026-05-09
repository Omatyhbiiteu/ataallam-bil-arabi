# وثيقة تصميم واجهة برمجة التطبيقات (API Blueprint)
هذا الملف صُمم خصيصاً لمبرمجي الـ Backend القادمين. 
بناءً عليه، يمكنك تصميم وبناء جميع نقاط النهاية (Endpoints) اللازمة ليقوم موقعنا (React Frontend) بالاتصال بالـ Backend الخاص بك بدلاً من الـ Firebase والروابط المباشرة الحالية.

**الموقع الحالي** يتعامل مع الواجهة من خلال مجلد `services`. لبناء الـ API الخاص بك بنجاح، يجب عليك توفير الـ Endpoints أدناه:

---

## 1. المصادقة (Authentication)
*التعويض عن ملف `services/authService.ts`*

### `POST /api/auth/login`
- **الوظيفة**: تسجيل الدخول باستخدام البريد وكلمة المرور.
- **المدخلات (Body)**: `{ email, password }`
- **المخرجات**: `{ token, user: { id, name, email, role } }`

### `POST /api/auth/register`
- **الوظيفة**: إنشاء حساب جديد.
- **المدخلات (Body)**: `{ name, email, password }`
- **المخرجات**: `{ token, user: { id, name, email, role } }`

### `POST /api/auth/google`
- **الوظيفة**: تسجيل الدخول باستخدام حساب جوجل.
- **المدخلات (Body)**: `{ googleToken }`
- **المخرجات**: `{ token, user: { id, name, email, role } }`

---

## 2. إدارة المستخدم والتقدم (User & Progress)
*التعويض عن ملف `services/db.ts` وبعض وظائف ملف `srsService.ts`*

### `GET /api/user/profile`
- **الوظيفة**: جلب بيانات المستخدم الحالية (المستوى، الإحصائيات، الكلمات المحفوظة).
- **الرأسيات (Headers)**: `Authorization: Bearer <token>`
- **المخرجات**: `{ id, name, email, currentLevel, learningLanguage, points, streak, ... }`

### `PUT /api/user/profile`
- **الوظيفة**: تحديث إعدادات المستخدم أو مستواه.
- **المدخلات (Body)**: `{ currentLevel, learningLanguage }` (مثال)

### `GET /api/user/progress`
- **الوظيفة**: جلب الكلمات التي يتعلمها المستخدم وتواريخ المراجعة القادمة بناءً على نظام التكرار المتباعد (SRS).
- **المخرجات**: `[ { wordId, status, nextReviewDate, interval, easeFactor }, ... ]`

### `POST /api/user/progress/review`
- **الوظيفة**: إرسال نتيجة مراجعة الكلمة الفلاشية (Flashcard) لتحديث نظام التكرار المتباعد.
- **المدخلات (Body)**: `{ wordId, wasCorrect: boolean, timeSpent: number }`

---

## 3. الذكاء الاصطناعي (AI Services)
*التعويض عن ملف `services/aiService.ts`*
في المشروع الحالي نحن نرسل البيانات مباشرة من المتصفح إلى خدمة Gemini و Pollinations API. لأسباب أمنية (إخفاء مفاتيح API)، يجب نقل هذا إلى الـ Backend.

### `POST /api/ai/chat`
- **الوظيفة**: إدارة محادثة الذكاء الاصطناعي.
- **المدخلات (Body)**: `{ prompt, targetLanguage, mode, history, level }` 
- **المخرجات**: `{ responseText: "الرد من الذكاء الاصطناعي" }`

### `POST /api/ai/analyze-text`
- **الوظيفة**: تحليل وتصحيح نصوص المستخدم للقاموس الذكي.
- **المدخلات (Body)**: `{ text, targetLanguage, userLevel }`
- **المخرجات**: `{ isCorrect: boolean, correctedText, explanation, improvements: [], mistakes: [] }`

### `POST /api/ai/word-details`
- **الوظيفة**: جلب تفاصيل معقدة لكلمة (أمثلة، متلازمات، شرح).
- **المدخلات (Body)**: `{ word, targetLanguage, userLevel }`
- **المخرجات**: `{ collocations: [], nuance, example_context, visual_cue }`

### `POST /api/ai/generate-study-plan`
- **الوظيفة**: توليد خطة دراسة أسبوعية ذكية.
- **المدخلات (Body)**: `{ level, daysPerWeek, hoursPerWeek, primaryGoal, ... }`
- **المخرجات**: `{ weeklySchedule: [], overallTips: [], motivation, projectedLevel }`

---

## 4. المحتوى (Content)
*(لجلب بيانات الدروس الثابتة وتفاصيل اللغات)*

### `GET /api/content/languages`
- **الوظيفة**: استرجاع اللغات المتاحة للتعلم وتفاصيل مستوياتها.

### `GET /api/content/scenarios`
- **الوظيفة**: استرجاع سيناريوهات المحادثة (Roleplay scenarios) المتاحة.
- **المخرجات**: `[ { id, title, description, roles, difficulty }, ... ]`

---

## 5. الصوت (Text-to-Speech)
*التعويض عن واجهة التحدث `ttsService.ts`*

### `POST /api/tts/generate`
- **الوظيفة**: تحويل النص إلى صوت (ملف صوتي). يفضل أن يقوم الـ Backend باستعمال واجهات خارجية (مثل Azure TTS أو ElevenLabs) وإرجاع مسار الملف الصوتي.
- **المدخلات (Body)**: `{ text, language, voiceType }`
- **المخرجات**: `{ audioUrl: "https://.../audio.mp3" }`

---

> **ملاحظة للمبرمج (Frontend):** 
عندما ينهي مبرمج الـ Backend هذا العمل ويسلمه لك كمجموعة مسارات (URLs)، سيكون عليك ببساطة تغيير الكود في ملفات مجلد الـ `services` لاستخدام `fetch()` أو `axios` لطلب هذه المسارات المتوفرة في سيرفر الـ Backend، بدلاً من استدعاء مكتبة `firebase` أو دوال `GoogleGenerativeAI` مباشرة.
