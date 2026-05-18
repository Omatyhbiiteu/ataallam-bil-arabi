# دليل ربط الـ Backend (منصة مفتاح اللغة | KeyLang)

هذا الدليل مخصص لمطوري الـ Frontend والـ Backend لتوضيح كيفية الانتقال من النسخة الحالية (التي تعتمد على LocalStorage و Firebase) إلى النسخة المربوطة بالـ API الخاص بكم.

## 1. محتوى الـ API Client
قمنا بإنشاء ملف شامل `services/apiClient.ts` يحتوي على جميع نقاط النهاية (Endpoints) المطلوبة للوحتي التحكم والموقع. هذا الملف يدير إرسال واستقبال البيانات مع إرفاق الـ Authorization Bearer Token أوتوماتيكياً.

## 2. كيفية التحويل عندما يجهز الـ Backend

1. تأكد من إضافة رابط السيرفر الخاص بك في ملف `.env`:
   ```env
   VITE_BACKEND_API_URL=https://api.yourserver.com/api
   ```

2. في مكون `hooks/useAppData.ts` والمكونات الأخرى المرتبطة، ستجد حالياً أننا نستخدم:
   ```ts
   import { db } from '../services/db';
   // ...
   const [folders, setFolders] = useState(() => db.load('folders', INITIAL_FOLDERS_EN, lang));
   ```

   **كل ما عليك فعله للربط بالـ API هو استبدال ذلك بـ:**
   ```ts
   import { ContentAPI, UserAPI } from '../services/apiClient';
   // ...
   useEffect(() => {
     async function loadData() {
       try {
         const serverFolders = await ContentAPI.getFolders(lang);
         setFolders(serverFolders);
       } catch (error) {
         console.error('Failed to load folders from API');
       }
     }
     loadData();
   }, [lang]);
   ```

3. بالنسبة للحفظ:
   ```ts
   // بدلاً من:
   useEffect(() => { db.save('folders', folders); }, [folders]);

   // استخدم:
   const handleAddFolder = async (folderData) => {
     const newFolder = await ContentAPI.createFolder(lang, folderData);
     setFolders(prev => [...prev, newFolder]);
   };
   ```

## 3. الذكاء الاصطناعي (AI) والنطق (TTS)
حالياً تتم هذه العمليات في المتصفح، ولكن بمجرد بناء الخادم يجب استدعاؤها عبر الخادم لحماية المفاتيح السريّة:
```ts
// في أي مكون، استبدل aiService بـ AiAPI من apiClient:
import { AiAPI } from '../services/apiClient';

const handleGenerateSentenceClick = async () => {
    // بدلاً من aiService.generateExampleSentence
    const result = await AiAPI.generateExample({ word: textToAnalyze, targetLanguage });
    // ...
};
```

## الخلاصة
لقد قمنا بتجهيز `apiClient.ts` ليكون "قطعة التركيب" بين الموقع والباك إند. وتعمل واجهة المستخدم (UI) بمعزل عن قواعد البيانات، مما يعني أن تعديل مصدر البيانات (من `db.ts` إلى `apiClient.ts`) لن يؤثر على أي شكل أو مكون في الموقع!
