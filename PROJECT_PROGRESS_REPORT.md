# Project Progress Report

هذا الملف هو السجل الرسمي للتعديلات التي تمت على المشروع، ويتم تحديثه بعد كل تغيير جديد.

## Project Paths

- Root: `c:\Users\Rady\Desktop\موقع اتعلم بل العربي`
- Main Frontend: `موقع اتعلم بل العربي`
- Admin Frontend: `لوحه التحكم الخارجيه`
- Backend: `backend`
- **تقرير مبسّط (نسبة الإنجاز + إيه خلص/فاضل):** [SITE_PAGES_AND_FEATURES_REPORT.md](./SITE_PAGES_AND_FEATURES_REPORT.md)

## Timeline (Ordered)

### 1) Initial Inspection

- تم فحص هيكل المشروع بالكامل.
- تم التأكد أن المشروع يحتوي على:
  - Frontend رئيسي React + Vite + TypeScript.
  - Frontend لوحة تحكم React + Vite + TypeScript.
  - عدم وجود Backend جاهز مسبقًا داخل المشروع.

### 2) Frontend Run Verification

- تم التأكد أن لوحة التحكم تعمل محليًا بأمر:
  - `npm run dev`
- رابط لوحة التحكم:
  - `http://localhost:3001/admin/`

### 3) Admin Login Code Discovery

- تم تحديد منطق كلمة مرور لوحة الإدارة في:
  - `لوحه التحكم الخارجيه/components/AdminAuthModal.tsx`
- الكود يعتمد على:
  - `VITE_ADMIN_PASSWORD`
  - وإذا لم تكن موجودة، fallback إلى `'123'`.

### 4) Laravel Backend Setup

- تم إنشاء Laravel Backend في:
  - `backend`
- أمر الإنشاء:
  - `composer create-project laravel/laravel backend`
- نسخة Laravel التي تم تثبيتها متوافقة مع PHP الحالي.

### 5) API Scaffolding Installation

- تم تشغيل:
  - `php artisan install:api --no-interaction`
- تم إضافة Sanctum ومجلد/ملفات API اللازمة.

### 6) Database Preparation (XAMPP MySQL)

- تم إنشاء قاعدة البيانات:
  - `et3alem_araby`
- تم تعديل `backend/.env` لاستخدام MySQL بدل SQLite:
  - `DB_CONNECTION=mysql`
  - `DB_HOST=127.0.0.1`
  - `DB_PORT=3306`
  - `DB_DATABASE=et3alem_araby`
  - `DB_USERNAME=root`
  - `DB_PASSWORD=`

### 7) Migrations

- تم تنفيذ:
  - `php artisan config:clear`
  - `php artisan migrate`
- النتيجة: جميع migrations الأساسية + personal_access_tokens نجحت.

### 8) CORS Configuration

- تم نشر ملف CORS:
  - `php artisan config:publish cors`
- ثم تعديل:
  - `backend/config/cors.php`
- القيم المفعلة:
  - `http://localhost:3000`
  - `http://localhost:3001`

### 9) API Health Endpoint

- تم إضافة endpoint فحص في:
  - `backend/routes/api.php`
- المسار:
  - `GET /api/health`
- الاستجابة المتوقعة:
  - `{"ok":true,"service":"Laravel API"}`

### 10) Sanctum Trait on User Model

- تم تعديل:
  - `backend/app/Models/User.php`
- تمت إضافة:
  - `use Laravel\Sanctum\HasApiTokens;`
  - `use HasApiTokens, HasFactory, Notifiable;`

### 11) Frontend Environment Wiring

- تم تعديل:
  - `موقع اتعلم بل العربي/.env`
  - `لوحه التحكم الخارجيه/.env`
- لتفعيل:
  - `VITE_BACKEND_API_URL=http://127.0.0.1:5000/api`
- تم تحويل مفتاح Gemini إلى صيغة Vite:
  - `VITE_GEMINI_API_KEY=...`
- تم ضبط رمز حماية الإدارة في لوحة التحكم عبر متغير البيئة:
  - `VITE_ADMIN_PASSWORD`

### 12) Backend Runtime Verification

- تم تشغيل Laravel على:
  - `http://127.0.0.1:5000`
- تم اختبار:
  - `GET /api/health`
- النتيجة: نجح الاختبار.

## Current Run Commands

## عناوين الوصول السريعة
- Backend (Laravel): `http://127.0.0.1:5000`
- الموقع الرئيسي: `http://127.0.0.1:3000`
- لوحة التحكم الخارجية: `http://127.0.0.1:3001/admin/`

### Backend
_____________________________________________________________________________________________________________________________
```powershell
cd "c:\Users\Rady\Desktop\موقع اتعلم بل العربي\backend"
composer install
php artisan migrate --force --no-interaction
php artisan serve --host=127.0.0.1 --port=5000
```

### Admin Frontend 

```powershell
cd "c:\Users\Rady\Desktop\موقع اتعلم بل العربي\لوحه التحكم الخارجيه"
npm install
npm run dev
```

### Main Frontend

```powershell
cd "c:\Users\Rady\Desktop\موقع اتعلم بل العربي\موقع اتعلم بل العربي"
npm install
npm run dev
```

## Notes

- يجب إعادة تشغيل Vite بعد أي تعديل في ملفات `.env`.
- إذا كان MySQL في XAMPP عليه كلمة مرور، عدّل `DB_PASSWORD` في `backend/.env`.
- هذا الملف سيتم تحديثه تلقائيًا مع أي تعديل جديد في المحادثات القادمة.

---

Last updated: 2026-05-08 (محدّث: استعادة كلمة المرور عبر الطلب للمسؤول + تبويب «مشاكل المستخدمين»؛ إزالة دخول Google/Facebook من صفحة الدخول؛ بالإضافة إلى: حدود المجاني/Pro، قصة واحدة للمجاني، المواقف الحياتية لـ Pro، وتأمين API)

## Update Log (Latest)

### 2026-05-08 — نسيت كلمة المرور: طلب للمسؤول + تبويب «مشاكل المستخدمين» + إزالة دخول السوشيال من صفحة الدخول

#### 1) صفحة تسجيل الدخول (`LoginView.tsx`)

- **إزالة** أزرار تسجيل الدخول عبر **Google** و**Facebook** بالكامل (لا يوجد بعد الآن قسم «أو تابع باستخدام»).
- زر **«نسيت كلمة المرور؟»** يستدعي **`onForgotPassword(email.trim())`** لتمرير البريد المكتوب في حقل الدخول إلى الشاشة التالية.

#### 2) صفحة «هل نسيت كلمة السر؟» (`ForgotPasswordView.tsx`)

- حقول إلزامية: **الاسم بالكامل**، **البريد الإلكتروني**، **رقم الهاتف**.
- **تعبئة البريد:** prop **`initialEmail`** يُمرَّر من **`App.tsx`** (`forgotPasswordPrefillEmail`) عند الانتقال من صفحة الدخول.
- الإرسال عبر **`AuthAPI.submitPasswordRecoveryRequest`** (بدون توكن مستخدم).
- رسالة النجاح توضح أن الطلب وصل إلى لوحة المسؤول وليس إرسال رابط بريد تلقائي.

#### 3) التطبيق الرئيسي — ربط الحالة (`App.tsx`)

- حالة **`forgotPasswordPrefillEmail`**: عند فتح شاشة النسيان يُحدَّث البريد من حقل تسجيل الدخول.
- **`ForgotPasswordView`** يستقبل **`initialEmail={forgotPasswordPrefillEmail}`**.

#### 4) API العميل — الموقع (`موقع اتعلم بل العربي/services/apiClient.ts`)

- **`AuthAPI.submitPasswordRecoveryRequest(body)`** → **`POST /password-recovery-requests`**  
  - Body: `{ full_name, email, phone }` (مطابقة لتحقق Laravel).

#### 5) الباكند (Laravel)

- **هجرة:** `backend/database/migrations/2026_05_08_000000_create_password_recovery_requests_table.php`  
  - جدول **`password_recovery_requests`**: `full_name`, `email`, `phone`, `created_at`, `updated_at`.
- **نموذج:** `backend/app/Models/PasswordRecoveryRequest.php`.
- **عام (بدون مصادقة):**  
  - **`PasswordRecoveryRequestController@store`** — تحقق من الحقول وحفظ الطلب.  
  - مسار: **`POST /api/password-recovery-requests`** مع وسيط **`throttle:15,1`** (حد معدل الطلبات).
- **للمسؤول (Sanctum — توكن لوحة التحكم):**  
  - **`AdminPasswordRecoveryRequestController@index`** — إرجاع قائمة الطلبات (أحدث أولاً) بصيغة JSON مناسبة للواجهة (`fullName`, `email`, `phone`, `createdAt`).  
  - مسار: **`GET /api/admin/password-recovery-requests`**.
- **تسجيل المسارات:** `backend/routes/api.php` (استيراد المتحكمين وإضافة السطرين أعلاه).

#### 6) لوحة التحكم الخارجية

- **`AdminSidebar.tsx`:** في مجموعة **«الإدارة والنظام»** — عنصر **`user_problems`** بعنوان **«مشاكل المستخدمين»** **فوق** «المستخدمين» (أيقونة `AlertTriangle`).  
  - تحديث نوع **`activeTab`** ليشمل **`user_problems`**.
- **`AdminUserProblemsTab.tsx`:** عرض جدولي لطلبات استعادة كلمة المرور (النوع، الاسم، البريد مع `mailto:`، الهاتف، التاريخ المحلي) + زر تحديث.
- **`AdminDashboard.tsx`:** عند **`activeTab === 'user_problems'`** عرض **`AdminUserProblemsTab`**.
- **`لوحه التحكم الخارجيه/services/apiClient.ts`:** **`AdminAPI.getPasswordRecoveryRequests()`** → **`GET /admin/password-recovery-requests`**.

#### 7) تشغيل / ترحيل قاعدة البيانات

- بعد سحب التعديلات: من مجلد **`backend`** تشغيل **`php artisan migrate`** لإنشاء جدول **`password_recovery_requests`** إن لم يكن مُنشأ.

#### ملفات بارزة (هذا القسم)

- `موقع اتعلم بل العربي/components/LoginView.tsx`
- `موقع اتعلم بل العربي/components/ForgotPasswordView.tsx`
- `موقع اتعلم بل العربي/App.tsx`
- `موقع اتعلم بل العربي/services/apiClient.ts`
- `backend/database/migrations/2026_05_08_000000_create_password_recovery_requests_table.php`
- `backend/app/Models/PasswordRecoveryRequest.php`
- `backend/app/Http/Controllers/Api/PasswordRecoveryRequestController.php`
- `backend/app/Http/Controllers/Api/AdminPasswordRecoveryRequestController.php`
- `backend/routes/api.php`
- `لوحه التحكم الخارجيه/components/admin/AdminSidebar.tsx`
- `لوحه التحكم الخارجيه/components/admin/AdminUserProblemsTab.tsx`
- `لوحه التحكم الخارجيه/components/AdminDashboard.tsx`
- `لوحه التحكم الخارجيه/services/apiClient.ts`

---

### 2026-05-08 — الخطة المجانية vs Pro: مجلدات، بطاقات، قصص، مواقف حياتية، UX للمودالات، وباك‑إند

#### 1) المجلدات والبطاقات (المستخدم غير المشترك)

- **الحدود:** حتى **3 مجلدات رئيسية** لكل لغة (بدون `parentId`)؛ حتى **10 بطاقات** لكل مجلد؛ **لا مجلدات فرعية** (لا `parentId` عند الإنشاء أو التعديل).
- **`App.tsx`:** ثوابت `FREE_MAX_FOLDERS = 3`، `FREE_MAX_CARDS_PER_FOLDER = 10`؛ عدّ المجلدات للحد يقتصر على المجلدات **بدون أب** (`!f.parentId`)؛ رفض إنشاء مجلد بأب للمجاني مع `openUpgradeModal`؛ رفض تعيين `parentId` عند تعديل المجلد للمجاني.
- **`FoldersView.tsx`:** prop **`isProSubscriber`**؛ بانر توضيحي للمجاني؛ قسم المجلدات الفرعية: للمجاني نص يشرح أن التداخل لـ Pro؛ عند حفظ مجلد جديد من داخل مجلد للمجاني → toast ولا إنشاء فرعي؛ لـ Pro يبقى زر «إضافة مجلد فرعي» وسقف العمق السابق.
- **تمرير من `App.tsx`:** `isProSubscriber={hasActiveSubscription}` على `FoldersView`.

#### 2) الباك‑إند (مواءمة مع الواجهة)

- **`backend/app/Models/User.php`:** دالة **`hasActivePaidPlan()`** — خطط `pro`/`enterprise` مع احترام **`plan_expires_at`** عند الانتهاء.
- **`UserFolderController`:** للمستخدم غير المدفوع — رفض **`parentId`** غير فارغ عند الإنشاء والتحديث؛ حد **3 مجلدات جذر** (`parent_id` null) لكل لغة عند الإنشاء.
- **`UserCardController`:** للمستخدم غير المدفوع — حد **10 بطاقات** لكل مجلد عند الإنشاء؛ عند **نقل** البطاقة لمجلد آخر يُتحقق من الحد في المجلد الهدف.

