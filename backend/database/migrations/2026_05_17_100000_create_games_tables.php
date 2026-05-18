<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('game_sets')) {
            Schema::create('game_sets', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('lang', 2);
                $table->string('type', 32);
                $table->string('title', 255);
                $table->string('description', 1024)->default('');
                $table->string('level', 32)->default('A1');
                $table->string('sub_level', 16)->nullable();
                $table->string('icon', 64)->nullable();
                $table->string('color', 64)->default('indigo');
                $table->unsignedSmallInteger('xp_reward')->default(120);
                $table->unsignedSmallInteger('time_limit_seconds')->default(90);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['lang', 'type', 'is_active', 'level'], 'game_sets_lookup_idx');
            });
        }

        if (! Schema::hasTable('game_questions')) {
            Schema::create('game_questions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('game_set_id');
                $table->text('prompt');
                $table->text('answer');
                $table->text('translation')->nullable();
                $table->json('options')->nullable();
                $table->json('tokens')->nullable();
                $table->text('audio_text')->nullable();
                $table->text('explanation')->nullable();
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['game_set_id', 'is_active', 'sort_order'], 'game_questions_set_idx');
            });
        }

        if (! Schema::hasTable('game_attempts')) {
            Schema::create('game_attempts', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->uuid('game_set_id');
                $table->string('lang', 2);
                $table->string('type', 32);
                $table->string('plan', 32)->default('free');
                $table->unsignedTinyInteger('score')->default(0);
                $table->unsignedSmallInteger('total_questions')->default(0);
                $table->unsignedSmallInteger('correct_count')->default(0);
                $table->unsignedInteger('xp_earned')->default(0);
                $table->timestamp('started_at');
                $table->timestamp('completed_at')->nullable();
                $table->date('usage_date');
                $table->json('details')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'usage_date'], 'game_attempts_user_day_idx');
                $table->index(['game_set_id', 'completed_at'], 'game_attempts_game_completed_idx');
            });
        }

        $this->seedDefaultsIfEmpty();
    }

    private function seedDefaultsIfEmpty(): void
    {
        if (! Schema::hasTable('game_sets') || DB::table('game_sets')->count() > 0) {
            return;
        }

        $now = now();
        $games = [
            [
                'id' => 'game_en_word_match_a1',
                'lang' => 'en',
                'type' => 'word_match',
                'title' => 'Word Match Sprint',
                'description' => 'طابق الكلمات الإنجليزية بمعناها العربي بسرعة ودقة.',
                'level' => 'A1',
                'icon' => 'Puzzle',
                'color' => 'blue',
                'xp_reward' => 120,
                'time_limit_seconds' => 75,
                'questions' => [
                    ['prompt' => 'Airport', 'answer' => 'مطار', 'options' => ['مطار', 'مطعم', 'حديقة', 'مدرسة'], 'translation' => 'مكان السفر بالطائرة', 'explanation' => 'Airport تعني مطار.'],
                    ['prompt' => 'Receipt', 'answer' => 'إيصال', 'options' => ['إيصال', 'نافذة', 'طبيب', 'قلم'], 'translation' => 'ورقة إثبات الدفع', 'explanation' => 'Receipt تستخدم بعد الدفع.'],
                    ['prompt' => 'Schedule', 'answer' => 'جدول مواعيد', 'options' => ['جدول مواعيد', 'حقيبة', 'مفتاح', 'رسالة'], 'translation' => 'خطة زمنية', 'explanation' => 'Schedule يعني جدول مواعيد.'],
                    ['prompt' => 'Neighbor', 'answer' => 'جار', 'options' => ['جار', 'مدير', 'زبون', 'سائق'], 'translation' => 'شخص يسكن بالقرب منك', 'explanation' => 'Neighbor هو الجار.'],
                    ['prompt' => 'Meeting', 'answer' => 'اجتماع', 'options' => ['اجتماع', 'إجازة', 'فاتورة', 'صيدلية'], 'translation' => 'لقاء منظم للعمل أو النقاش', 'explanation' => 'Meeting تعني اجتماع.'],
                    ['prompt' => 'Careful', 'answer' => 'حذر', 'options' => ['حذر', 'سريع', 'قديم', 'هادئ'], 'translation' => 'يتصرف بانتباه', 'explanation' => 'Careful تعني حذر أو منتبه.'],
                ],
            ],
            [
                'id' => 'game_en_sentence_builder_a1',
                'lang' => 'en',
                'type' => 'sentence_builder',
                'title' => 'Sentence Builder',
                'description' => 'رتب الكلمات لتكوين جمل إنجليزية عملية.',
                'level' => 'A1',
                'icon' => 'Blocks',
                'color' => 'emerald',
                'xp_reward' => 140,
                'time_limit_seconds' => 110,
                'questions' => [
                    ['prompt' => 'أريد تذكرة إلى القاهرة.', 'answer' => 'I want a ticket to Cairo', 'translation' => 'أريد تذكرة إلى القاهرة.', 'tokens' => ['I', 'want', 'a', 'ticket', 'to', 'Cairo'], 'explanation' => 'نبدأ بالفاعل ثم الفعل want ثم الشيء المطلوب.'],
                    ['prompt' => 'هل يمكنك مساعدتي؟', 'answer' => 'Can you help me', 'translation' => 'هل يمكنك مساعدتي؟', 'tokens' => ['Can', 'you', 'help', 'me'], 'explanation' => 'Can في بداية السؤال للطلب المهذب.'],
                    ['prompt' => 'أنا أتعلم الإنجليزية كل يوم.', 'answer' => 'I learn English every day', 'translation' => 'أنا أتعلم الإنجليزية كل يوم.', 'tokens' => ['I', 'learn', 'English', 'every', 'day'], 'explanation' => 'Every day تأتي في نهاية الجملة غالباً.'],
                    ['prompt' => 'أحتاج إلى كوب ماء.', 'answer' => 'I need a glass of water', 'translation' => 'أحتاج إلى كوب ماء.', 'tokens' => ['I', 'need', 'a', 'glass', 'of', 'water'], 'explanation' => 'A glass of water تعبير طبيعي.'],
                    ['prompt' => 'القطار يصل في التاسعة.', 'answer' => 'The train arrives at nine', 'translation' => 'القطار يصل في التاسعة.', 'tokens' => ['The', 'train', 'arrives', 'at', 'nine'], 'explanation' => 'At تستخدم مع الوقت المحدد.'],
                ],
            ],
            [
                'id' => 'game_en_listening_a1',
                'lang' => 'en',
                'type' => 'listening',
                'title' => 'Listening Pulse',
                'description' => 'اسمع الجملة واختر معناها الصحيح.',
                'level' => 'A1',
                'icon' => 'Headphones',
                'color' => 'violet',
                'xp_reward' => 130,
                'time_limit_seconds' => 90,
                'questions' => [
                    ['prompt' => 'Listen and choose the meaning.', 'audioText' => 'Where is the nearest pharmacy?', 'answer' => 'أين أقرب صيدلية؟', 'options' => ['أين أقرب صيدلية؟', 'أين أقرب مطار؟', 'أين غرفتي؟', 'أين القطار؟'], 'translation' => 'Where is the nearest pharmacy?', 'explanation' => 'Nearest pharmacy تعني أقرب صيدلية.'],
                    ['prompt' => 'Listen and choose the meaning.', 'audioText' => 'I have a reservation.', 'answer' => 'لدي حجز.', 'options' => ['لدي حجز.', 'لدي مشكلة.', 'لدي حقيبة.', 'لدي موعد غداً.'], 'translation' => 'I have a reservation.', 'explanation' => 'Reservation تعني حجز.'],
                    ['prompt' => 'Listen and choose the meaning.', 'audioText' => 'Could you repeat that, please?', 'answer' => 'هل يمكنك إعادة ذلك من فضلك؟', 'options' => ['هل يمكنك إعادة ذلك من فضلك؟', 'هل يمكنك الدفع الآن؟', 'هل يمكنك الانتظار هنا؟', 'هل يمكنك فتح الباب؟'], 'translation' => 'Could you repeat that, please?', 'explanation' => 'Repeat تعني يكرر.'],
                    ['prompt' => 'Listen and choose the meaning.', 'audioText' => 'The meeting starts at ten.', 'answer' => 'الاجتماع يبدأ في العاشرة.', 'options' => ['الاجتماع يبدأ في العاشرة.', 'الدرس ينتهي في العاشرة.', 'القطار يغادر في الخامسة.', 'المطعم يفتح صباحاً.'], 'translation' => 'The meeting starts at ten.', 'explanation' => 'Starts at ten تعني يبدأ في العاشرة.'],
                ],
            ],
            [
                'id' => 'game_de_word_match_a1',
                'lang' => 'de',
                'type' => 'word_match',
                'title' => 'Wort-Match Sprint',
                'description' => 'طابق الكلمات الألمانية بمعناها العربي.',
                'level' => 'A1',
                'icon' => 'Puzzle',
                'color' => 'amber',
                'xp_reward' => 120,
                'time_limit_seconds' => 75,
                'questions' => [
                    ['prompt' => 'Bahnhof', 'answer' => 'محطة قطار', 'options' => ['محطة قطار', 'مطار', 'مطعم', 'مدرسة'], 'translation' => 'محطة قطار', 'explanation' => 'Bahnhof تعني محطة قطار.'],
                    ['prompt' => 'Rechnung', 'answer' => 'فاتورة', 'options' => ['فاتورة', 'حقيبة', 'دواء', 'شارع'], 'translation' => 'فاتورة', 'explanation' => 'Rechnung تعني فاتورة أو حساب.'],
                    ['prompt' => 'Termin', 'answer' => 'موعد', 'options' => ['موعد', 'باب', 'قميص', 'طعام'], 'translation' => 'موعد', 'explanation' => 'Termin تعني موعد.'],
                    ['prompt' => 'Nachbar', 'answer' => 'جار', 'options' => ['جار', 'طبيب', 'مدير', 'طالب'], 'translation' => 'جار', 'explanation' => 'Nachbar هو الجار.'],
                    ['prompt' => 'Langsam', 'answer' => 'ببطء', 'options' => ['ببطء', 'بسرعة', 'غداً', 'دائماً'], 'translation' => 'ببطء', 'explanation' => 'Langsam تعني ببطء.'],
                    ['prompt' => 'Wichtig', 'answer' => 'مهم', 'options' => ['مهم', 'رخيص', 'بارد', 'قصير'], 'translation' => 'مهم', 'explanation' => 'Wichtig تعني مهم.'],
                ],
            ],
            [
                'id' => 'game_de_sentence_builder_a1',
                'lang' => 'de',
                'type' => 'sentence_builder',
                'title' => 'Satzbau Trainer',
                'description' => 'رتب الكلمات لتكوين جمل ألمانية صحيحة.',
                'level' => 'A1',
                'icon' => 'Blocks',
                'color' => 'emerald',
                'xp_reward' => 140,
                'time_limit_seconds' => 120,
                'questions' => [
                    ['prompt' => 'أريد تذكرة إلى برلين.', 'answer' => 'Ich möchte ein Ticket nach Berlin', 'translation' => 'أريد تذكرة إلى برلين.', 'tokens' => ['Ich', 'möchte', 'ein', 'Ticket', 'nach', 'Berlin'], 'explanation' => 'Möchte تستخدم للطلب المهذب.'],
                    ['prompt' => 'هل يمكنك مساعدتي؟', 'answer' => 'Können Sie mir helfen', 'translation' => 'هل يمكنك مساعدتي؟', 'tokens' => ['Können', 'Sie', 'mir', 'helfen'], 'explanation' => 'صيغة Sie رسمية ومهذبة.'],
                    ['prompt' => 'أنا أتعلم الألمانية كل يوم.', 'answer' => 'Ich lerne jeden Tag Deutsch', 'translation' => 'أنا أتعلم الألمانية كل يوم.', 'tokens' => ['Ich', 'lerne', 'jeden', 'Tag', 'Deutsch'], 'explanation' => 'Jeden Tag تعني كل يوم.'],
                    ['prompt' => 'القطار يصل في التاسعة.', 'answer' => 'Der Zug kommt um neun an', 'translation' => 'القطار يصل في التاسعة.', 'tokens' => ['Der', 'Zug', 'kommt', 'um', 'neun', 'an'], 'explanation' => 'Ankommen فعل منفصل: kommt ... an.'],
                    ['prompt' => 'أحتاج إلى ماء.', 'answer' => 'Ich brauche Wasser', 'translation' => 'أحتاج إلى ماء.', 'tokens' => ['Ich', 'brauche', 'Wasser'], 'explanation' => 'Brauchen تعني يحتاج.'],
                ],
            ],
            [
                'id' => 'game_de_listening_a1',
                'lang' => 'de',
                'type' => 'listening',
                'title' => 'Hör-Challenge',
                'description' => 'اسمع الجملة الألمانية واختر معناها الصحيح.',
                'level' => 'A1',
                'icon' => 'Headphones',
                'color' => 'rose',
                'xp_reward' => 130,
                'time_limit_seconds' => 90,
                'questions' => [
                    ['prompt' => 'Hören Sie zu und wählen Sie die Bedeutung.', 'audioText' => 'Wo ist die nächste Apotheke?', 'answer' => 'أين أقرب صيدلية؟', 'options' => ['أين أقرب صيدلية؟', 'أين أقرب مطار؟', 'أين غرفتي؟', 'أين القطار؟'], 'translation' => 'Wo ist die nächste Apotheke?', 'explanation' => 'Nächste Apotheke تعني أقرب صيدلية.'],
                    ['prompt' => 'Hören Sie zu und wählen Sie die Bedeutung.', 'audioText' => 'Ich habe eine Reservierung.', 'answer' => 'لدي حجز.', 'options' => ['لدي حجز.', 'لدي مشكلة.', 'لدي حقيبة.', 'لدي موعد غداً.'], 'translation' => 'Ich habe eine Reservierung.', 'explanation' => 'Reservierung تعني حجز.'],
                    ['prompt' => 'Hören Sie zu und wählen Sie die Bedeutung.', 'audioText' => 'Können Sie das bitte wiederholen?', 'answer' => 'هل يمكنك إعادة ذلك من فضلك؟', 'options' => ['هل يمكنك إعادة ذلك من فضلك؟', 'هل يمكنك الدفع الآن؟', 'هل يمكنك الانتظار هنا؟', 'هل يمكنك فتح الباب؟'], 'translation' => 'Können Sie das bitte wiederholen?', 'explanation' => 'Wiederholen تعني يعيد أو يكرر.'],
                    ['prompt' => 'Hören Sie zu und wählen Sie die Bedeutung.', 'audioText' => 'Der Termin beginnt um zehn.', 'answer' => 'الموعد يبدأ في العاشرة.', 'options' => ['الموعد يبدأ في العاشرة.', 'الدرس ينتهي في العاشرة.', 'القطار يغادر في الخامسة.', 'المطعم يفتح صباحاً.'], 'translation' => 'Der Termin beginnt um zehn.', 'explanation' => 'Beginnt um zehn تعني يبدأ في العاشرة.'],
                ],
            ],
        ];

        foreach ($games as $game) {
            $questions = $game['questions'];
            unset($game['questions']);
            DB::table('game_sets')->insert([
                ...$game,
                'sub_level' => null,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($questions as $index => $question) {
                DB::table('game_questions')->insert([
                    'id' => $game['id'].'_q'.($index + 1),
                    'game_set_id' => $game['id'],
                    'prompt' => $question['prompt'],
                    'answer' => $question['answer'],
                    'translation' => $question['translation'] ?? null,
                    'options' => isset($question['options']) ? json_encode($question['options'], JSON_UNESCAPED_UNICODE) : null,
                    'tokens' => isset($question['tokens']) ? json_encode($question['tokens'], JSON_UNESCAPED_UNICODE) : null,
                    'audio_text' => $question['audioText'] ?? null,
                    'explanation' => $question['explanation'] ?? null,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('game_attempts');
        Schema::dropIfExists('game_questions');
        Schema::dropIfExists('game_sets');
    }
};
