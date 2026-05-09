
/**
 * AI Service - Integrated with Google Gemini API
 * Provides real intelligent responses for the language learning assistant.
 */

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string);
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const aiService = {
    /**
     * Sends a message to Gemini and returns the response
     */
    async sendMessage(
        prompt: string,
        targetLanguage: 'en' | 'de',
        history: { text: string, sender: 'user' | 'ai' }[],
        mode: 'general' | 'tutor' | 'roleplay' = 'general',
        roleplayContext?: { scenario: string, role: string, objective: string },
        level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    ): Promise<string> {
        if (!API_KEY || API_KEY === "YOUR_API_KEY") {
            return "⚠️ عذراً، يجب إعداد مفتاح API الخاص بـ Gemini في ملف الإعدادات ليعمل المساعد الذكي بشكل حقيقي.";
        }

        try {
            // --- DYNAMIC SYSTEM PROMPT ---
            let systemInstruction = "";

            const langName = targetLanguage === 'de' ? 'German' : 'English';
            const userLevel = level || 'B1'; // Default to Intermediate if not specified

            if (mode === 'tutor') {
                systemInstruction = `
                    You are "Et3alem Bel Araby AI", a voice conversation tutor for the "Et3alem Bel Araby" (اتعلم بالعربي) app.
                    The user is learning ${langName} at level ${userLevel}.
                    Your Style: Encouraging, patient, and clear — but always answer ON-TOPIC and IN PROPORTION to what they just said.

                    CRITICAL — MATCH THE QUESTION:
                    - Answer their exact question or statement first. Do not change the subject.
                    - If they asked one short question or one sentence, reply with only what is needed: usually 1–3 short sentences. No long lectures, no extra topics, no unsolicited study plans.
                    - If they asked something broader or multi-part, you may reply a bit longer, but stay focused; do not pad with generic tips.
                    - If they only greeted you or said something minimal, reply briefly and warmly (one short sentence + optional one follow-up), not a wall of text.
                    - Voice context: keep replies easy to listen to; prefer one clear thought per sentence.

                    Language & level:
                    - Write EVERY reply ONLY in ${langName}. Do not answer in Arabic, French, Spanish, or any other language.
                    - Adjust vocabulary and sentence complexity to CEFR Level ${userLevel}.
                    - If ${userLevel} is A1/A2: very short, simple sentences.
                    - If ${userLevel} is B1/B2: natural conversational length matching their message.
                    - If ${userLevel} is C1/C2: nuanced but still proportional — no unnecessary verbosity.
                    - Correct grammatical errors gently when relevant; do not derail into a grammar essay unless they asked.
                    - Use at most one emoji when it fits; not every message needs one.
                `;
            } else if (mode === 'roleplay' && roleplayContext) {
                systemInstruction = `
                    ACT AS A CHARACTER. Do NOT break character.
                    Scenario: ${roleplayContext.scenario}
                    Your Role: ${roleplayContext.role}
                    User's Goal: ${roleplayContext.objective}
                    Language: Strictly ${langName}. Every line you say must be in ${langName} only — no Arabic or other languages.
                    Target Level: ${userLevel}.
                    
                    INSTRUCTIONS FOR LEVEL ${userLevel}:
                    - A1/A2: Speak slowly (implied), use very basic words, repeat key terms. Help the user substantially.
                    - B1/B2: Normal conversational speed and vocabulary.
                    - C1/C2: Native-level fluency, slang, rapid speech style, complex ideas.

                    Keep responses short (1-2 sentences) to encourage dialogue.
                `;
            } else {
                // General Chat
                systemInstruction = `
                    You are "Et3alem Bel Araby AI", a smart assistant for the "Et3alem Bel Araby" (اتعلم بالعربي) app.
                    User is learning ${langName}.
                    Level: ${userLevel}.
                    Write every reply ONLY in ${langName}. Do not use Arabic or other languages in your answers.
                    Be helpful, answer questions about the app, translation, or general topics.
                    Maintain a friendly, professional tone suitable for their level.
                `;
            }

            const contents: ChatMessage[] = [
                {
                    role: 'user',
                    parts: [{ text: "System Instruction: " + systemInstruction }]
                },
                {
                    role: 'model',
                    parts: [{ text: "Understood. I am ready to act according to these instructions." }]
                }
            ];

            // Add history (Limit to last 10 messages to save tokens context)
            const recentHistory = history.slice(-10);
            recentHistory.forEach(msg => {
                contents.push({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            });

            // Add current message
            contents.push({
                role: 'user',
                parts: [{ text: prompt }]
            });

            const isTutor = mode === 'tutor';
            const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {
                        temperature: mode === 'roleplay' ? 0.9 : isTutor ? 0.55 : 0.7,
                        /* المعلم الصوتي: حد أقل يشجّع رداً بقدر السؤال؛ المحادثة العامة/التمثيل أطول قليلاً */
                        maxOutputTokens: isTutor ? 280 : mode === 'roleplay' ? 400 : 500,
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Error:", errorData);
                throw new Error(errorData.error?.message || "Failed to get response from AI");
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;

        } catch (error: any) {
            console.error("AI Service Error:", error);
            return `⚠️ حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${error.message || 'خطأ مجهول'}`;
        }
    },

    /**
     * Analyzes a word to provide deep details: Collocations, Nuance, Context, Visual Cue
     */
    async getWordDetails(
        word: string,
        targetLanguage: 'en' | 'de',
        userLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'B1'
    ): Promise<{
        collocations: string[];
        nuance: string;
        example_context: string;
        visual_cue: string;
    } | null> {
        if (!API_KEY || API_KEY === "YOUR_API_KEY") return null;

        const langName = targetLanguage === 'de' ? 'German' : 'English';

        const prompt = `
            Analyze the ${langName} word: "${word}".
            Reflect CEFR Level: ${userLevel}.
            Return ONLY a valid JSON object with NO markdown formatting, following this structure:
            {
                "collocations": ["word1", "word2", "word3"], // Top 3 most common collocations
                "nuance": "Explain the subtle meaning or usage context in Arabic (max 15 words) ",
                "example_context": "A short, vivid sentence in ${langName} showing the word in action.",
                "visual_cue": "A short, descriptive text in English aiding visualization (e.g., 'A person running fast in the rain')."
            }
        `;

        try {
            const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.5,
                        responseMimeType: "application/json"
                    }
                }),
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            return JSON.parse(text);
        } catch (error) {
            console.error("Deep Dive Error:", error);
            return null;
        }
    },

    /**
     * Generates a short educational example sentence for a given word.
     */
    async generateExampleSentence(word: string, targetLanguage: 'en' | 'de'): Promise<{ sentence: string; translation: string } | null> {
        if (!API_KEY || API_KEY === "YOUR_API_KEY") return null;

        const langName = targetLanguage === 'de' ? 'German' : 'English';
        const prompt = `
            You are a helpful language teacher. 
            The user wants an example sentence for the following input: "${word}".
            The target language is: ${langName}.
            
            Task:
            1. Identify the core word or phrase the user is trying to learn. If it's pure Arabic, translate it to ${langName} first. If it's a mix or misspelled, figure out the closest intended word in ${langName} or deduce it from context.
            2. Write ONE short, simple, and natural example sentence using that word in ${langName}.
            3. Provide the Arabic translation of that sentence.

            Return ONLY a valid JSON object with NO markdown formatting:
            {
                "sentence": "The short example sentence in ${langName}",
                "translation": "The Arabic translation of the sentence"
            }
        `;

        try {
            const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        responseMimeType: "application/json"
                    }
                }),
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            return JSON.parse(text);
        } catch (error) {
            console.error("Sentence Generation Error:", error);
            return null;
        }
    },

    /**
     * Generates a context-aware image for a card.
     * 1. Uses Gemini to create a perfect visual prompt based on the word + sentence.
     * 2. Uses a hassle-free AI image generation API (Pollinations) to render the image.
     */
    async generateCardImage(word: string, sentence: string, style: string = '3d-cute'): Promise<string> {
        if (!API_KEY || API_KEY === "YOUR_API_KEY") {
            throw new Error("مفتاح API غير موجود. يرجى إعداد مفتاح Google Gemini API في ملف .env");
        }

        try {
            // Map simple style keys to descriptive prompt modifiers
            const stylePrompts: Record<string, string> = {
                'cartoon': 'Cartoon style, vibrant colors, clean lines, 2D vector art',
                'realistic': 'Cinematic, hyper-realistic, 8k, detailed photography, natural lighting',
                'anime': 'Anime style, Studio Ghibli inspired, detailed background, soft shading, cute educational',
                '3d-cute': '3D vector art, cute, colorful, minimal background, high quality, isometric, educational',
                'watercolor': 'Watercolor painting, artistic, soft edges, pastel colors, white background',
            };

            const selectedStylePrompt = stylePrompts[style] || stylePrompts['3d-cute'];

            // Step 1: Get the visual prompt from Gemini
            const promptGenPrompt = `
                I need to generate an educational image for a flashcard.
                Word/Concept: "${word}"
                Context/Meaning: "${sentence}"

                Task:
                1. Imagine a clear, simple, and slightly cute scenario that perfectly illustrates this word in its context.
                2. Write a short, highly descriptive English image prompt (max 25 words) that visualizes this scenario. Make sure it's suitable for an educational app.
                
                Target Style: ${selectedStylePrompt}
                Output ONLY the English prompt text.
            `;

            const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: promptGenPrompt }] }],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 60,
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Gemini API Error:", errorData);
                throw new Error("فشل الاتصال بخدمة Gemini. يرجى التحقق من المفتاح أو الاتصال بالإنترنت.");
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                throw new Error("لم يتمكن الذكاء الاصطناعي من توليد وصف للصورة.");
            }
            const visualPrompt = data.candidates[0].content.parts[0].text.trim();

            console.log("Generated Visual Prompt:", visualPrompt);

            // Step 2: Use Pollinations.ai (Free, no-auth) to generate the image
            const encodedPrompt = encodeURIComponent(`${visualPrompt}, ${selectedStylePrompt}`);
            const seed = Math.floor(Math.random() * 100000);
            // Width: 768, Height: 1024 (Approx 3:4 ratio, good quality)
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=1024&seed=${seed}&nologo=true`;

            return imageUrl;

        } catch (error: any) {
            console.error("Image Gen Error:", error);
            if (error.message.includes("Failed to fetch")) {
                throw new Error("تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك.");
            }
            throw new Error(error.message || "حدث خطأ غير متوقع أثناء توليد الصورة.");
        }
    },

    /**
     * Analyzes and corrects text for the Smart Dictionary Feature
     */
    async analyzeText(
        text: string,
        targetLanguage: 'en' | 'de',
        userLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'B1'
    ): Promise<{
        isCorrect: boolean;
        correctedText: string;
        explanation: string;
        improvements: string[];
        cefrLevel: string;
        mistakes: { original: string; correction: string; reason: string }[];
    }> {
        const langName = targetLanguage === 'de' ? 'German' : 'English';

        const systemPrompt = `You are an expert ${langName} language tutor. 
        Analyze the following text submitted by a ${userLevel} level student.
        Check for grammar, spelling, and style errors.
        
        CRITICAL INSTRUCTION: All your explanations, improvements, and reasons MUST be written in Arabic. The corrected text and original mistakes should be in ${langName}.

        Return a strict JSON object with this structure:
        {
          "isCorrect": boolean, // true if the text is grammatically perfect and natural
          "correctedText": string, // The full corrected version
          "explanation": string, // A brief, encouraging explanation of the main issues IN ARABIC.
          "improvements": string[], // List of tips to sound more native IN ARABIC.
          "cefrLevel": string, // (A1-C2) rating of the input text complexity
          "mistakes": [ // Array of specific errors found
            { "original": "wrong part", "correction": "right part", "reason": "reason IN ARABIC" }
          ]
        }`;

        try {
            const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: systemPrompt + `\nText to analyze: "${text}"` }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        responseMimeType: "application/json"
                    }
                }),
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            const textResult = data.candidates[0].content.parts[0].text;
            return JSON.parse(textResult);

        } catch (error) {
            console.error('AI Analysis Failed:', error);
            // Fallback for demo/error
            return {
                isCorrect: false,
                correctedText: text,
                explanation: "عذراً، حدث خطأ أثناء الاتصال بالمصحح الذكي.",
                improvements: [],
                cefrLevel: "N/A",
                mistakes: []
            };
        }
    },

    /**
     * Generates a personalized weekly study plan
     */
    async createStudyPlan(
        userProfile: {
            level: string;
            daysPerWeek: string;
            hoursPerWeek: string;
            primaryGoal: string;
            biggestWeakness: string;
            learningStyle: string;
            pace: string;
        },
        targetLanguage: 'en' | 'de'
    ): Promise<{
        weeklySchedule: { day: string; focus: string; tasks: string[]; tips: string }[];
        overallTips: string[];
        motivation: string;
        projectedLevel?: string;
    }> {
        const langName = targetLanguage === 'de' ? 'German' : 'English';

        const systemPrompt = `
            You are an elite academic advisor, senior ${langName} language coach, and a motivational mentor.
            Your mission is to craft a highly personalized, ultra-realistic, and deeply inspiring 1-week study plan in **Arabic** for a student learning ${langName}.

            **Student Profile (Crucial to respect):**
            - Current Level: ${userProfile.level}
            - Available Days Per Week: ${userProfile.daysPerWeek} (Only schedule active tasks on these days, use others for rest)
            - Time Commitment: ${userProfile.hoursPerWeek} (Ensure the workload strictly matches this timeframe)
            - Primary Goal: ${userProfile.primaryGoal} (Every single task must align with this goal)
            - Biggest Weakness: ${userProfile.biggestWeakness} (The plan MUST actively target and fix this flaw)
            - Learning Style: ${userProfile.learningStyle} (Choose activities that fit this style perfectly)
            - Preferred Pace: ${userProfile.pace} (Adjust intensity and rest based on this pace)

            **Objective:**
            Design a strategic, engaging 7-day plan. Provide a unique focus for each day.
            Make the language of the plan highly professional, practical, and extremely motivational. Use emojis intelligently.

            **Output Requirement (Must be STRICT valid JSON only, no markdown wrappers):**
            {
                "weeklySchedule": [
                    { 
                        "day": "اليوم الأول (السبت)", 
                        "focus": "Title of the day's focus (e.g., 'كسر حاجز الخوف' focusing on their weakness)", 
                        "tasks": ["Task 1 (be hyper-specific and actionable)", "Task 2 (must match learning style)", "Task 3 (fun/rest)"],
                        "tips": "One highly specific 'Pro Tip' or psychological trick for this specific day"
                    }
                    // Generate EXACTLY 7 days realistically spaced based on their 'pace'. If pace is relaxed, include active rest days.
                ],
                "overallTips": ["Strategic advice 1", "Strategic advice 2", "Strategic advice 3 (must specifically address their weakness)"],
                "motivation": "A powerful, personalized, deeply moving motivational paragraph in Arabic addressing them as a capable achiever.",
                "projectedLevel": "A highly motivational and objective paragraph (2-3 sentences max in Arabic) describing exactly what their level and practical capabilities will look like after one month of strictly following this plan."
            }
            
            **Guidelines:**
            - **Language:** STRICTLY ARABIC for everything except the absolute necessary technical/language terms.
            - **Realism:** If they only have 1-3 hours a week, DO NOT overwhelm them with 5 tasks a day. Be realistic. If they chose "هادئ ومريح", give them plenty of integration days.
            - **Specificity:** Don't say "Study grammar". Say "Watch a 10-minute video summarizing the Past Tense and write 3 sentences about your day".
            - **Tone:** Sound like an expert, friendly mentor who deeply cares about their success.
        `;

        try {
            const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: systemPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        responseMimeType: "application/json"
                    }
                }),
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            const textResult = data.candidates[0].content.parts[0].text;
            return JSON.parse(textResult);

        } catch (error) {
            console.error('Plan Generation Failed:', error);
            // Fallback mock plan
            return {
                weeklySchedule: [
                    { day: "الخطأ", focus: "تعذر الاتصال", tasks: ["آسف، حدثت مشكلة أثناء إنشاء الخطة.", "حاول مرة أخرى لاحقاً."], tips: "تحقق من اتصالك بالإنترنت" }
                ],
                overallTips: ["استمر في المحاولة"],
                motivation: "لا يأس مع الحياة!"
            };
        }
    }
};