#### 3) إضافة بطاقة + مودال الترقية (ترتيب الطبقات)

- **`types.ts`:** نوع **`AddCardResult = boolean | 'pro_limit'`**.
- **`App.tsx` — `handleAddCard`:** عند بلوغ حد البطاقات للمجاني يُستدعى `openUpgradeModal` ثم يُعاد **`'pro_limit'`** بدل `false` فقط.
- **`FoldersView.tsx` — `submitCard`:** إذا `'pro_limit'` → **`setShowCardModal(false)`** وتصفير النموذج حتى لا يبقى مودال البطاقة فوق مودال Pro (`z-index` أعلى للبطاقة سابقًا).
- **`DictionaryView.tsx` / `StoriesView.tsx`:** التعامل الصحيح مع **`AddCardResult`** (إغلاق مودال الحفظ عند `pro_limit`؛ اعتبار نجاح الإضافة من القصة عند **`ok === true`** فقط).

#### 4) القصص — قصة واحدة للمجاني

- **`StoriesView.tsx`:** **`isProSubscriber`**, **`onRequirePro`**؛ أول قصة في مصفوفة **`stories`** للغة الحالية = الوحيدة المفتوحة للمجاني؛ الباقي بطاقات مقفلة (قفل + نشرة Pro)؛ النقر يفتح رسالة ترقية؛ **`handleSelectStory`** يمنع التحميل للقصص المقفلة.
- **`App.tsx`:** تمرير **`isProSubscriber={hasActiveSubscription}`** و **`onRequirePro`** مع عنوان مودال مناسب.

#### 5) المواقف الحياتية — اشتراك مدفوع فقط

- **`App.tsx`:** **`navigateMainTab`** — إذا `tab === 'sentences'` وليس **`hasActiveSubscription`** → `openUpgradeModal` و**لا تغيير للتبويب**؛ الشريط الجانبي يستخدم **`navigateMainTab`** بدل **`setActiveTab`**؛ **`HomeView`**, **`FoldersView.onNavigate`**, **`SettingsView.onNavigate`** تستخدم **`navigateMainTab`** حتى لا يُفتح القسم من مسارات جانبية بدون اشتراك.
- **عرض المحتوى:** عند `activeTab === 'sentences'` بدون اشتراك → **شاشة حاجز** (شرح + زر يفتح مودال الترقية) وليس **`SentencesView`** الكامل.
- **جلب API:** استدعاءات **`SentencesAPI.getAll`** (والتحديث عند الفتح/التركيز) تُنفَّذ فقط إذا **`hasActiveSubscription`** لتقليل التحميل غير المصرَّح به للمجاني.
- **`Sidebar.tsx`:** prop **`hasActiveSubscription`**؛ على عنصر «المواقف الحياتية» للمجاني تظهر شارة **Pro** بجانب النص.

#### ملفات بارزة (هذا القسم)

- `موقع اتعلم بل العربي/App.tsx`
- `موقع اتعلم بل العربي/types.ts`
- `موقع اتعلم بل العربي/components/FoldersView.tsx`
- `موقع اتعلم بل العربي/components/DictionaryView.tsx`
- `موقع اتعلم بل العربي/components/StoriesView.tsx`
- `موقع اتعلم بل العربي/components/Sidebar.tsx`
- `backend/app/Models/User.php`
- `backend/app/Http/Controllers/Api/UserFolderController.php`
- `backend/app/Http/Controllers/Api/UserCardController.php`

#### ملاحظة أمان لاحقة (اختيارية)

- يمكن إضافة مسار API محمي لـ **المواقف الحياتية** يتحقق من **`hasActivePaidPlan()`** إذا كان المحتوى الحساس لا يجب أن يُجلب حتى بدون الواجهة.

### 2026-04-17 — المساعد الذكي (Gemini + الميكروفون + لغة المحادثة) وإعادة تسمية FluentFlow → Et3alem Bel Araby

#### 1) ضبط مفتاح Google Gemini (الواجهة الرئيسية)

- **المتغير:** `VITE_GEMINI_API_KEY` في **`موقع اتعلم بل العربي/.env`** (يُقرأ في **`services/aiService.ts`** عبر `import.meta.env`).
- **النموذج:** `gemini-flash-latest` على `generativelanguage.googleapis.com/v1beta/.../generateContent`.
- **بعد أي تعديل على `.env`:** إعادة تشغيل Vite (`npm run dev`).
- **أمان:** تحديث **`موقع اتعلم بل العربي/.gitignore`** ليشمل **`/.env`** و **`/.env.*`** مع **`!.env.example`** حتى لا تُرفع أسرار إلى Git بالخطأ. **لا تُلصق المفاتيح الحقيقية في الشات أو في المستودع.**

#### 2) الميكروفون (المعلم الصوتي) — `components/AIAssistantView.tsx`

- **قبل البدء:** التحقق من **`speechSupported`** (Web Speech API — يُفضّل Chrome/Edge).
- **سياق آمن:** تحذير إن لم يكن **`window.isSecureContext`** (يفضّل `localhost` أو HTTPS).
- **الأذونات:** استدعاء **`navigator.mediaDevices.getUserMedia({ audio: true })`** عند الضغط على زر الميكروفون؛ عند الرفض أو الخطأ تُعرض رسائل عربية واضحة.
- **`navigator.permissions.query({ name: 'microphone' })`** عند الدعم؛ إذا كانت الحالة **`denied`** يُعرض دليل منح الإذن دون محاولة فاشلة.
- **رسالة الدليل:** ثابت **`MIC_PERMISSION_GUIDE_AR`** + دالة **`messageForGetUserMediaError`** (أنواع `DOMException`: رفض، لا يوجد ميكروفون، مشغول، أمان).
- **تنظيف:** `useEffect` لإعداد **`SpeechRecognition`** مع **`return`** يوقف الجلسة ويزيل المستمعين عند تغيير لغة التعرف أو إلغاء التثبيت.
- **إصلاح closure:** **`processVoiceTextRef`** يُحدَّث كل عرض ويُستدعى من **`onresult`** حتى يصل أحدث منطق لـ **`processMessage`**.
- **واجهة:** استبدال أيقونة **`MicOff`** في الوضع الخامل بـ **`Mic`** (الزر لا يبدو «معطّلاً»)؛ عرض **`voiceError`** و **`speechSupported`** تحت مستوى CEFR مع **`whitespace-pre-line`** و **`dir="rtl"`** للرسائل متعددة الأسطر.
- **`toggleListening`:** دالة **`async`**؛ عند الإيقاف يُضبط **`listeningRef.current = false`** قبل **`stop()`**؛ **`handleClearSession`** يصفّر نفس المرجع و**`voiceError`**.

#### 3) حصر لغة الممارسة مع المساعد — `services/ttsService.ts` + `AIAssistantView.tsx` + `aiService.ts`

- **دالة جديدة:** **`classifyPracticeInputLang(text)`** → `'ar' | 'de' | 'en' | 'other' | 'neutral'`:
  - نطاقات عربية / سيريلية / يونانية / عبرية، ألمانية (Umlaut + قوائم كلمات موسّعة)، كلمات لاتينية شائعة لغات أخرى (مثل bonjour/hola)، ومقارنة تلميحات EN/DE لتقليل الإيجابيات الخاطئة؛ **`neutral`** يمرّر للـ API عند الغموض.
- **`processMessage`:** إن كانت لغة التعلّم **EN** والنص مُصنَّفًا **ليس** `en` ولا `neutral` → رد ثابت بالإنجليزي فقط (**`pleaseSpeakOnlyTarget`**). وإن كانت **DE** والنص ليس `de` ولا `neutral` → رد ثابت بالألماني فقط. في **وضع الصوت** يُستدعى **`speakText`** بنفس الرد بلغة التعلّم.
- **`aiService.sendMessage`:** تعزيز تعليمات النظام بأن **كل ردود المساعد تكون بلغة التعلّم فقط** (tutor / roleplay / general)، مع استعادة سطر **B1/B2** في وصف المعلّم بعد إصلاح حذف غير مقصود.

#### 4) إعادة تسمية العلامة التجارية (FluentFlow → اتعلم بالعربي / Et3alem Bel Araby)

- **`services/aiService.ts`:** اسم المساعد في التعليمات أصبح **"Et3alem Bel Araby AI"** والتطبيق **"Et3alem Bel Araby" (اتعلم بالعربي)** بدل FluentFlow.
- **`components/SettingsView.tsx`:** سطر النظام الظاهر: **Et3alem Bel Araby · v2.2** (مع `uppercase` في الواجهة).
- **`components/LandingPage.tsx`:** تعليق الكود يصف **اتعلم بالعربي Pro**.
- **`README.md`:** عنوان ومقاطع وصورة alt و«لماذا…» باسم **اتعلم بالعربي Pro**؛ مسار الاستنساخ/الهيكل **`et3alem-bel-araby`** ليتوافق مع **`package.json`**.
- **لم يُغيّر:** مفاتيح **`localStorage`** الداخلية التي تحتوي على الاسم القديم **`fluentflow_*`** في **`paymentService.ts`** و **`supportService.ts`** (تجنب فقدان بيانات المستخدمين؛ يمكن لاحقًا إضافة ترحيل تلقائي عند الطلب).

#### 5) المجتمع (لوحة شرف + مزامنة لكل لغة EN/DE) — Backend + Frontend

- **هجرة:** `backend/database/migrations/2026_04_17_150000_create_user_community_stats_table.php` — جدول **`user_community_stats`** (مستخدم + لغة: قصص مكتملة، إجمالي كويز، متوسط نسبة الكويز، أيام streak، إلخ).
- **كنترولر:** `backend/app/Http/Controllers/Api/CommunityController.php`:
  - **`POST /api/user/community/{lang}/sync`** (Sanctum): حفظ/تحديث إحصاءات المستخدم للغة المحددة.
  - **`GET /api/user/community/{lang}`**: لوحة المتصدرين لنفس اللغة — دمج مستخدمين من **`target_language`** + إحصاءات البطاقات من **`content_cards`** + **`UserCommunityStat`**؛ ترتيب حسب XP محسوبة (`reviews×2 + mastered×5 + stories×10 + quizTotal`)؛ **`ahead`** (من أمامك في الترتيب)، **`percentiles`**, **`your_rank`**.
- **موديل:** `backend/app/Models/UserCommunityStat.php`.
- **الواجهة:** `components/CommunityView.tsx` — مزامنة مع السيرفر، لوحة شرف، مهام يومية قابلة للنقر للانتقال لتنفيذ المهمة؛ **`apiClient.ts`** مسارات المجتمع.

#### 6) عزل تقدّم كل مستخدم (محلي + Firestore عند الدخول)

- **`services/db.ts`:** نطاق تخزين التقدّم (`progressStorageScope`)، ترحيل مفاتيح قديمة، ومزامنة مسار **`user_progress/{laravelUserId}`** عند وجود جلسة Laravel.
- **`hooks/useAppData.ts`:** مفاتيح التقدّم (بطاقات، قصص، مراجعات، مهام يومية، إلخ) مرتبطة بـ **`{userId}_{lang}`** لتفادي خلط مستخدمين أو لغات.

#### 7) القصص: إكمال القراءة بدون اختبار + تسجيل المهام

- **`components/StoriesView.tsx`:** زر/مسار لإكمال القصة كقراءة **دون** شرط اجتياز الاختبار حيث ينطبق.
- **`App.tsx`:** معالجات مثل إكمال القصة وتسجيل **`registerDailyStoryCompleted`** عند نجاح الاختبار حيث ينطبق؛ توحيد مقارنة **بداية اليوم المحلي** مع **`reviewLog`** حيث صُلح.

#### 8) مهام اليوم (Daily missions) و XP محلي

- **`types.ts`:** `DailyMissionState`, `INITIAL_DAILY_MISSION`.
- **`hooks/useAppData.ts`:** حالة **`dailyMissionState`**, **`registerDailyStoryCompleted`**, **`registerDailyMastered`**, منح مكافآت يومية (قيم مثل 50/30/100) مع **`localDateKey`** / **`localDayStartMs`**؛ **`levelData.totalXP`** يشمل **`dailyMissionState.bonusXp`**؛ عدّادات الإتقان/المراجعة اليومية في مسارات تعديل البطاقات وجلسة المراجعة.

#### 9) توافر لغات التعلّم (EN/DE) — أدمن + مستخدم

- **باك‑إند:** `LanguageAvailabilityController` + موديل **`LanguageAvailabilitySetting`**؛ مسارات عامة **`GET /api/settings/language-availability`**؛ للأدمن **`GET`/`PUT /api/settings/language-availability`** (ضمن مجموعة Sanctum + Admin).
- **لوحة التحكم:** `OverviewTab` (أو ما يعادله) — تفعيل/تعطيل EN وDE وحفظ على السيرفر.
- **التطبيق:** منع التسجيل أو التحويل للغة المقفولة مع رسالة واضحة + **fallback** تلقائي للغة المتاحة.

#### ملفات بارزة (هذا القسم)

- `موقع اتعلم بل العربي/.env` (مفتاح Gemini محليًا — غير مُرفوع)
- `موقع اتعلم بل العربي/.gitignore`
- `موقع اتعلم بل العربي/services/aiService.ts`
- `موقع اتعلم بل العربي/services/ttsService.ts`
- `موقع اتعلم بل العربي/components/AIAssistantView.tsx`
- `موقع اتعلم بل العربي/components/SettingsView.tsx`
- `موقع اتعلم بل العربي/components/LandingPage.tsx`
- `موقع اتعلم بل العربي/README.md`
- `موقع اتعلم بل العربي/components/CommunityView.tsx`
- `موقع اتعلم بل العربي/services/apiClient.ts`
- `موقع اتعلم بل العربي/services/db.ts`
- `موقع اتعلم بل العربي/hooks/useAppData.ts`
- `موقع اتعلم بل العربي/types.ts`
- `موقع اتعلم بل العربي/components/StoriesView.tsx`
- `موقع اتعلم بل العربي/App.tsx`
- `backend/database/migrations/2026_04_17_150000_create_user_community_stats_table.php`
- `backend/app/Http/Controllers/Api/CommunityController.php`
- `backend/app/Models/UserCommunityStat.php`
- `backend/app/Http/Controllers/Api/LanguageAvailabilityController.php`
- `backend/app/Models/LanguageAvailabilitySetting.php`
- `backend/routes/api.php`
- `لوحه التحكم الخارجيه/components/admin/OverviewTab.tsx` (تفعيل/تعطيل EN وDE وتوافر اللغات)

#### تشغيل / تحقق سريع

- الواجهة: من **`موقع اتعلم بل العربي`** → `npm run dev` بعد ضبط **`.env`**.
- اختبار المساعد: أوضاع **خطة / محادثة / صوت**؛ الميكروفون على Chrome/Edge مع السماح بالإذن.
- اختبار الحارس اللغوي: إدخال عربي أو ألماني في وضع EN، أو إنجليزي في وضع DE، والتأكد من الرسالة بلغة التعلّم فقط.

### 2026-03-25 - إعدادات الدفع والباقات (Backend + مزامنة المستخدم) وإصلاح توكن مسارات `/admin`

#### المشكلة التي حُلّت

- لوحة المسئول كانت تعرض الباقات ووسائل الدفع بعد التعديل، بينما صفحة اشتراك المستخدم لا تتلقى نفس البيانات لأن الحفظ لم يكن يصل لقاعدة البيانات في بعض الحالات.

#### الباك‑إند

- هجرة `2026_03_25_050000_create_payment_settings_table.php`: جدول `payment_settings` مع عمود JSON `payload` لحفظ إعدادات الدفع كاملة (طرق الدفع، السعر، باقات الاشتراك، إلخ).
- موديل `backend/app/Models/PaymentSetting.php` مع cast للـ `payload` كـ `array`.
- كنترولر `backend/app/Http/Controllers/Api/PaymentSettingsController.php`:
  - `GET /api/payment-settings` (عام): إرجاع الإعدادات للمستخدمين **بدون** `stripeSecretKey`.
  - `GET /api/admin/payment-settings` و `PUT /api/admin/payment-settings` (Sanctum + التحقق أن المستخدم `AdminUser`): قراءة/كتابة كاملة بما فيها الأسرار.
- تحديث `backend/routes/api.php` لتسجيل المسارات أعلاه.

#### الواجهات (الموقع + لوحة التحكم)

- `paymentService.ts` (في المشروعين): دالة `mergePaymentSettings` و`PaymentService.fetchFromServer()` في التطبيق الرئيسي لجلب الإعدادات من الـ API وحفظها في `localStorage` كنسخة احتياطية.
- `موقع اتعلم بل العربي/services/apiClient.ts`: إضافة `PaymentsAPI.getPaymentSettings()`.
- `SettingsView.tsx`: جلب الإعدادات عند فتح قسم **الاشتراك** أو نافذة الدفع؛ وعرض سطر **«وسائل الدفع المتاحة بعد الاشتراك»** (فودافون كاش / إنستاباي / فوري) حسب ما فعّله المسئول.
- `لوحه التحكم الخارجيه/components/admin/payment/PaymentSettingsTab.tsx`: تحميل الإعدادات من الـ API عند فتح التبويب وحفظها عبر `PUT` مع حالات تحميل/حفظ.
- `لوحه التحكم الخارجيه/services/apiClient.ts`: `AdminAPI.getPaymentSettings` و `AdminAPI.updatePaymentSettings`.

#### إصلاح حرج: اختيار التوكن في `fetchApi`

- **قبل الإصلاح:** كان يُستخدم `auth_token` ثم `hcard_admin_token`. إذا كان المستخدم مسجلاً في التطبيق ولوحة المسئول معاً، طلبات **`/admin/*`** كانت تُرسل بتوكن **المستخدم** فيفشل الحفظ (403) ولا يُسجَّل صف في `payment_settings`.
- **بعد الإصلاح:** أي مسار يبدأ بـ `/admin` يستخدم **`hcard_admin_token` فقط**؛ باقي المسارات تبقى أولوية `auth_token` ثم توكن المسئول. التعديل في:
  - `موقع اتعلم بل العربي/services/apiClient.ts`
  - `لوحه التحكم الخارجيه/services/apiClient.ts`

#### تشغيل بعد السحب

- `php artisan migrate` (لجدول `payment_settings` إن لم يُنفَّذ بعد).
- بعد النشر: من لوحة المسئول → الدفع → **حفظ التغييرات** مرة أخرى إن كانت البيانات السابقة لم تُخزَّن في القاعدة.

#### ملفات بارزة

- `backend/database/migrations/2026_03_25_050000_create_payment_settings_table.php`
- `backend/app/Models/PaymentSetting.php`
- `backend/app/Http/Controllers/Api/PaymentSettingsController.php`
- `backend/routes/api.php`
- `موقع اتعلم بل العربي/services/paymentService.ts`
- `موقع اتعلم بل العربي/services/apiClient.ts`
- `موقع اتعلم بل العربي/components/SettingsView.tsx`
- `لوحه التحكم الخارجيه/services/paymentService.ts`
- `لوحه التحكم الخارجيه/services/apiClient.ts`
- `لوحه التحكم الخارجيه/components/admin/payment/PaymentSettingsTab.tsx`

### 2026-03-25 - مكمل: عروض الرئيسية، إدارة الإعلانات في التسويق، حذف الكوبون، وصفحة الاشتراك (سلايدر العروض)

#### الرئيسية (`HomeView.tsx` + `OffersSlider`)

- إضافة مكوّن `components/home/OffersSlider.tsx`: سلايدر يعرض إعلانات/عروض المسؤول (`PromoBanner`) النشطة من الـ API، مع تنقل، نسخ، مشاركة، وزر CTA أو الانتقال لإعدادات الاشتراك.
- تمرير العروض من `App.tsx` عبر `offersBanners={banners.filter(isEffectiveBannerActive)}` بحيث لا تُعرض إعلانات منتهية الصلاحية (`expiryDate`) أو غير المفعّلة.
- ترتيب الصفحة: شريط الترقية (Upsell) ثم **عروض المسؤول فقط**، ثم باقي الأقسام؛ **«حكمة اليوم»** (`KnowledgeSlider`) رُجعت لمكانها السابق **بعد** `DailyProgress` وقبل `QuickActions` (وليست تحت شريط الترقية).

#### الباك‑إند: انتهاء الإعلان (`expiry_date`)

- هجرة `2026_03_25_040000_add_expiry_date_to_marketing_banners_table.php`: عمود `expiry_date` (nullable) على `marketing_banners`.
- `MarketingBanner` model: `expiry_date` في `fillable` + cast `datetime`.
- `AdminMarketingController`: قبول `expiryDate` في إنشاء/تحديث الإعلان وإرجاعه في JSON.
- `MarketingController::banners`: إرجاع قائمة الإعلانات مع `expiryDate` (بدون تقييد `is_active` فقط في الاستعلام؛ الفلترة الفعّالة تتم في الواجهة حسب `isActive` + `expiryDate`).

#### لوحة التحكم — تبويب التسويق (`MarketingTab.tsx`)

- عند إغلاق مودال «إعداد النافذة الإعلانية» (X) لإعلان **جديد** وكان العنوان والوصف مكتوبين: يُنشأ الإعلان **كمسودة** (`isActive: false`) حتى لا يختفي المحتوى إذا أُلغي التفعيل الفوري.
- زر **«إدارة»** على كل بطاقة إعلان يفتح مودالًا فيه: **مسح الإعلان**، **إيقاف هذا الإعلان حاليا**، **إيقاف الإعلان بعد مدة** (دقائق/ساعات/أيام) مع حفظ `expiryDate` عبر الـ API.
- شارة الحالة على البطاقة: Active / Draft / Expired حسب `isActive` و`expiryDate`.
- **حذف كوبون الخصم**: استبدال `window.confirm` بمودال مخصص يسأل «هل تريد بالفعل مسح الكود؟» مع تأكيد/إلغاء.

#### الموقع الأساسي — صفحة الاشتراك في الإعدادات (`SettingsView.tsx` + `App.tsx`)

- استبدال كارت العرض الواحد (`activeOfferBanner`) أعلى خطط الاشتراك بسلايدر **`OffersSlider`** يعرض **كل العروض الفعّالة** (`offersBanners`).
- إضافة prop `offersBanners` إلى `SettingsView` وتمريرها من `App.tsx` بنفس منطق الفلترة `isEffectiveBannerActive`.
- الإبقاء على `activeOfferBanner` حيث يلزم (مثل تلميح الكوبون المرتبط في مودال الدفع إن وُجد).

#### تبسيط `OffersSlider`

- إزالة prop غير مستخدم: `selectedTheme` من واجهة `OffersSlider`؛ تحديث الاستدعاء في `HomeView.tsx`.

#### ملفات بارزة

- `موقع اتعلم بل العربي/components/home/OffersSlider.tsx`
- `موقع اتعلم بل العربي/components/HomeView.tsx`
- `موقع اتعلم بل العربي/components/SettingsView.tsx`
- `موقع اتعلم بل العربي/App.tsx`
- `backend/database/migrations/2026_03_25_040000_add_expiry_date_to_marketing_banners_table.php`
- `backend/app/Models/MarketingBanner.php`
- `backend/app/Http/Controllers/Api/AdminMarketingController.php`
- `backend/app/Http/Controllers/Api/MarketingController.php`
- `لوحه التحكم الخارجيه/components/admin/MarketingTab.tsx`
- `موقع اتعلم بل العربي/types.ts` (`expiryDate` اختياري على `PromoBanner`)

#### تشغيل بعد السحب

- `php artisan migrate` (لعمود `expiry_date` على `marketing_banners` إن لم يُنفَّذ بعد).

### 2026-03-24 - Admin Auth Flow Upgrade

- تم تنفيذ تدفق مصادقة جديد للوحة الإدارة على مرحلتين:
  1) إدخال رقم الحماية.
  2) ثم تسجيل دخول الأدمن (Email + Password).
- إذا فشل رقم الحماية، يتم تحويل المستخدم تلقائيًا إلى صفحة اليوزر (`/`).
- تم إضافة شاشة تسجيل دخول أدمن جديدة:
  - `لوحه التحكم الخارجيه/components/AdminLoginView.tsx`
- تم تعديل:
  - `لوحه التحكم الخارجيه/App.tsx`
  - لإدارة حالات:
    - تجاوز بوابة الحماية.
    - تسجيل دخول الأدمن.
    - تسجيل الخروج.
  - مع حفظ حالة الجلسة في `sessionStorage`:
    - `admin_security_passed`
    - `admin_logged_in`
- تم تعديل:
  - `لوحه التحكم الخارجيه/components/AdminAuthModal.tsx`
  - لإضافة callback للفشل `onFailure` وتحويل نص الزر إلى "تأكيد رمز الحماية".
- تم تحديث إعدادات البيئة للأدمن:
  - `لوحه التحكم الخارجيه/.env.example`
  - `لوحه التحكم الخارجيه/.env`
  - بإضافة:
    - `VITE_ADMIN_LOGIN_EMAIL`
    - `VITE_ADMIN_LOGIN_PASSWORD`

### بيانات الدخول الحالية (افتراضيًا)

- رقم الحماية: قيمة `VITE_ADMIN_PASSWORD` داخل ملف `.env`
- إيميل الأدمن: `admin@et3alem.local`
- باسورد الأدمن: قيمة `ADMIN_BOOTSTRAP_PASSWORD` داخل `backend/.env`

### 2026-03-24 - Backend Admin Management (Laravel + MySQL)

- تم ربط لوحة الإدارة بالباك‑إند مباشرة لتسجيل دخول الأدمن عبر Laravel API + Sanctum token.
- تم إنشاء موديل/جدول مسؤولين جديد:
  - `backend/app/Models/AdminUser.php`
  - `backend/database/migrations/2026_03_24_132102_create_admin_users_table.php`
- تم إضافة APIs كاملة لإدارة المسؤولين:
  - `POST /api/admin/auth/login`
  - `POST /api/admin/auth/logout`
  - `GET /api/admin/admin-users`
  - `POST /api/admin/admin-users`
  - `PUT /api/admin/admin-users/me/password`
  - `PUT /api/admin/admin-users/{id}/password`
  - `DELETE /api/admin/admin-users/{id}`
- تم تنفيذ الكنترولرز:
  - `backend/app/Http/Controllers/Api/AdminAuthController.php`
  - `backend/app/Http/Controllers/Api/AdminUserController.php`
- تم تحديث الراوتس:
  - `backend/routes/api.php`
- تم إضافة Bootstrap Admin تلقائي أول مرة (لو مفيش مسؤولين):
  - `ADMIN_BOOTSTRAP_NAME`
  - `ADMIN_BOOTSTRAP_EMAIL`
  - `ADMIN_BOOTSTRAP_PASSWORD`
  داخل:
  - `backend/.env`
  - `backend/.env.example`
- تم تشغيل migration بنجاح لجدول `admin_users`.

### 2026-03-24 - Admin Panel UI for Managers

- تم إنشاء صفحة جديدة لإدارة المسؤولين داخل لوحة الأدمن:
  - `لوحه التحكم الخارجيه/components/AdminManagersView.tsx`
- الصفحة تدعم:
  - عرض كل المسؤولين.
  - إضافة مسؤول جديد.
  - تغيير كلمة مرور المسؤول الحالي.
  - تعديل/استرجاع كلمة مرور أي مسؤول.
  - حذف مسؤول (مع منع حذف الحساب الحالي).
- تم ربط دخول الأدمن بالـ API الحقيقي:
  - `لوحه التحكم الخارجيه/components/AdminLoginView.tsx`
  - حفظ التوكن في `localStorage` باسم `hcard_admin_token`.
- تم إضافة/تحديث توابع API في:
  - `لوحه التحكم الخارجيه/services/apiClient.ts`
- تم إضافة تبويب "المسؤولين" في سايدبار الأدمن:
  - `لوحه التحكم الخارجيه/components/admin/AdminSidebar.tsx`
- تم ربط التبويب داخل الداشبورد:
  - `لوحه التحكم الخارجيه/components/AdminDashboard.tsx`
- تم تحسين تسجيل الخروج لمسح التوكن + جلسة الأدمن:
  - `لوحه التحكم الخارجيه/App.tsx`

### Verification

- تم اختبار Backend endpoints فعليًا:
  - login
  - list admins
  - create admin
  - reset password
  - delete admin
- تم بناء لوحة التحكم (`npm run build`) بنجاح بعد التعديلات.

### 2026-03-24 - Hotfix after login error

- تم إصلاح خطأ Runtime ظهر بعد تسجيل الدخول:
  - `ReferenceError: Shield is not defined`
- السبب:
  - استخدام الأيقونة `Shield` في `AdminSidebar` بدون استيرادها.
- الملف المعدل:
  - `لوحه التحكم الخارجيه/components/admin/AdminSidebar.tsx`
- الإجراء:
  - إضافة `Shield` إلى import من `lucide-react`.
- التحقق:
  - تم تشغيل `npm run build` بنجاح بعد الإصلاح.

### 2026-03-24 - Confirmation Modals + Security Code

- تم تطبيق مودال تأكيد في منتصف الصفحة لكل العمليات الحساسة داخل إدارة المسؤولين:
  - إضافة مسؤول جديد.
  - حذف مسؤول.
  - تغيير كلمة مرور المسؤول الحالي.
  - تعديل/استرجاع كلمة مرور أي مسؤول آخر.
- قبل أي تنفيذ، المودال يطلب إدخال **رمز الحماية**.
- رسالة التأكيد تعرض اسم وإيميل المسؤول (في الإضافة/الحذف/تغيير باسورد مسؤول آخر) كما طلب المستخدم.
- التنفيذ يتم فقط بعد:
  - الضغط على "نعم، تنفيذ".
  - إدخال رمز حماية صحيح.
- الملف المعدل:
  - `لوحه التحكم الخارجيه/components/AdminManagersView.tsx`
- التحقق:
  - تم فحص lint بدون أخطاء.
  - تم بناء لوحة التحكم (`npm run build`) بنجاح.

### 2026-03-24 - Replace Alerts with Success Modal

- تم إلغاء أي `alert` بعد:
  - إضافة مسؤول جديد.
  - تحديث كلمة مرور الأدمن الحالي.
  - تحديث كلمة مرور أي مسؤول آخر.
- تم استبدالها بمودال نجاح في منتصف الصفحة برسالة واضحة:
  - "تم إضافة المسؤول بنجاح"
  - "تم تحديث كلمة المرور بنجاح"
- الملف المعدل:
  - `لوحه التحكم الخارجيه/components/AdminManagersView.tsx`
- التحقق:
  - lint بدون أخطاء.
  - `npm run build` نجح.

### 2026-03-24 - Main App Auth on Backend (Separate Users Table)

- تم ربط تسجيل الدخول وإنشاء الحساب للموقع الأساسي بـ Laravel API مباشرة.
- تم التأكيد على الفصل بين الجداول:
  - المسؤولين: `admin_users`
  - مستخدمي الموقع الأساسي: `users`
- تم إنشاء API Auth للمستخدمين (الموقع الأساسي):
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- الملفات المضافة/المعدلة في الباك‑إند:
  - `backend/app/Http/Controllers/Api/UserAuthController.php`
  - `backend/routes/api.php`
  - `backend/app/Models/User.php`
  - `backend/database/migrations/2026_03_24_134525_add_profile_fields_to_users_table.php`
- تمت إضافة حقول توسعة مستقبلية في جدول `users`:
  - `plan`, `target_language`, `avatar`, `age`, `gender`, `start_level`
- تم تشغيل migration بنجاح.

### 2026-03-24 - Main Frontend Auth Service Wiring

- تم تحويل `authService` في الموقع الأساسي لاستخدام الـ Backend بدلاً من Firebase:
  - `موقع اتعلم بل العربي/services/authService.ts`
- تم تخزين توكن المستخدم في:
  - `hcard_user_token` + `auth_token`
- تم تحديث API client بالمسار:
  - `AuthAPI.me()`
  - وتحديث `adminLogin` إلى `/admin/auth/login`
  - في: `موقع اتعلم بل العربي/services/apiClient.ts`
- تم اختبار endpoints (register/login/me) بنجاح عبر PowerShell.
- تم بناء الموقع الأساسي (`npm run build`) بنجاح.

### 2026-03-24 - Onboarding Name Fix

- تم إصلاح ظهور اسم افتراضي "User" في شاشة الترحيب بعد التسجيل.
- السبب كان اعتماد الشاشة على قيمة `userName` المخزنة محليًا قبل مزامنة بيانات الحساب.
- التعديل تم في:
  - `موقع اتعلم بل العربي/App.tsx`
- الإصلاح:
  - مزامنة `userName` تلقائيًا من `currentUser.name` بعد تسجيل الدخول.
  - شاشة الترحيب أصبحت تستخدم `currentUser.name` كأولوية.
- النتيجة:
  - يظهر اسم حساب المستخدم الحقيقي في رسالة "أهلاً بك يا ...".

### 2026-03-24 - Hide Admin Button for Normal Users

- تم إخفاء زر "لوحة المسؤول" من واجهة المستخدم الأساسية بالكامل.
- تم إزالة الوصول إلى لوحة المسؤول من:
  - القائمة الجانبية (`Sidebar`)
  - صفحة الدعم داخل الإعدادات (`SettingsView`)
- الملفات المعدلة:
  - `موقع اتعلم بل العربي/components/Sidebar.tsx`
  - `موقع اتعلم بل العربي/components/SettingsView.tsx`
- التحقق:
  - lint بدون أخطاء.
  - `npm run build` للموقع الأساسي نجح.

### 2026-03-24 - Fix Admin List Disappearing on Reset Action

- تم إصلاح مشكلة اختفاء بعض المسؤولين عند الضغط على "تعديل/استرجاع الباسورد".
- السبب كان مرتبط بأسلوب التعديل inline داخل الصف.
- الحل:
  - إلغاء تعديل الباسورد inline داخل جدول المسؤولين.
  - نقل إدخال كلمة المرور الجديدة إلى مودال التأكيد نفسه.
  - زر "تعديل/استرجاع الباسورد" الآن يفتح المودال مباشرة بدون تغيير شكل/عدد الصفوف.
- الملف المعدل:
  - `لوحه التحكم الخارجيه/components/AdminManagersView.tsx`
- التحقق:
  - lint بدون أخطاء.
  - build للوحة التحكم نجح.

### 2026-03-24 - Enable Google/Facebook Social Signup (Main App)

- تم تفعيل تسجيل المستخدم في الموقع الأساسي عبر:
  - Google
  - Facebook
- السلوك المطلوب تم تنفيذه:
  - إذا كان البريد الإلكتروني موجودًا مسبقًا في جدول `users` يتم إرجاع رسالة: "هذا البريد الإلكتروني موجود بالفعل".
  - إذا لم يكن البريد موجودًا يتم إنشاء حساب جديد تلقائيًا مع إصدار token تسجيل الدخول.
- تغييرات الباك‑إند:
  - إضافة endpoint جديد: `POST /api/auth/social-register`
  - إضافة الدالة `socialRegister` داخل:
    - `backend/app/Http/Controllers/Api/UserAuthController.php`
  - تسجيل المسار الجديد داخل:
    - `backend/routes/api.php`
- تغييرات الفرونت‑إند (الموقع الأساسي):
  - إضافة `AuthAPI.socialRegister` في:
    - `موقع اتعلم بل العربي/services/apiClient.ts`
  - تفعيل `loginWithGoogle` فعليًا عبر Firebase popup + ربطه بـ Laravel social-register.
  - إضافة `loginWithFacebook` بنفس المنطق.
  - حفظ token وبيانات المستخدم في localStorage/session كما في تسجيل الدخول العادي.
  - تحديث زر Facebook في `LoginView` ليستخدم `authService.loginWithFacebook` بدل placeholder.
  - تحسين عرض رسائل الأخطاء من الباك‑إند مباشرة في واجهة الدخول.
- الملفات المعدلة:
  - `backend/app/Http/Controllers/Api/UserAuthController.php`
  - `backend/routes/api.php`
  - `موقع اتعلم بل العربي/services/apiClient.ts`
  - `موقع اتعلم بل العربي/services/authService.ts`
  - `موقع اتعلم بل العربي/components/LoginView.tsx`
- التحقق:
  - فحص routes: endpoint الجديد ظاهر في `php artisan route:list --path=auth`.
  - lint بدون أخطاء.
  - `npm run build` للموقع الأساسي نجح.

### 2026-03-24 - Fix Firebase Config Validation for Social Login

- تم استقبال خطأ من الواجهة: `Facebook غير مفعّل حالياً (Firebase غير مضبوط)`.
- السبب الفعلي: ملف `.env` للموقع الأساسي لا يحتوي أي متغيرات Firebase.
- تحسينات تم تنفيذها:
  - تقوية فحص `isFirebaseConfigValid` ليرفض كل قيم placeholder الشائعة (مثل `your_api_key` و `your-project-id`).
  - تحسين نص الخطأ في تسجيل Google/Facebook ليكون واضحًا: يجب إضافة مفاتيح Firebase ثم إعادة تشغيل المشروع.
- الملفات المعدلة:
  - `موقع اتعلم بل العربي/services/firebase.ts`
  - `موقع اتعلم بل العربي/services/authService.ts`
- التحقق:
  - lint بدون أخطاء.
  - `npm run build` للموقع الأساسي نجح.

### 2026-03-24 - Prepare Firebase Env Keys in Main App

- تم إضافة مفاتيح Firebase المطلوبة داخل:
  - `موقع اتعلم بل العربي/.env`
- المفاتيح المضافة:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
- ملاحظة:
  - القيم الحالية placeholders، ويجب استبدالها بالقيم الحقيقية من Firebase Console ثم إعادة تشغيل `npm run dev`.

### 2026-03-24 - Activate Real Users Management in Admin Panel

- تم تحويل صفحة `المستخدمين` في لوحة المسؤول من بيانات وهمية إلى بيانات حقيقية من جدول `users`.
- ما تم تفعيله فعليًا:
  - عرض عدد المستخدمين الحقيقي.
  - عرض ملخص: إجمالي المستخدمين / النشطين / المجمدين / مشتركين Pro.
  - تفعيل زر تجميد الحساب وفك التجميد لكل مستخدم.
  - تفعيل زر تفعيل/إلغاء Pro وربطه بالباك‑إند.
  - البحث والتصفية (الكل / Pro / مجاني / مجمد).
- تغييرات الباك‑إند:
  - إضافة Controller جديد:
    - `backend/app/Http/Controllers/Api/AdminAppUserController.php`
  - إضافة مسارات:
    - `GET /api/admin/users`
    - `PUT /api/admin/users/{user}/plan`
    - `PUT /api/admin/users/{user}/toggle-freeze`
  - تحديث موديل المستخدم لدعم:
    - الحقل `is_frozen`
    - casting boolean
  - إضافة migration جديدة:
    - `2026_03_24_220000_add_is_frozen_to_users_table.php`
  - تم تنفيذ migration بنجاح عبر:
    - `php artisan migrate`
- تغييرات لوحة التحكم:
  - ربط `AdminUsersView` بالكامل بالـ API الحقيقي بدل mock data.
  - إضافة دوال API جديدة في:
    - `لوحه التحكم الخارجيه/services/apiClient.ts`
- التحقق:
  - `php artisan route:list --path=admin/users` أظهر المسارات الجديدة.
  - lint بدون أخطاء.
  - build للوحة التحكم نجح.

### 2026-03-24 - Fix Missing Age/Gender in Admin Users

- تم اكتشاف السبب: العمر والجنس كانا يُحفظان محليًا فقط داخل `localStorage` بعد التسجيل، ولم يتم حفظهما في قاعدة البيانات.
- الإصلاح:
  - إضافة endpoint جديد لتحديث بيانات المستخدم بعد التسجيل:
    - `PUT /api/auth/profile`
  - إضافة `updateProfile` داخل:
    - `backend/app/Http/Controllers/Api/UserAuthController.php`
  - تسجيل المسار داخل:
    - `backend/routes/api.php`
  - إضافة `AuthAPI.updateProfile` في:
    - `موقع اتعلم بل العربي/services/apiClient.ts`
  - إضافة `authService.updateProfile` في:
    - `موقع اتعلم بل العربي/services/authService.ts`
  - تعديل `SignupView` بحيث خطوة onboarding (العمر/الجنس/المستوى) تحفظ البيانات فعليًا في الباك‑إند بدل التخزين المحلي المؤقت.
  - إزالة الاعتماد على `all_registered_users` كـ مصدر أساسي لهذه البيانات.
- التحقق:
  - `php artisan route:list --path=auth/profile` أظهر المسار الجديد.
  - lint بدون أخطاء.
  - `npm run build` للموقع الأساسي نجح.

### 2026-03-24 - Add User Password Edit in Admin User Modal

- تم تنفيذ طلب إضافة زر `تعديل` بجانب "كلمة المرور المشفرة" داخل مودال تفاصيل المستخدم في لوحة الأدمن.
- السلوك الجديد:
  - عند الضغط على `تعديل` يظهر حقل إدخال كلمة مرور جديدة.
  - المسؤول يمكنه حفظ كلمة المرور الجديدة مباشرة للمستخدم.
  - تم إضافة validation (6 أحرف على الأقل) مع رسائل نجاح/خطأ داخل نفس المودال.
- تغييرات الباك‑إند:
  - إضافة endpoint جديد:
    - `PUT /api/admin/users/{user}/password`
  - إضافة method:
    - `updatePassword` داخل `AdminAppUserController`
- تغييرات الفرونت‑إند (لوحة التحكم):
  - إضافة `AdminAPI.updateUserPassword` في `لوحه التحكم الخارجيه/services/apiClient.ts`
  - ربط زر `تعديل` وحفظ كلمة المرور داخل:
    - `لوحه التحكم الخارجيه/components/AdminUsersView.tsx`
- التحقق:
  - `php artisan route:list --path=admin/users` أظهر endpoint الجديد.
  - lint بدون أخطاء.
  - build للوحة التحكم نجح.

### 2026-03-24 - Upgrade User Account Settings (Main App)

- تم تحسين صفحة إدارة الحساب للمستخدم النهائي (الموقع الأساسي) لتعمل ببيانات حقيقية من قاعدة البيانات.
- ما تم تنفيذه:
  - عرض البيانات الأساسية كـ قراءة فقط داخل بطاقة الحساب:
    - الاسم
    - البريد الإلكتروني
    - الجنس
    - العمر
    - المستوى عند التسجيل
  - إضافة زر `تعديل` يفتح مودال مخصص لتعديل:
    - الاسم
    - السن
    - النوع
  - منع تعديل البريد الإلكتروني داخل المودال (readonly/disabled).
  - الإبقاء على رفع صورة البروفايل، وربط حفظها فعليًا بالباك‑إند.
- تغييرات الباك‑إند:
  - دعم تحديث `avatar` ضمن `PUT /api/auth/profile`:
    - `backend/app/Http/Controllers/Api/UserAuthController.php`
- تغييرات الفرونت‑إند:
  - تحديث `authService.updateProfile` لإرسال `avatar`.
  - تحديث `App.tsx` لتمرير الجنس/العمر/المستوى لصفحة الإعدادات وربط الحفظ مع API الحقيقي.
  - تعديل `SettingsView.tsx`:
    - تحويل عرض البيانات إلى read-only
    - إضافة مودال التعديل
    - تعطيل تعديل الإيميل
    - حفظ الاسم/العمر/النوع/الصورة عبر API
- التحقق:
  - lint بدون أخطاء.
  - `npm run build` للموقع الأساسي نجح.
  - `php artisan route:list --path=auth/profile` يؤكد endpoint.

### 2026-03-24 - إصلاح حفظ صورة المستخدم (Avatar) وعرضها في كل الواجهة

- **المشكلة**: صورة البروفايل (Base64) لا تُحفظ بشكل صحيح أو لا تظهر في الشريط الجانبي وباقي الشاشات.
- **أسباب تقنية**:
  - عمود `avatar` في MySQL كان `VARCHAR(255)` بينما سلسلة Base64 أطول بكثير.
  - اختيار صورة من الكاميرا كان يحدّث الواجهة محليًا فقط دون استدعاء API إلا من مودال «حفظ».
  - `userImage` في `App.tsx` لم يكن يُحدَّث دائمًا من `currentUser.avatar` القادم من السيرفر.
- **ما تم تنفيذه**:
  - ترحيل Laravel: `2026_03_24_230000_change_users_avatar_to_longtext.php` — تحويل `users.avatar` إلى **`LONGTEXT`**.
  - `SettingsView.tsx`:
    - ضغط الصورة ورفعها ثم **حفظ تلقائي** عبر `onProfileUpdate` بعد الاختيار.
    - إرجاع `{ success, error? }` من `onProfileUpdate`؛ عند الفشل استرجاع الصورة السابقة.
    - ثابت `DEFAULT_AVATAR_URL` (Dicebear) حتى لا يُرسل placeholder كبيانات للسيرفر عن طريق الخطأ عند «حفظ» من المودال فقط.
    - زر الكاميرا `type="button"`.
  - `App.tsx`:
    - `useEffect` لمزامنة `userImage` مع `currentUser.id` و `currentUser.avatar`.
    - معالج `onProfileUpdate` يعيد `{ success: true/false }` للمكوّن الفرعي.
- التحقق:
  - `php artisan migrate` نجح.
  - `npm run build` للموقع الأساسي نجح.

### 2026-03-24 - بانر الترقية في الرئيسية مقابل حالة اشتراك Pro (تفعيل من المسؤول)

- **الطلب**: عند تفعيل **برو** من لوحة المسؤول يختفي بانر «50 جنيه / ترقية» ويُستبدل بشريط يوضح أن المستخدم مشترك في **برو** مع **مدة شهر** من تاريخ التفعيل حتى تاريخ الانتهاء.
- **الباك‑إند**:
  - ترحيل: `2026_03_24_240000_add_plan_subscription_dates_to_users_table.php`:
    - `plan_subscribed_at` (nullable timestamp)
    - `plan_expires_at` (nullable timestamp)
  - `User`: إضافة الحقلين إلى `$fillable` و`casts` كـ `datetime`.
  - `AdminAppUserController::updatePlan`:
    - عند `pro` أو `enterprise`: تعيين `plan_subscribed_at = now` و `plan_expires_at = now()->addMonth()`.
    - عند `free`: تصفير التاريخين.
  - إرجاع `planSubscribedAt` / `planExpiresAt` في قائمة المستخدمين وبعد تحديث الخطة.
  - `UserAuthController::mapUser`: إضافة `planSubscribedAt` و `planExpiresAt` (ISO) لجميع استجابات المستخدم.
- **الفرونت‑إند (الموقع الأساسي)**:
  - `types.ts`: حقول اختيارية على `User` للتواريخ.
  - `HomeView.tsx`:
    - props: `subscriptionPlan`, `planSubscribedAt`, `planExpiresAt`, `onSyncProfileFromServer`.
    - إن كان الاشتراك **نشطًا** (برو/Enterprise وليس منتهيًا بتاريخ): شريط أخضر مع نص الاشتراك و«من … إلى …» بالتقويم العربي.
    - خلاف ذلك: نفس بانر الترقية السابق (مع إغلاق يدوي).
  - `App.tsx`:
    - `syncUserFromServer` عبر `AuthAPI.me` لتحديث `currentUser` والاسم/الصورة.
    - استدعاء المزامنة من `HomeView` عند الفتح.
    - `visibilitychange`: مزامنة عند العودة للتبويب لرؤية تفعيل المسؤول دون إعادة تحميل كامل.
- التحقق:
  - `php artisan migrate` نجح.
  - `npm run build` نجح.

### 2026-03-24 - شارة «برو» الذهبية بجانب الاسم (الصفحة الرئيسية + الإعدادات)

- **الطلب**: إظهار علامة اشتراك **برو** (تاج ذهبي + نص «برو») بجانب اسم المستخدم في **البانر العلوي** للرئيسية كما في صفحة **الإعدادات** عند كون الاشتراك **نشطًا** (برو/Enterprise ولم تنتهِ فترة `plan_expires_at`).
- **`components/home/HomeBanner.tsx`**:
  - إضافة prop اختياري `isProSubscriber`.
  - في **الوضع العادي** و**وضع المناسبات**: شارة بتدرج ذهبي (`amber`/`yellow`) مع أيقونة `Crown` و«برو» بجانب الاسم.
- **`App.tsx`**:
  - حساب موحّد `hasActiveSubscription` عبر **`useMemo`** من `currentUser.plan` و `currentUser.planExpiresAt` (نفس قواعد الشريط الأخضر تحت البانر).
  - تمرير `isProSubscriber={hasActiveSubscription}` إلى **`HomeView`** و **`SettingsView`**.
- **`HomeView.tsx`**:
  - إضافة prop `isProSubscriber`؛ الاعتماد عليه لـ `hasActiveSubscription` داخل الشاشة (البانر الفرعي للترقية/حالة Pro) ولربط `HomeBanner` دون تكرار منطق التواريخ.
- **`SettingsView.tsx`**:
  - إضافة prop `isProSubscriber`.
  - شارة برو بجانب الاسم في **بطاقة البروفايل** وفي خانة **الاسم (قراءة فقط)** ضمن إدارة الحساب.
- التحقق:
  - lint بدون أخطاء.
  - `npm run build` للموقع الأساسي نجح.

### 2026-03-24 - صفحة الإعدادات ← تبويب الاشتراك: رسالة لمشتركي برو

- **الطلب**: في **الاشتراك**، إذا كان المستخدم مشتركًا في **برو** (أو Enterprise نشط)، عدم عرض بطاقات الأسعار ورسالة «قيد التحديث»؛ واستبدالها بنص **أنت مشترك بالفعل في باقة البرو** (أو Enterprise).
- **`SettingsView.tsx`**:
  - إصلاح بلوك «قيد التحديث» ليطابق **`notifications` فقط** (كان يُعرض بالخطأ فوق محتوى **الاشتراك**).
  - عند `isProSubscriber`: بطاقة بتاج ذهبي، العنوان المناسب، نص شكر، وعرض **فترة الاشتراك** عند توفر التواريخ، وزر **الانتقال للرئيسية**.
  - غير المشتركين: الإبقاء على واجهة الباقات والدفع.
- **`App.tsx`**: تمرير `subscriptionPlan` و `planSubscribedAt` و `planExpiresAt` إلى `SettingsView`.
- التحقق: `npm run build` نجح.

### 2026-03-24 - إخفاء شارة «عضو مميز» لغير المشتركين في برو

- في **إدارة الحساب** (`SettingsView`)، شارة **عضو مميز** (التاج الأصفر) تُعرض فقط عندما `isProSubscriber === true`؛ غير المشتركين لا يرونها. شارة **حساب موثق** تبقى كما هي.

### 2026-03-24 - إصلاح مستوى الـ XP ومعدل النجاح للحسابات الجديدة (واجهة فقط)

- **المشكلة**: لوحة التحكم أظهرت لحساب جديد **مستوى 3** و**~632 XP** و**67% نجاح** دون أي نشاط.
- **السبب**: في `App.tsx` كانت `streak` و`successRate` **ثابتتين** (`1` و`67`)، وصيغة الـ XP كانت تضرب `successRate × 10` وتضيف XP لمجموع البطاقات بلا تمييز، فيُحسب مستوى مرتفع من بيانات وهمية.
- **الحل (الفرونت‑إند)** — التقدم والـ XP لا يزالان مُخزَّنين محليًا (`useAppData` / `db`) وليسا في Laravel حتى الآن:
  - **`computeReviewStreak`**: سلسلة الأيام من `reviewLog` فقط (بدون نشاط → **0**).
  - **`computeSuccessRate`**: من متوسط اختبارات القصص إن وُجدت، وإلا من `lastGrade` على البطاقات التي لها مراجعات؛ بدون بيانات → **0%**.
  - **الـ XP والمستوى**: من مراجعات البطاقات، البطاقات المُتقنة، القصص والدروس المكتملة، والاختبارات فقط — **0 XP** يعطي **المستوى 1** و**0%** تقدم منطقي.
- التحقق: `npm run build` نجح.

### 2026-03-24 - إعدادات الحساب ← منطقة الخطر: مودالات تأكيد + حذف الحساب من API

- **الطلب**: أزرار **تسجيل الخروج** و**حذف الحساب** في منطقة الخطر كانت بلا `onClick`؛ المطلوب نفس أسلوب تأكيد **تسجيل الخروج** من الشريط الجانبي (خلفية blur، إلغاء / تأكيد)، مع تنفيذ حذف الحساب على الخادم.
- **الباك‑إند**:
  - `UserAuthController::deleteAccount`: داخل `DB::transaction` حذف رموز Sanctum (`$user->tokens()->delete()`) ثم `$user->delete()`.
  - `routes/api.php`: `DELETE /api/auth/account` ضمن `auth:sanctum`.
- **الفرونت‑إند**:
  - `apiClient.ts`: `AuthAPI.deleteAccount`.
  - `authService.ts`: `deleteAccount()` يستدعي الـ API ثم يمسح التوكن و`auth_session` محليًا.
  - `SettingsView.tsx`: حالة `dangerModal` (`'logout' | 'delete' | null`)، مودال واحد بأسلوب قريب من `Sidebar`، زر حذف مع حالة تحميل.
  - `App.tsx`: `onLogout={handleLogout}` و`onDeleteAccount` يستدعي `authService.deleteAccount()` ثم `handleLogout()` عند النجاح، و`setToast` عند الفشل.
- التحقق: `npm run build` للموقع الأساسي نجح.

### 2026-03-24 - التواصل المباشر (المستخدم) ↔ دعم المسؤول: تذاكر موحّدة عبر Laravel

- **الطلب**: ربط بطاقة **التواصل المباشر** في إعدادات المستخدم بصفحة **رسائل الدعم** في لوحة المسؤول، مع تخزين حقيقي في الباك‑إند بدل `localStorage` المنفصل لكل طرف.
- **الباك‑إند**:
  - ترحيل موجود مفعّل: `support_tickets` (uuid، `user_id`، `subject`، `status`، `priority`) و`support_ticket_messages` (`sender`: `user` | `admin`، `text`).
  - نموذج `SupportTicketMessage` + `SupportTicketJson` لتوحيد شكل الـ JSON مع الفرونت (`userId`، `userName`، `messages[].id`، `timestamp` ISO).
  - **`UserSupportTicketController`** (Sanctum — مستخدم التطبيق فقط):
    - `GET /api/support/tickets`
    - `POST /api/support/tickets` — `{ subject, message }`
    - `POST /api/support/tickets/{ticket}/messages` — `{ text }`
  - **`AdminSupportTicketController`** (Sanctum — `AdminUser` فقط):
    - `GET /api/admin/support/tickets`
    - `PUT /api/admin/support/tickets/{ticket}` — `{ status }` (`open` | `in_progress` | `resolved`)
    - `POST /api/admin/support/tickets/{ticket}/messages` — `{ text }`
  - تسجيل المسارات في `routes/api.php`.
- **الموقع الأساسي**:
  - `SupportModal.tsx`: استبدال `SupportService` المحلي بـ `SupportAPI`؛ تحميل القائمة، إنشاء تذكرة، رد المستخدم مع حالات تحميل/خطأ.
  - `hooks/useAppData.ts`: إزالة تهيئة/حفظ التذاكر في `db` للموقع الرئيسي (التذاكر من الـ API داخل المودال).
  - `App.tsx`: إزالة استيراد `INITIAL_TICKETS` غير المستخدم.
  - `services/apiClient.ts`: `AdminAPI.addTicketMessage` (للاتساق مع لوحة التحكم إن لزم).
- **لوحة التحكم الخارجية**:
  - `hooks/useAppData.ts`: جلب التذاكر بـ `AdminAPI.getAllTickets()` عند وجود `hcard_admin_token`.
  - `App.tsx`: بعد `handleAdminLoginSuccess` إعادة جلب التذاكر من الـ API.
  - `components/admin/SupportTab.tsx`: ربط الرد وتحديث الحالة و`addTicketMessage` بالـ API؛ زر تحديث يدوي من الخادم.
  - `services/apiClient.ts`: `addTicketMessage` + توثيق أنواع `updateTicketStatus`.
- التحقق: `php artisan migrate` (جدول التذاكر)، `npm run build` للموقع الأساسي وللوحة التحكم نجحا.

### 2026-03-24 - إشعار المستخدم عند رد المسؤول على تذكرة الدعم (درج الإشعارات)

- **الطلب**: عندما يرد فريق الدعم من لوحة المسؤول، يظهر للمستخدم إشعار في **الإشعارات** (مثل: رد الدعم على تذكرتك «…») مع إمكانية المزامنة من الخادم.
- **الباك‑إند**:
  - ترحيل: `2026_03_24_310000_create_user_notifications_table.php` — جدول **`user_notifications`** (`user_id`، `kind` افتراضيًا `support_reply`، `title`، `body`، `ticket_id` uuid اختياري، `read_at`).
  - نموذج **`UserNotification`** مع UUID تلقائي.
  - **`UserNotificationController`** (Sanctum — مستخدم التطبيق):
    - `GET /api/auth/notifications` — قائمة حديثة (حد أقصى ~80).
    - `PUT /api/auth/notifications/read` — `{ ids: string[] }` لتحديث `read_at`.
  - **`AdminSupportTicketController::addMessage`**: بعد إنشاء رسالة `admin` في `support_ticket_messages`، إنشاء **`UserNotification`** للمستخدم صاحب التذكرة (عنوان «رد من فريق الدعم» ونص يذكر موضوع التذكرة ويوجّه إلى الإعدادات ← الدعم ← التواصل المباشر).
  - تسجيل المسارين تحت مجموعة `auth` + `auth:sanctum` في `routes/api.php`.
- **الموقع الأساسي**:
  - `types.ts`: حقل اختياري **`ticketId`** على `AppNotification`.
  - `apiClient.ts`: **`AuthAPI.getNotifications`** و **`AuthAPI.markNotificationsRead`**.
  - `App.tsx`:
    - **`syncServerNotifications`**: جلب الإشعارات ودمجها مع المحلية بمعرفات **`srv_{uuid}`**؛ Toast عند ظهور إشعار دعم جديد غير مقروء بعد أول مزامنة ناجحة.
    - مزامنة عند الدخول، كل **90 ثانية**، ومع **`visibilitychange`** (مع `syncUserFromServer`).
    - **`handleSetNotificationsForDrawer`**: عند التحديد كمقروء يستدعي الـ API؛ عند حذف/مسح إشعار `srv_` يُسجَّل في **`localStorage`** (`dismissed_srv_notifs_{userId}`) لعدم إعادته.
    - **`NotificationDrawer`**: يمرّر `setNotifications` عبر المعالج أعلاه بدل الحفظ المباشر لكل المصفوفة في `db`.
  - `hooks/useAppData.ts`: عند حفظ **`notifications`** في التخزين المحلي يُستبعد أي عنصر يبدأ معرفه بـ **`srv_`** حتى لا تُخزَّن نسخة قديمة من إشعارات الخادم.
- التحقق: `php artisan migrate` (جدول `user_notifications`)، `npm run build` للموقع الأساسي نجح.

### 2026-03-25 - سجل مشاكل مُغلَقة: إشعارات المسؤول، خطأ 500 عند رسالة المستخدم، واجهة الإشعارات، والانتقال من الدعم إلى «المستخدمين»

| المشكلة | السبب الجذري (باختصار) | الحل |
|--------|-------------------------|------|
| إشعارات المستخدم في **الإعدادات ← الإشعارات** لا تعرض وارد الدعم | كان القسم placeholder | استبداله بقائمة حقيقية مربوطة بـ `GET/PUT /api/auth/notifications` مع تحديث، مقروء، حذف، وربط تذكرة الدعم (`SettingsView.tsx` + تمرير من `App.tsx`). |
| المسؤول لا يستقبل إشعارًا عند شكوى/رسالة مستخدم | لا يوجد جدول/مسار إشعارات للمسؤول | جدول `admin_notifications`، `AdminSupportNotifier` عند `UserSupportTicketController::store` و`addMessage`، `AdminNotificationController` + مسارات `GET/PUT` تحت `/api/admin/notifications`، وواجهة في لوحة التحكم (`useAdminSupportNotifications`، جرس، قسم في `NotificationsTab`). |
| جرس الإشعارات في لوحة التحكم في مكان بعيد عن الهوية | كان `fixed` أعلى الصفحة | نقل عرض الجرس إلى **`AdminSidebar`** بجانب لوجو «اتعلم بالعربي» (`notificationsBell` + `stopPropagation` على الجرس). |
| القائمة المنبثقة للجرس تغطي عناصر السايدبار | موضع `absolute left-0` غير مناسب لـ RTL | تعديل إلى `start-0` + `-translate-x-3` و`origin-top-start` في `AdminSupportNotificationBell.tsx`. |
| **500** عند إرسال رسالة دعم من المستخدم | جدول `admin_notifications` قديم في MySQL **بدون** عمود `admin_user_id` (أو بلا الجدول) بينما `AdminSupportNotifier` يُدرج هذه الأعمدة | هجرة **`2026_03_25_000001_fix_admin_notifications_schema`**: إضافة الأعمدة، تعبئة `admin_user_id`، تعديل `ticket_id` قابلاً للـ NULL، محاولة FK؛ جعل **`2026_03_24_320000`** لا يُعيد إنشاء الجدول إن وُجد؛ `AdminSupportNotifier` ملفوف بـ `try/catch` + `report($e)` حتى لا تقطع العملية الرئيسية عطل ثانوي. |
| المسؤول يريد فتح **ملف المستخدم** من التذكرة مباشرة | لا يوجد اختصار من `SupportTab` | `SupportTab`: ضغط على صف المستخدم في القائمة أو على الاسم في التفاصيل يستدعي `onOpenUserInUsersTab(userId)`؛ `AdminDashboard` يضبط `usersFocusAppUserId` ويفتح تبويب **المستخدمين**؛ `AdminUsersView` عند `focusAppUserId` يعيد الجلب ويفتح `UserDetailsModal` للمطابقة. |

### 2026-03-25 - إشعارات التسويق من المسؤول للمستخدمين (Backend)

- **الطلب**: عند إنشاء إشعار من `لوحة التحكم الخارجية` (تبويب `NotificationsTab`) يتم حفظه في سجل الإشعارات (History) في الـ Back-end، وبعدها يصل للمستخدم داخل صفحة/جزء الإشعارات.
- **الباك‑إند**:
  - جدول سجل الإشعارات: `broadcast_notifications`.
  - كونترولر مسؤول: `AdminBroadcastNotificationController`.
  - تخزين الإشعار + توليد إشعارات للمستخدمين عبر `user_notifications` (kind = `broadcast`) بناءً على `targetAudience` (`all|active|inactive`).
  - مسارات:
    - `GET /api/admin/broadcasts`
    - `POST /api/admin/broadcasts`
    - `DELETE /api/admin/broadcasts/{broadcast}`
- **الفرونت‑إند (لوحة التحكم)**:
  - `components/admin/NotificationsTab.tsx`: استبدال الـ mock بتحميل/إرسال/حذف من الـ API (`AdminAPI.getAllBroadcasts`, `createBroadcast`, `deleteBroadcast`) لتحديث سجل الإشعارات فعليًا.
  - `services/apiClient.ts`: إضافة `getAllBroadcasts`.
- **الفرونت‑إند (المستخدم)**:
  - `App.tsx`: ما دام إشعار المستخدم يُخزن داخل `user_notifications`، فـ `syncServerNotifications` سيجلبه تلقائيًا ويعرضه في جزء الإشعارات (إعدادات/الجرس).
  - تحسين `toast` عند وصول إشعار جديد: إذا كان الإشعار مرتبطًا بتذكرة دعم (`ticketId` موجود) يظهر نص "فريق الدعم رد..."، بينما إشعارات البث/النظام (بدون `ticketId`) يظهر فيها نص "لديك إشعار جديد من المسئول أو النظام".

- **ملفات بارزة**: `backend/app/Support/AdminSupportNotifier.php`، `backend/app/Http/Controllers/Api/AdminNotificationController.php`، `backend/database/migrations/2026_03_25_000001_fix_admin_notifications_schema.php`، `backend/app/Http/Controllers/Api/AdminBroadcastNotificationController.php`، `backend/app/Models/BroadcastNotification.php`، `backend/database/migrations/2026_03_25_010000_create_broadcast_notifications_table.php`، `لوحه التحكم الخارجيه/components/admin/NotificationsTab.tsx`، `لوحه التحكم الخارجيه/services/apiClient.ts`، `AdminUsersView.tsx`، `AdminDashboard.tsx`، `AdminSidebar.tsx`، `AdminSupportNotificationBell.tsx`.
- **تشغيل بعد السحب على بيئة جديدة**: `php artisan migrate` لضمان توافق جدول `admin_notifications` مع الكود.
- التحقق: `npm run build` للموقع الأساسي وللوحة التحكم نجح بعد التعديلات الواجهية.

### 2026-03-25 - التسويق والعروض والكوبون (Backend + ربط الواجهة)

- إنشاء جداول `marketing_coupons` و`marketing_banners` و`payment_sessions`.
- إضافة Endpoints:
  - `GET /api/marketing/coupons`
  - `GET /api/marketing/banners`
  - `POST /api/payments/verify-coupon`
  - `POST /api/payments/create-session`
  - Admin CRUD تحت `api/admin/coupons` و`api/admin/banners`.
- ربط الواجهة:
  - `App.tsx` لقراءة العروض/الكوبونات من الـ API بدل الـ mock.
  - `SettingsView.tsx` لعرض الإعلان داخل قسم الاشتراك + إدخال الكوبون قبل الدفع وتعديل السعر بعد الخصم.
  - `لوحه التحكم الخارجيه/components/admin/MarketingTab.tsx` لتخزين الكوبونات/الإعلانات في الـ backend بدل localStorage فقط.

### 2026-03-25 - مودال حذف إشعارات السجل (للمستخدم)

- **الطلب**: عند الضغط على `حذف` داخل سجل الإشعارات يظهر مودال “انت فعلا عايز تمسحو؟” مع اختيار `مسح عندي فقط` أو `مسح من عند كل الطلاب`.
- **الفرونت‑إند**:
  - `components/SettingsView.tsx`: إضافة مودال الحذف + خيار المسح للجميع (مفعل فقط عند وجود صلاحية مسؤول + وجود `broadcastId`).
  - `components/NotificationsView.tsx`: نفس مودال الحذف داخل صفحة الإشعارات (للتناسق).
- **الباك‑إند**:
  - هجرة `2026_03_25_020000_add_broadcast_id_to_user_notifications` لإضافة `broadcast_id` في `user_notifications`.
  - `UserNotificationController`: إرجاع `broadcastId` للواجهة.
  - `AdminBroadcastNotificationController`: عند حذف broadcast يتم حذف `user_notifications` المرتبطة (`broadcast_id` أو title/body كحل رجوع للبيانات القديمة).

### 2026-03-29 - المنهج الدراسي (Curriculum): باك‑إند كامل، فلترة EN/DE/كلاهما، ومودال تأكيد الحذف

#### الطلب

- ربط صفحة **إدارة المنهج** في لوحة التحكم بالخادم؛ اختيار **اللغة** بجانب المستوى الفرعي عند إضافة وحدة؛ حفظ تلقائي حسب اختيار **وجهة اللغة** (إنجليزي / ألماني / كلاهما)؛ زرع الوحدات والدروس الأولية (EN + DE)؛ عرض المنهج حسب اللغة المختارة فقط؛ استبدال `window.confirm` عند الحذف بمودال تأكيد.

#### الباك‑إند

- هجرة `2026_03_26_020000_create_curriculum_modules_table.php`: جدول **`curriculum_modules`** (`id` UUID، `lang` en|de، `title`، `level`، `sub_level`، `lessons` JSON، `is_active`، timestamps) مع فهرس قصير الاسم لتجنب حد MySQL لطول اسم المعرف.
- موديل `backend/app/Models/CurriculumModule.php`.
- `CurriculumController` (عام):
  - `GET /api/content/{lang}/curriculum`
  - `GET /api/content/{lang}/curriculum/{module}`
- `AdminCurriculumController` (Sanctum + `AdminUser`): `index`، `store`، `update`، `destroy` تحت `/api/admin/content/{lang}/curriculum` و`/.../curriculum/{module}`.
- سيدر `SeedInitialCurriculumSeeder.php`: يزرع نفس محتوى `INITIAL_CURRICULUM_EN` و`INITIAL_CURRICULUM_DE` من الواجهة (وحدات A1/A2 مع دروس تجريبية).
- تسجيل المسارات في `backend/routes/api.php`.

#### لوحة التحكم (Admin)

- `services/apiClient.ts`: `AdminAPI.getCurriculum(lang)` بالإضافة لـ create/update/delete الموجودة.
- `hooks/useAppData.ts`: عند وجود `hcard_admin_token` جلب المنهج لـ **en و de** معًا، حفظهما في `db`، وتحديث الحالة حسب `learningLang`.
- `AdminDashboard.tsx`: تمرير `learningLang` و`adminLang` إلى `CurriculumTab`.
- `components/admin/CurriculumTab.tsx`:
  - حقل **اللغة** بجانب المستوى الفرعي؛ عند اختيار وجهة لغة واحدة يُقفل الاختيار ويُحفظ في تلك اللغة؛ عند **كلاهما** يمكن اختيار EN أو DE أو الاثنين معًا؛ العمليات تُرسل للـ API ثم إعادة تحميل القائمتين.
  - فلترة العرض: **`visibleCurriculum`** — EN فقط / DE فقط / الاثنين حسب `adminLang`.
  - حذف وحدة أو درس: استبدال `window.confirm` بـ **`ConfirmModal`** (`components/ConfirmModal.tsx`).

#### الموقع الأساسي (المستخدم)

- `App.tsx`: `useEffect` يستدعي `CurriculumAPI.getAll(lang)` حسب لغة التعلم (`en`/`de` من `learningLang`) ويحدّث `curriculum`.

#### تشغيل بعد السحب

- `php artisan migrate` (جدول `curriculum_modules`).
- `php artisan db:seed --class=SeedInitialCurriculumSeeder --force` (إن لزم تعبئة البيانات الأولية).

#### ملفات بارزة

- `backend/database/migrations/2026_03_26_020000_create_curriculum_modules_table.php`
- `backend/app/Models/CurriculumModule.php`
- `backend/app/Http/Controllers/Api/CurriculumController.php`
- `backend/app/Http/Controllers/Api/AdminCurriculumController.php`
- `backend/database/seeders/SeedInitialCurriculumSeeder.php`
- `لوحه التحكم الخارجيه/components/admin/CurriculumTab.tsx`
- `لوحه التحكم الخارجيه/components/ConfirmModal.tsx`
- `موقع اتعلم بل العربي/App.tsx`

### 2026-03-29 - الموقع الأساسي: مسار التعلّم من المنهج (API) + تطبيع المحتوى + مبدّل لغة التعلّم من الشريط (بدون إعادة تسجيل دخول)

#### الطلب

- صفحة **مسار التعلّم** تُغذّى من **منهج السيرفر** (نفس بيانات المسئول)، وليس من نسخة محلية قديمة أو بنطاق لغة خاطئ.
- زر/كرت في **الشريط الجانبي فوق «خيارات إضافية»** للتبديل بين **تعلّم الإنجليزي** و**تعلّم الألماني** فورًا، مع تحديث الحساب على الخادم، دون الحاجة لتسجيل خروج ودخول.
- لكل لغة: منهج، قصص، بطاقات، دروس مكتملة، ومسار/تقدّم منفصل في التخزين المحلي (`en_*` / `de_*`).

#### التطبيع والبيانات

- **`hooks/useAppData.ts`**: `learningLang` أصبح صراحةً **`'en' | 'de'`** — إذا كان `target_language` في الحساب **`ar`** أو أي قيمة غير `de`، يُعامل المحتوى كـ **إنجليزي** لتفادي مفاتيح تخزين مثل `ar_curriculum` تختلف عن جلب الـ API.
- **`utils/curriculumUtils.ts`**: الدالة **`normalizeCurriculumModules`** لتحويل استجابة `GET /api/content/{lang}/curriculum` إلى شكل `Module` / `Lesson` في الواجهة (بما في ذلك `subLevel` / `sub_level`).
- **`App.tsx`**: بعد جلب المنهج يُستدعى **`normalizeCurriculumModules`** قبل `setCurriculum`؛ جلب القصص والمنهج يبقى مرتبطًا بـ `learningLang`.

#### تبديل لغة التعلّم (واجهة + API)

- **`App.tsx`**:
  - حالة **`isSwitchingLearningLang`** لتعطيل الأزرار أثناء الحفظ.
  - **`handleLearningLanguageChange`**: يستدعي **`authService.updateProfile({ targetLanguage: 'en' | 'de' })`** (مسار **`PUT /api/auth/profile`**)، ثم **`setCurrentUser(res.user)`**؛ Toast نجاح/خطأ.
- عند تغيّر `targetLanguage` في المستخدم، يعيد **`useAppData`** تحميل البيانات المحددة باللغة من **`db`**، وتُعاد جلب القصص/المنهج من الـ API تلقائيًا حسب `learningLang`.

#### الشريط الجانبي

- **`components/Sidebar.tsx`**: كرت **«لغة التعلم»** (أزرار **EN** / **DE**) فوق زر **«خيارات إضافية»**؛ خصائص اختيارية: `learningLang`، `onLearningLanguageChange`، `isSwitchingLearningLang`.

#### ملفات بارزة

- `موقع اتعلم بل العربي/hooks/useAppData.ts`
- `موقع اتعلم بل العربي/utils/curriculumUtils.ts`
- `موقع اتعلم بل العربي/App.tsx`
- `موقع اتعلم بل العربي/components/Sidebar.tsx`
- `موقع اتعلم بل العربي/services/authService.ts` (`updateProfile`)

### 2026-03-29 — لوحة التحكم (مكمّل): بروكسي Vite، رفع الوسائط على القرص، LONGTEXT، محرّر الدرس، معاينة الطالب والاختبار

#### 1) الاتصال بالـ API وتفادي CORS في التطوير

- **المشكلة**: طلبات من لوحة التحكم (`127.0.0.1:3001`) إلى Laravel (`127.0.0.1:5000`) قد تفشل بسبب CORS أو اختلاف النطاق.
- **الحل**:
  - `لوحه التحكم الخارجيه/vite.config.ts`: `server.proxy` يمرّر المسار **`/api`** إلى الهدف **`VITE_BACKEND_PROXY_URL`** (افتراضيًا `http://127.0.0.1:5000`).
  - `لوحه التحكم الخارجيه/.env` / `.env.example`: **`VITE_BACKEND_API_URL=/api`** (نفس المنشأ مع البروكسي) و **`VITE_BACKEND_PROXY_URL=http://127.0.0.1:5000`**.
  - `لوحه التحكم الخارجيه/services/apiClient.ts`: في وضع التطوير الافتراضي للأساس **`/api`**؛ رسالة خطأ أوضح عند فشل الشبكة.
- **الباك‑إند**: توسيع **`backend/config/cors.php`** ليشمل **`127.0.0.1`** (ومنافذ التطوير الشائعة) بالإضافة إلى `localhost` حتى الطلبات المباشرة تعمل إن لزم.

#### 2) رفع صور/صوت/فيديو للمنهج (ملفات على الخادم — ليس Base64 في JSON)

- **المشكلة**: تضمين فيديو/صوت كـ Base64 داخل JSON الدرس يسبب حجمًا هائلاً وأخطاء **500** / حدود PHP.
- **الباك‑إند**:
  - `backend/app/Http/Controllers/Api/AdminMediaUploadController.php`: **`POST /api/admin/media/upload`** (Sanctum + `AdminUser`)، حقول **`kind`** = `image` | `video` | `audio` و **`file`**.
  - التخزين على القرص: `storage/app/public/curriculum-media/{images|videos|audio}/` مع التحقق من الحجم والامتداد.
  - الاستجابة: **`url`** كامل (يعتمد على `APP_URL`) + **`path`** نسبي.
  - تسجيل المسار في `backend/routes/api.php` داخل مجموعة `admin` + `auth:sanctum`.
  - تنفيذ **`php artisan storage:link`** لربط **`public/storage`**.
- **لوحة التحكم**:
  - `LessonEditor.tsx` و **`QuestionForm.tsx`**: رفع عبر **`FormData`** و **`AdminAPI.uploadMedia`** بدل `FileReader` / Base64.
  - `apiClient.ts`: دالة **`uploadMedia`** مع معالجة أخطاء JSON/HTTP.

#### 3) قاعدة البيانات: محتوى الدروس كـ LONGTEXT

- هجرة **`2026_03_29_030000_curriculum_modules_lessons_longtext.php`** (أو ما يعادلها): عمود **`lessons`** من نوع يناسب JSON كبير (مثل **LONGTEXT** في MySQL) لتفادي قصّ الحمولة عند حفظ دروس ثقيلة.

#### 4) محرّر الدرس (واجهة المسئول)

- **الوقت**: حقل رقمي (دقائق) فقط؛ التخزين يبقى بصيغة **`"N min"`** للتوافق مع العرض.
- **صعوبة الدرس داخل الوحدة** (وليس مستوى CEFR للوحدة): قائمة منسدلة **مبتدئ / متوسط / متقدم** (عرض «متقدم / صعب» في الخيار الثالث؛ القيمة المخزنة **`متقدم`**). دروس جديدة تبدأ افتراضيًا بـ **مبتدئ**.
- إزالة النص التوضيحي الطويل تحت «صعوبة الدرس» حسب طلب المستخدم.
- تحسين تنسيق القائمة المنسدلة بألوان الموقع؛ لاحقًا إزالة أيقونة السهم الزائدة مع الإبقاء على **`appearance-none`** لإخفاء سهم المتصفح عند الحاجة.
- **`CurriculumTab.tsx`**: شارة صغيرة بجانب مدة الدرس تعرض **صعوبة الدرس** إن وُجدت.

#### 5) معاينة حية كما يراها الطالب + اختبار تفاعلي

- **`LessonPreviewModal.tsx`** (بورتال إلى `document.body`):
  - عرض العنوان/الوصف، الفيديو/الصوت/الصورة، نص الدرس، الموارد.
  - زر **«بدء الاختبار»** عند وجود أسئلة.
  - تطبيع الأسئلة عبر **`lessonToPreviewModel`** / **`normalizePreviewQuestions`** (`id`، `type`، `text`، `options`).
- **`LessonPreviewQuiz.tsx`**: واجهة أسئلة مبنية على **`QuizView`** في الموقع الرئيسي لكن بـ **props** (`lesson`، `onClose`) بدل سياق الدرس.
- **`لوحه التحكم الخارجيه/hooks/useQuizLogic.ts`**: نسخة منطق الاختبار (نقاط النجاح، إعادة الأسئلة الخاطئة، `canvas-confetti`) للمعاينة فقط.
- **فتح المعاينة**:
  - من **`CurriculumTab`**: الضغط على **صف الدرس** أو أيقونة **العين**؛ أزرار **تعديل/حذف** تستخدم `stopPropagation`.
  - من **`LessonEditor`**: زر **«معاينة»** في الهيدر يمرّر المسودة الحالية.
- **إصلاح عرض فارغ للاختبار**: جعل حاوية المودال بارتفاع صريح (**`h-[min(92vh,920px)]`**) واستبدال تموضع **`absolute`** الذي كان يطوي الارتفاع إلى صفر بـ **`flex-1 min-h-0 flex flex-col`** لطبقة الاختبار؛ شريط الأسفل في الاختبار أصبح **`shrink-0`** بدل `position: fixed` داخل المودال.
- بعد **اجتياز** الاختبار: زر **«إنهاء المعاينة»** يغلق النافذة بالكامل عبر **`onExitPreview`**.

#### ملفات بارزة (هذا القسم)

- `لوحه التحكم الخارجيه/vite.config.ts`
- `لوحه التحكم الخارجيه/.env` / `.env.example`
- `لوحه التحكم الخارجيه/services/apiClient.ts`
- `backend/config/cors.php`
- `backend/app/Http/Controllers/Api/AdminMediaUploadController.php`
- `backend/routes/api.php`
- `backend/database/migrations/2026_03_29_030000_curriculum_modules_lessons_longtext.php` (إن وُجدت بهذا الاسم)
- `لوحه التحكم الخارجيه/components/admin/LessonEditor.tsx`
- `لوحه التحكم الخارجيه/components/admin/QuestionForm.tsx`
- `لوحه التحكم الخارجيه/components/admin/CurriculumTab.tsx`
- `لوحه التحكم الخارجيه/components/admin/LessonPreviewModal.tsx`
- `لوحه التحكم الخارجيه/components/admin/LessonPreviewQuiz.tsx`
- `لوحه التحكم الخارجيه/hooks/useQuizLogic.ts`

#### تشغيل / صيانة

- بعد تعديل **`.env`** في لوحة التحكم: **إعادة تشغيل `npm run dev`**.
- Laravel: **`php artisan serve --host=127.0.0.1 --port=5000`**؛ **`php artisan storage:link`** مرة على البيئة.
- إذا ظهر **413** أو فشل رفع ملف كبير: رفع **`upload_max_filesize`** و **`post_max_size`** في `php.ini`.

### 2026-03-29 — المواقف الحياتية (مواضيع الجمل): متعلم، مسئول، وباك‑إند

#### 1) تحديث القائمة عند المستخدم دون ريفرش يدوي

- **المشكلة**: بعد إضافة موضوع جمل من لوحة المسئول، المتعلّم لا يرى التحديث إلا بعد تحديث الصفحة يدويًا.
- **الحل في `موقع اتعلم بل العربي/App.tsx`**:
  - الإبقاء على جلب **`SentencesAPI.getAll(learningLang)`** مع **`CurriculumAPI.getAll`** عند **`document.visibilitychange`** عندما يصبح التبويب **`visible`**.
  - إضافة **`window.addEventListener('focus', …)`** لإعادة جلب **مواضيع الجمل** عند التركيز على النافذة (مفيد عند التبديل بين نافذة الموقع ولوحة المسئول على منفذين مختلفين).

#### 2) الصور / الفيديو / الصوت في تفاصيل الموضوع (`SentenceTopicDetail`)

- **`موقع اتعلم بل العربي/utils/resolveMediaUrl.ts`**: تحويل مسارات نسبية مثل **`/storage/...`** إلى رابط كامل اعتمادًا على **`VITE_BACKEND_API_URL`** (بإزالة لاحقة **`/api`** لاشتقاق أصل الملفات الثابتة).
- **`components/sentences/SentenceTopicDetail.tsx`**:
  - استخدام **`resolveMediaUrl`** لروابط **الصورة** و**الفيديو** المباشر.
  - عند وجود **`audioUrl`** على الجملة: عنصر **`<audio controls>`** لتشغيل الملف المرفوع (بالإضافة إلى أي سلوك TTS إن وُجد).

#### 3) معاينة للمسئول بجانب التعديل

- **`لوحه التحكم الخارجيه/utils/resolveMediaUrl.ts`**: نفس منطق الوسائط للمعاينة من لوحة التحكم.
- **`لوحه التحكم الخارجيه/components/admin/SentenceTopicPreviewModal.tsx`**: مودال (بورتال) يعرض عنوان الموضوع، المستوى، وسائط مبسطة، جمل مع **`<audio>`** عند وجود رابط، وملاحظات.
- **`AdminSentencesView.tsx`**: زر **معاينة** (أيقونة عين) بجانب **تعديل** يفتح المودال؛ حالة **`previewTopic`** / **`onClose`**.

#### 4) تصفية لغة التعلّم (EN / DE) في واجهة برمجة المواضيع العامة

- **المشكلة**: موضوع محفوظ تحت مسار إدارة **`/admin/content/en/...`** (حتى مع **`sentenceLang: both`**) كان يُخزَّن بعمود **`lang = en`**؛ طلب المتعلّم الألماني **`GET /api/content/de/sentences`** كان يفلتر بـ **`where('lang', 'de')`** فلا تظهر المواضيع.
- **الحل في `backend/app/Http/Controllers/Api/SentencesController.php`**:
  - جلب المواضيع النشطة حيث **`sentence_lang`** = **`both`** **أو** **`sentence_lang`** = لغة المسار **`{lang}`** (en/de)، بدل الاعتماد على عمود **`lang`** وحده لعرض المحتوى للمتعلّم.
- **`components/sentences/SentencesView.tsx`**: يبقى تصفية إضافية في الواجهة حسب **`learningLang`** و**`sentenceLang`** (دفاع عميق).

#### 5) أسئلة اختبار متعددة في إدارة موضوع الجمل + تطبيع JSON

- **واجهة المسئول (`AdminSentencesView.tsx`)**:
  - نمط **مسودة + قائمة** (مشابه لمحرّر الدرس): عمود **الأسئلة المضافة** (رقم، نوع، مقتطف نص، حذف)، وعمود **سؤال جديد** مع **`QuestionForm`** وزر **«إضافة السؤال إلى الاختبار»**؛ يمكن تكرار العملية لأي عدد من الأسئلة.
  - شارة **`N سؤال`** في رأس القسم وفي جدول المواضيع (عمود المحتوى).
  - عند الفتح/الحفظ/الإلغاء: إعادة ضبط مسودة السؤال؛ الحذف من القائمة **حسب الفهرس** (وليس فقط بـ `id` لتفادي حذف أكثر من سؤال عند نقص المعرّفات).
- **`لوحه التحكم الخارجيه/utils/normalizeQuizQuestions.ts`**: ضمان أن **`quizQuestions`** مصفوفة وأن كل عنصر له **`id`** (مع معرّف مستقر عند غيابه من الخادم).
- **الباك‑إند**:
  - **`AdminSentencesController.php`**: **`normalizeQuizQuestionsForStorage`**: **`array_values`** على المصفوفة قبل التخزين؛ **`mapQuizQuestionsForApi`**: إعادة فهرسة + تعبئة **`id`** عند الحاجة.
  - **`SentencesController.php`**: **`mapQuizQuestionsForApi`** لنفس منطق الإرجاع للمتعلّم.

#### ملفات بارزة (هذا القسم)

- `موقع اتعلم بل العربي/App.tsx`
- `موقع اتعلم بل العربي/utils/resolveMediaUrl.ts`
- `موقع اتعلم بل العربي/components/sentences/SentenceTopicDetail.tsx`
- `موقع اتعلم بل العربي/components/sentences/SentencesView.tsx`
- `لوحه التحكم الخارجيه/utils/resolveMediaUrl.ts`
- `لوحه التحكم الخارجيه/utils/normalizeQuizQuestions.ts`
- `لوحه التحكم الخارجيه/components/admin/SentenceTopicPreviewModal.tsx`
- `لوحه التحكم الخارجيه/components/admin/AdminSentencesView.tsx`
- `backend/app/Http/Controllers/Api/SentencesController.php`
- `backend/app/Http/Controllers/Api/AdminSentencesController.php`

### 2026-03-29 — لوحة التحكم: إدارة القاموس (بطاقة رسمية) — تصفية المجلدات، فرعي، إصلاح تصنيف الفروع

#### السياق والمشكلة

- في مودال **«إضافة / تعديل بطاقة رسمية»** (تبويب إدارة القاموس) كانت القائمة تعرض خليطاً من لغات EN/DE ومجلدات غير مرغوبة.
- ظهور مجلدات بأسماء مثل **«1»** أو نصوص عشوائية: غالباً **مجلدات فرعية** أُنشئت من **إدارة المجلدات** وكانت تُحفظ كـ **`isSystem: true`** لأن الطلب كان يرسل ذلك دائماً، فظهرت في قائمة «المجلد الرسمي» مع الجذور الحقيقية.

#### الواجهة — `لوحه التحكم الخارجيه/components/AdminDashboard.tsx`

- **`dictOfficialFolders`**: مجلدات رسمية للقائمة **الرئيسية** فقط — شرط **`isSystem`**، **بدون** `userId` (مجلد مستخدم)، **جذر فقط** (`parentId` فارغ)، ومطابقة **لغة الحفظ** `adminLang` (`en` / `de` / `both`؛ وعند `both` تُعرض اللغتان مع لاحقة EN/DE في النص).
- **`dictOfficialAllowedFolderIds`**: مجموعة معرفات مسموحة عند **الحفظ** = كل **جذر** رسمي + **الفروع المباشرة** تحته (نفس لغة الحفظ، بدون `userId`).
- **`dictOfficialRootId`** + **`dictOfficialSubfolders`**: عند اختيار جذر له فروع مباشرة، تظهر قائمة ثانية **«مكان الحفظ داخل المجلد»** مع خيار **البقاء داخل المجلد الرئيسي** أو اختيار أحد الفروع؛ **`dictCard.folderId`** يصبح الهدف النهائي للبطاقة.
- **`resolveOfficialDictRootId`**: عند **تعديل** بطاقة داخل فرع، يُستنتج الجذر الرسمي المناسب لفتح القائمتين بشكل صحيح.
- **تحقق `handleSaveDictCard`**: رفض الحفظ إذا `folderId` ليس ضمن `dictOfficialAllowedFolderIds` (رسالة توضيح بالعربية).
- **تأثيرات (`useEffect`)**: عند تغيير `adminLang` أو قائمة الجذور مع فتح المودال، تصحيح الجذر؛ ومزامنة `folderId` مع الجذر/الفروع المتاحة.
- **زر «بطاقة جديدة»**: يضبط **`dictOfficialRootId`** وأول **`folderId`** على أول جذر صالح.
- **إغلاق المودال (×)**: إعادة **`dictOfficialRootId`** إلى فارغ لتفادي بقاء اختيار قديم.
- **تحسين جانبي**: رفع صورة البطاقة (`dictImage`) يستخدم **`setDictCard(prev => …)`** لتفادي حالة React القديمة.

#### الواجهة — `لوحه التحكم الخارجيه/components/admin/FoldersTab.tsx`

- عند **إنشاء مجلد**: **`isSystem: !currentFolderId`** — مجلد على **الجذر** يبقى نظامياً افتراضياً؛ **مجلد فرعي** (داخل مجلد مفتوح) يُنشأ **`isSystem: false`** حتى لا يُصنَّف فرع تنظيمي كمجلد نظام بالخطأ.

#### الباك‑إند — `backend/app/Http/Controllers/Api/AdminFolderController.php`

- في **`store`**: إذا وُجد **`parentId`** ولم يُرسل **`isSystem`** صراحة، الافتراضي **`is_system = false`**؛ بدون أب يبقى الافتراضي **نظامي** (`true`). يحمي ذلك أي عميل API ينسى تمرير العلم.

#### ملفات بارزة لهذا البند

- `لوحه التحكم الخارجيه/components/AdminDashboard.tsx`
- `لوحه التحكم الخارجيه/components/admin/FoldersTab.tsx`
- `backend/app/Http/Controllers/Api/AdminFolderController.php`

#### ملاحظة تشغيل

- لا هجرة جديدة مطلوبة لهذا البند؛ تصحيح بيانات قديمة (فروع ما زالت `is_system = 1` في MySQL) اختياري عبر استعلام تحديث حسب `parent_id IS NOT NULL` إذا رغبت بتنظيف السجل.

**أين يُذكر «التسجيل / إنشاء الحساب» في هذا الملف؟**

- ربط تسجيل الدخول وإنشاء الحساب بـ Laravel: البند **11)** في الجدول الزمني الأول + تفاصيل API Auth بعده.
- تسجيل Google/Facebook: قسم **`### 2026-03-24 - Enable Google/Facebook Social Signup`**.
- حفظ العمر/الجنس/المستوى بعد التسجيل عبر API: البند الذي يذكر **`SignupView`** و`updateProfile` و`onboarding`.
