<?php

namespace Database\Seeders;

use App\Models\Story;
use Illuminate\Database\Seeder;

class SeedInitialStoriesSeeder extends Seeder
{
    public function run(): void
    {
        $storiesEn = [
            [
                'title' => 'The Lion and the Mouse',
                'description' => 'A classic fable about kindness.',
                'level' => 'Beginner',
                'image' => 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?auto=format&fit=crop&q=80&w=800',
                'content' => "A lion was sleeping in the forest. A little mouse started playing on him. The lion woke up and was very angry. He was about to eat the mouse.\n\nThe mouse said, \"Please, Mr. Lion, do not eat me. I am small, but one day I might help you.\" The lion laughed. \"You? Help me? I am the King of the Forest!\" But he let the mouse go.\n\nSome days later, hunters caught the lion in a big net. The lion roared loudly. The mouse heard him and ran to help. The mouse chewed the ropes of the net with his sharp teeth. Soon, the lion was free.\n\n\"Thank you,\" said the lion. \"You were right. Even a little friend can be a great friend.\"",
                'translation' => "كان هناك أسد نائم في الغابة. بدأت فأرة صغيرة تلعب فوقه. استيقظ الأسد وكان غاضباً جداً. كان على وشك أن يأكل الفأرة.\n\nقالت الفأرة: \"أرجوك يا سيد أسد، لا تأكلني. أنا صغيرة، لكن يوماً ما قد أساعدك.\" ضحك الأسد. \"أنتِ؟ تساعدينني؟ أنا ملك الغابة!\" لكنه ترك الفأرة تذهب.\n\nفي أحد الأيام، أمسك الصيادون الأسد في شبكة كبيرة. زأر الأسد بصوت عالٍ. سمعته الفأرة وركضت للمساعدة. مضغت الفأرة حبال الشبكة بأسنانها الحادة. وسرعان ما أصبح الأسد حراً.\n\nقال الأسد: \"شكراً لك. كنتِ محقة. حتى الصديق الصغير يمكن أن يكون صديقاً عظيماً.\"",
                'word_count' => 108,
                'estimated_reading_time' => 2,
                'difficulty' => 2,
                'tags' => ['fable', 'animals', 'kindness'],
                'questions' => [],
            ],
            [
                'title' => 'The Lazy Boy',
                'description' => 'A story about a boy who learned the value of hard work.',
                'level' => 'Beginner',
                'image' => 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
                'content' => "Jack was a very lazy boy. He liked to sleep and play video games all day. His father worked hard on a farm.\n\nOne day, his father said, \"Jack, come help me in the field.\" Jack said, \"I am too tired.\" His father was sad.\n\nThat night, the internet stopped working. Jack was bored. He went to the field. He saw his father looking at the stars. \"Dad, why do you work so hard?\" Jack asked.\n\nHis father smiled. \"Because when you plant seeds, you get beautiful flowers and food. Laziness grows nothing.\"\n\nJack thought about this. The next day, he went to the field. He worked hard. It was difficult, but he felt proud. He learned that hard work brings its own happiness.",
                'translation' => "كان جاك فتى كسولاً جداً. كان يحب النوم ولعب ألعاب الفيديو طوال اليوم. كان والده يعمل بجد في مزرعة.\n\nفي أحد الأيام، قال والده: \"جاك، تعال ساعدني في الحقل.\" قال جاك: \"أنا متعب جداً.\" حزن والده.\n\nفي تلك الليلة، توقف الإنترنت عن العمل. شعر جاك بالملل. ذهب إلى الحقل. رأى والده ينظر إلى النجوم. سأل جاك: \"أبي، لماذا تعمل بجد؟\"\n\nابتسم والده. \"لأنك عندما تزرع البذور، تحصل على زهور جميلة وطعام. الكسل لا ينمي شيئاً.\"\n\nفكر جاك في هذا. في اليوم التالي، ذهب إلى الحقل. عمل بجد. كان الأمر صعباً، لكنه شعر بالفخر. تعلم أن العمل الجاد يجلب سعادته الخاصة.",
                'word_count' => 125,
                'estimated_reading_time' => 2,
                'difficulty' => 2,
                'tags' => ['life-lesson', 'family', 'work'],
                'questions' => [],
            ],
            [
                'title' => "The Time Traveler's Mistake",
                'description' => 'A scientist learns that some things should not be changed.',
                'level' => 'Intermediate',
                'image' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
                'content' => "Dr. Sarah Chen had finally done it. After twenty years of research, she had built a working time machine. Her laboratory was filled with complex equipment, blinking lights, and the hum of electricity.\n\n\"I'll go back and prevent my father's accident,\" she thought. Her father had died in a car crash when she was ten years old. The pain had never left her.\n\nShe set the coordinates for March 15th, 1995, and pressed the activation button. The world around her blurred and twisted. When everything stopped spinning, she found herself standing on a familiar street corner.\n\nThere he was—her father, walking toward his car. \"Dad!\" she shouted, running toward him. \"Don't get in that car! Please!\"\n\nHer father looked confused. \"Do I know you?\" he asked.\n\nSarah grabbed his arm. \"You have to trust me. If you drive today, you'll have an accident.\"\n\nHer father hesitated, then nodded. \"Okay, I'll take the bus instead.\"\n\nSarah smiled with relief and returned to her time machine. But when she arrived back in the present, everything was different. Her laboratory was gone. In its place was an empty warehouse. She checked her phone—no contacts, no photos, nothing.\n\nShe realized the horrible truth: by saving her father, she had changed everything. Without the pain of losing him, she had never become a scientist. She had never built the time machine. She had erased her own achievement.\n\nSarah stood in the empty warehouse, tears streaming down her face. Some things, she realized, were meant to be—no matter how much they hurt.",
                'translation' => "أخيراً نجحت الدكتورة سارة تشن. بعد عشرين عاماً من البحث، بنت آلة زمن تعمل. كان مختبرها مليئاً بالمعدات المعقدة والأضواء الوامضة وطنين الكهرباء.\n\n\"سأعود وأمنع حادث والدي\"، فكرت. لقد مات والدها في حادث سيارة عندما كانت في العاشرة من عمرها. لم يفارقها الألم أبداً.\n\nضبطت الإحداثيات على 15 مارس 1995، وضغطت على زر التفعيل. تشوش العالم من حولها والتوى. عندما توقف كل شيء عن الدوران، وجدت نفسها واقفة في زاوية شارع مألوفة.\n\nكان هناك—والدها، يمشي نحو سيارته. \"أبي!\" صرخت، راكضة نحوه. \"لا تركب تلك السيارة! أرجوك!\"\n\nبدا والدها مرتبكاً. \"هل أعرفك؟\" سأل.\n\nأمسكت سارة بذراعه. \"يجب أن تثق بي. إذا قدت اليوم، ستتعرض لحادث.\"\n\nتردد والدها، ثم أومأ. \"حسناً، سآخذ الحافلة بدلاً من ذلك.\"\n\nابتسمت سارة بارتياح وعادت إلى آلة الزمن. لكن عندما وصلت إلى الحاضر، كان كل شيء مختلفاً. اختفى مختبرها. في مكانه كان هناك مستودع فارغ. فحصت هاتفها—لا جهات اتصال، لا صور، لا شيء.\n\nأدركت الحقيقة المروعة: بإنقاذ والدها، غيرت كل شيء. بدون ألم فقدانه، لم تصبح عالمة أبداً. لم تبن آلة الزمن أبداً. محت إنجازها الخاص.\n\nوقفت سارة في المستودع الفارغ، والدموع تنهمر على وجهها. بعض الأشياء، أدركت، كان من المفترض أن تكون—مهما كان الألم الذي تسببه.",
                'word_count' => 285,
                'estimated_reading_time' => 4,
                'difficulty' => 5,
                'tags' => ['science-fiction', 'time-travel', 'philosophy'],
                'questions' => [
                    ['id' => 'q3_1', 'type' => 'multiple-choice', 'text' => 'Why did Dr. Sarah Chen build a time machine?', 'options' => ['To become famous', "To prevent her father's death", 'To win a Nobel Prize', 'To explore the future'], 'correctAnswer' => "To prevent her father's death"],
                    ['id' => 'q3_2', 'type' => 'true-false', 'text' => 'Sarah successfully saved her father and kept her laboratory.', 'correctAnswer' => 'false'],
                    ['id' => 'q3_3', 'type' => 'multiple-choice', 'text' => 'What was the main lesson of the story?', 'options' => ['Time travel is impossible', 'Some painful events shape who we become', 'Scientists should not experiment', 'The past cannot be changed'], 'correctAnswer' => 'Some painful events shape who we become'],
                ],
            ],
            [
                'title' => 'The Last Library',
                'description' => 'In a digital world, one girl discovers the magic of physical books.',
                'level' => 'Intermediate',
                'image' => 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800',
                'content' => "In the year 2087, books were extinct. Everything was digital—stored in clouds, accessed through neural implants, downloaded directly into people's minds. Libraries were ancient history, mentioned only in digital archives.\n\nMaya was sixteen and had never touched a physical book. She learned everything through her implant: mathematics appeared in her vision, history played like movies in her mind, languages downloaded in seconds.\n\nOne day, while exploring an abandoned part of the city, Maya discovered a hidden door. Behind it was a room filled with dusty shelves, and on those shelves were hundreds of objects she had only seen in historical files—books.\n\nCuriously, she picked one up. It was heavy, with a worn leather cover. She opened it carefully. The pages were yellow and fragile. There were no moving images, no sound effects, no interactive elements. Just words. Black ink on paper.\n\nMaya began to read. At first, it felt strange. Her mind was used to information appearing instantly. But as she continued, something magical happened. The words created pictures in her imagination—pictures she created herself, not downloaded from a server.\n\nShe spent hours in that hidden library, reading story after story. Each book was different. Some made her laugh, others made her cry. The experience was slower than her implant, but somehow richer, more personal.\n\nWhen she finally left, Maya made a decision. She would protect this place. In a world of instant information, she had discovered something precious: the joy of discovering knowledge slowly, of creating her own mental images, of holding history in her hands.\n\nThe last library would not be forgotten.",
                'translation' => "في عام 2087، انقرضت الكتب. كان كل شيء رقمياً—مخزناً في السحابة، يُصل إليه عبر غرسات عصبية، يُحمّل مباشرة في عقول الناس. كانت المكتبات تاريخاً قديماً، تُذكر فقط في الأرشيفات الرقمية.\n\nكانت مايا في السادسة عشرة ولم تلمس كتاباً مادياً قط. تعلمت كل شيء من خلال غرستها: ظهرت الرياضيات في رؤيتها، لُعب التاريخ كأفلام في عقلها، حُملت اللغات في ثوانٍ.\n\nذات يوم، أثناء استكشاف جزء مهجور من المدينة، اكتشفت مايا باباً مخفياً. خلفه كانت غرفة مليئة بالرفوف المغبرة، وعلى تلك الرفوف كانت مئات الأشياء التي رأتها فقط في الملفات التاريخية—كتب.\n\nبفضول، التقطت واحداً. كان ثقيلاً، بغلاف جلدي بالٍ. فتحته بحذر. كانت الصفحات صفراء وهشة. لم تكن هناك صور متحركة، ولا مؤثرات صوتية، ولا عناصر تفاعلية. فقط كلمات. حبر أسود على ورق.\n\nبدأت مايا بالقراءة. في البداية، شعرت بالغرابة. كان عقلها معتاداً على ظهور المعلومات فوراً. لكن بينما واصلت، حدث شيء سحري. خلقت الكلمات صوراً في خيالها—صوراً خلقتها بنفسها، لم تُحمّل من خادم.\n\nقضت ساعات في تلك المكتبة المخفية، تقرأ قصة تلو الأخرى. كان كل كتاب مختلفاً. بعضها أضحكها، والبعض الآخر أبكاها. كانت التجربة أبطأ من غرستها، لكنها بطريقة ما أغنى، أكثر شخصية.\n\nعندما غادرت أخيراً، اتخذت مايا قراراً. ستحمي هذا المكان. في عالم من المعلومات الفورية، اكتشفت شيئاً ثميناً: متعة اكتشاف المعرفة ببطء، وخلق صورها الذهنية الخاصة، وحمل التاريخ بين يديها.\n\nلن تُنسى المكتبة الأخيرة.",
                'word_count' => 312,
                'estimated_reading_time' => 5,
                'difficulty' => 6,
                'tags' => ['science-fiction', 'books', 'technology', 'future'],
                'questions' => [
                    ['id' => 'q4_1', 'type' => 'multiple-choice', 'text' => 'How did people learn in 2087?', 'options' => ['Through physical books', 'Through neural implants', 'Through teachers', 'Through television'], 'correctAnswer' => 'Through neural implants'],
                    ['id' => 'q4_2', 'type' => 'text-input', 'text' => 'What was special about reading physical books according to Maya?', 'correctAnswer' => 'creating her own mental images'],
                    ['id' => 'q4_3', 'type' => 'true-false', 'text' => 'Maya decided to destroy the library because books were outdated.', 'correctAnswer' => 'false'],
                ],
            ],
            [
                'title' => 'The Silent Musician',
                'description' => 'A deaf composer creates the most beautiful symphony.',
                'level' => 'Intermediate',
                'image' => 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800',
                'content' => "Elena had been deaf since birth. She lived in a world of silence, communicating through sign language and written words. Most people assumed she could never appreciate music, but they were wrong.\n\nElena felt music. She felt the vibrations of bass drums through the floor. She felt the rhythm of guitar strings through the wood. She watched the movements of conductors and dancers, seeing the patterns and emotions that others only heard.\n\nAt twenty-five, Elena decided to compose her own symphony. People laughed. \"How can a deaf person write music?\" they asked. But Elena didn't listen to the doubters—she couldn't hear them anyway.\n\nShe worked for three years, feeling every note through vibrations, watching videos of orchestras in slow motion, studying the mathematics of harmony and rhythm. She translated sound into patterns she could understand—visual patterns, numerical sequences, physical sensations.\n\nWhen her symphony was finally performed, the concert hall was packed. Critics came expecting a disaster. What they heard instead was extraordinary. The music was different—it had unusual rhythms and unexpected harmonies—but it was beautiful in a way they had never experienced before.\n\nAfter the performance, a famous conductor approached Elena. \"How did you do it?\" he asked through an interpreter.\n\nElena smiled and signed her response: \"I didn't hear the music. I felt it. I saw it. I understood it in ways you never could. My silence gave me a different kind of hearing.\"\n\nThe conductor realized something profound: limitations can become strengths. Elena's deafness hadn't prevented her from creating music—it had given her a unique perspective that made her music unlike anything else in the world.",
                'translation' => "كانت إيلينا صماء منذ الولادة. عاشت في عالم من الصمت، تتواصل من خلال لغة الإشارة والكلمات المكتوبة. افترض معظم الناس أنها لن تتمكن أبداً من تقدير الموسيقى، لكنهم كانوا مخطئين.\n\nشعرت إيلينا بالموسيقى. شعرت باهتزازات طبول الباس عبر الأرضية. شعرت بإيقاع أوتار الجيتار عبر الخشب. شاهدت حركات القادة والراقصين، رأت الأنماط والعواطف التي سمعها الآخرون فقط.\n\nفي الخامسة والعشرين، قررت إيلينا تأليف سيمفونيتها الخاصة. ضحك الناس. \"كيف يمكن لشخص أصم أن يكتب موسيقى؟\" سألوا. لكن إيلينا لم تستمع للمشككين—لم تكن تستطيع سماعهم على أي حال.\n\nعملت لمدة ثلاث سنوات، تشعر بكل نوتة من خلال الاهتزازات، تشاهد مقاطع فيديو للأوركسترا بالحركة البطيئة، تدرس رياضيات التناغم والإيقاع. ترجمت الصوت إلى أنماط يمكنها فهمها—أنماط بصرية، تسلسلات عددية، أحاسيس جسدية.\n\nعندما عُزفت سيمفونيتها أخيراً، كانت قاعة الحفلات مكتظة. جاء النقاد متوقعين كارثة. ما سمعوه بدلاً من ذلك كان استثنائياً. كانت الموسيقى مختلفة—كان لها إيقاعات غير عادية وتناغمات غير متوقعة—لكنها كانت جميلة بطريقة لم يختبروها من قبل.\n\nبعد الأداء، اقترب قائد أوركسترا مشهور من إيلينا. \"كيف فعلتِ ذلك؟\" سأل من خلال مترجم.\n\nابتسمت إيلينا ووقعت ردها: \"لم أسمع الموسيقى. شعرت بها. رأيتها. فهمتها بطرق لا يمكنك أبداً. أعطاني صمتي نوعاً مختلفاً من السمع.\"\n\nأدرك القائد شيئاً عميقاً: يمكن أن تصبح القيود نقاط قوة. لم يمنعها صمم إيلينا من خلق الموسيقى—بل أعطاها منظوراً فريداً جعل موسيقاها لا مثيل لها في العالم.",
                'word_count' => 298,
                'estimated_reading_time' => 4,
                'difficulty' => 6,
                'tags' => ['inspiration', 'music', 'disability', 'art'],
                'questions' => [
                    ['id' => 'q5_1', 'type' => 'multiple-choice', 'text' => 'How did Elena experience music?', 'options' => ['Through hearing aids', 'Through vibrations and visual patterns', "She couldn't experience it", "Through other people's descriptions"], 'correctAnswer' => 'Through vibrations and visual patterns'],
                    ['id' => 'q5_2', 'type' => 'multiple-choice', 'text' => 'What was the main message of the story?', 'options' => ['Deaf people cannot create music', 'Limitations can become unique strengths', 'Music is only for those who can hear', 'Technology solves all problems'], 'correctAnswer' => 'Limitations can become unique strengths'],
                ],
            ],
            [
                'title' => 'The Memory Thief',
                'description' => 'A thief who steals memories learns their true value.',
                'level' => 'Intermediate',
                'image' => 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&q=80&w=800',
                'content' => "In the underground markets of Neo-Tokyo, memories were currency. People sold their happiest moments to pay rent, traded childhood memories for food, exchanged love stories for medicine. And Marcus was the best memory thief in the business.\n\nHe had a special device—a neural scanner that could extract memories without the owner knowing. He targeted the wealthy, stealing their precious moments and selling them to the highest bidder. He felt no guilt. Memories were just data, he told himself.\n\nOne night, Marcus broke into the penthouse of a billionaire. The man was old, sitting alone in a dark room. Marcus activated his scanner and began the extraction. But something went wrong. Instead of stealing the memory, Marcus experienced it.\n\nHe saw the billionaire as a young man, holding his newborn daughter. The joy, the fear, the overwhelming love—Marcus felt it all. Then he saw the daughter growing up, her first steps, her graduation. He saw her wedding day, the billionaire crying tears of happiness.\n\nThen the memory turned dark. The daughter's car accident. The hospital. The funeral. The billionaire's world shattering into pieces. Marcus felt the man's grief as if it were his own.\n\nWhen the memory ended, Marcus was crying. He looked at the old man, who was staring at him with knowing eyes.\n\n\"You felt it, didn't you?\" the billionaire whispered. \"Now you understand. Memories aren't just data. They're pieces of our souls. The happy ones give us strength. The painful ones make us human.\"\n\nMarcus left the penthouse empty-handed. He destroyed his scanner and never stole another memory. He had learned that some things have value beyond price—and memories, both joyful and painful, are what make us who we are.",
                'translation' => "في أسواق نيو-طوكيو السرية، كانت الذكريات عملة. باع الناس لحظاتهم الأسعد لدفع الإيجار، تبادلوا ذكريات الطفولة بالطعام، استبدلوا قصص الحب بالدواء. وكان ماركوس أفضل سارق ذكريات في المجال.\n\nكان لديه جهاز خاص—ماسح عصبي يمكنه استخراج الذكريات دون علم المالك. استهدف الأثرياء، سرق لحظاتهم الثمينة وباعها لأعلى مزايد. لم يشعر بالذنب. الذكريات مجرد بيانات، قال لنفسه.\n\nذات ليلة، اقتحم ماركوس شقة مليونير. كان الرجل عجوزاً، جالساً وحيداً في غرفة مظلمة. فعّل ماركوس ماسحه وبدأ الاستخراج. لكن حدث خطأ ما. بدلاً من سرقة الذاكرة، عاشها ماركوس.\n\nرأى المليونير كشاب، يحمل ابنته المولودة حديثاً. الفرح، الخوف، الحب الطاغي—شعر ماركوس بكل ذلك. ثم رأى الابنة تكبر، خطواتها الأولى، تخرجها. رأى يوم زفافها، المليونير يبكي دموع السعادة.\n\nثم أصبحت الذاكرة مظلمة. حادث سيارة الابنة. المستشفى. الجنازة. عالم المليونير يتحطم إلى قطع. شعر ماركوس بحزن الرجل كما لو كان حزنه.\n\nعندما انتهت الذاكرة، كان ماركوس يبكي. نظر إلى الرجل العجوز، الذي كان يحدق فيه بعيون عارفة.\n\n\"شعرت بها، أليس كذلك؟\" همس المليونير. \"الآن تفهم. الذكريات ليست مجرد بيانات. إنها قطع من أرواحنا. السعيدة منها تعطينا القوة. المؤلمة تجعلنا بشراً.\"\n\nغادر ماركوس الشقة خالي الوفاض. دمر ماسحه ولم يسرق ذاكرة أخرى أبداً. تعلم أن بعض الأشياء لها قيمة تتجاوز السعر—والذكريات، السعيدة والمؤلمة، هي ما يجعلنا من نحن.",
                'word_count' => 318,
                'estimated_reading_time' => 5,
                'difficulty' => 6,
                'tags' => ['science-fiction', 'philosophy', 'ethics', 'emotion'],
                'questions' => [
                    ['id' => 'q6_1', 'type' => 'multiple-choice', 'text' => 'What did Marcus do for a living?', 'options' => ['He sold memories', 'He stole memories', 'He created memories', 'He deleted memories'], 'correctAnswer' => 'He stole memories'],
                    ['id' => 'q6_2', 'type' => 'true-false', 'text' => "Marcus continued stealing memories after experiencing the billionaire's memory.", 'correctAnswer' => 'false'],
                    ['id' => 'q6_3', 'type' => 'multiple-choice', 'text' => 'What did Marcus learn from the experience?', 'options' => ['Memories are worthless', 'Only happy memories matter', 'Memories make us human', 'Stealing is profitable'], 'correctAnswer' => 'Memories make us human'],
                ],
            ],
            [
                'title' => 'The Paradox of Choice',
                'description' => 'A philosopher discovers that unlimited options can be a prison.',
                'level' => 'Advanced',
                'image' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
                'content' => "Professor David Schwartz had dedicated his life to studying decision-making. His research showed that humans, when given unlimited choices, often became paralyzed and made worse decisions than when options were limited. It was a fascinating theoretical concept—until it became his reality.\n\nThe experiment started innocuously. A tech company had developed a device that could show you every possible outcome of every decision you might make. They called it the \"Omniscient Choice Engine.\" David volunteered to test it, believing it would revolutionize human decision-making.\n\nThe first day was exhilarating. Should he have coffee or tea? The device showed him both futures: with coffee, he'd be slightly more alert but also more anxious; with tea, he'd be calmer but less productive. He chose coffee, fascinated by the precision.\n\nBut then came bigger decisions. Which research project should he pursue? The device showed him thousands of possible futures, each branching into infinite possibilities. In one future, he won a Nobel Prize but his marriage failed. In another, he remained happily married but his career stagnated. In yet another, he achieved both but developed a chronic illness from stress.\n\nDavid spent hours analyzing each option, trying to find the \"perfect\" choice. Days turned into weeks. He stopped making decisions altogether. He couldn't choose what to eat, what to wear, or even whether to get out of bed. Every choice led to infinite consequences, and he couldn't bear the responsibility of choosing wrong.\n\nHis wife found him one evening, staring at the device, tears streaming down his face. \"I can't do it anymore,\" he whispered. \"How do people make choices when they can see all the consequences?\"\n\nShe gently took the device from his hands and turned it off. \"They don't see the consequences,\" she said. \"They make choices based on values, intuition, and hope. Perfection isn't the goal—living is.\"\n\nDavid realized his mistake. The pursuit of the perfect choice had prevented him from making any choice at all. Freedom wasn't about having unlimited options—it was about having the courage to choose despite uncertainty.\n\nHe destroyed the device the next day. His research paper, titled \"The Paradox of Perfect Information,\" became his most influential work. In it, he argued that human decision-making isn't flawed because we lack information—it's beautiful because we choose despite our limitations.",
                'translation' => "كرّس البروفيسور ديفيد شوارتز حياته لدراسة صنع القرار. أظهرت أبحاثه أن البشر، عند منحهم خيارات غير محدودة، غالباً ما يصابون بالشلل ويتخذون قرارات أسوأ من عندما تكون الخيارات محدودة. كان مفهوماً نظرياً رائعاً—حتى أصبح واقعه.\n\nبدأت التجربة بشكل بريء. طورت شركة تقنية جهازاً يمكنه أن يريك كل نتيجة محتملة لكل قرار قد تتخذه. أسموه \"محرك الاختيار العليم\". تطوع ديفيد لاختباره، معتقداً أنه سيحدث ثورة في صنع القرار البشري.\n\nكان اليوم الأول مبهجاً. هل يجب أن يشرب قهوة أم شاياً؟ أظهر له الجهاز كلا المستقبلين: مع القهوة، سيكون أكثر يقظة قليلاً لكن أيضاً أكثر قلقاً؛ مع الشاي، سيكون أكثر هدوءاً لكن أقل إنتاجية. اختار القهوة، مفتوناً بالدقة.\n\nلكن بعد ذلك جاءت قرارات أكبر. أي مشروع بحثي يجب أن يتابع؟ أظهر له الجهاز آلاف المستقبلات المحتملة، كل منها يتفرع إلى احتمالات لا نهائية.\n\nقضى ديفيد ساعات في تحليل كل خيار، محاولاً إيجاد الاختيار \"المثالي\". تحولت الأيام إلى أسابيع. توقف عن اتخاذ القرارات تماماً.\n\nوجدته زوجته ذات مساء، يحدق في الجهاز، والدموع تنهمر على وجهه.\n\nأدرك ديفيد خطأه. لقد منعه السعي وراء الاختيار المثالي من اتخاذ أي اختيار على الإطلاق.\n\nأصبحت ورقته البحثية، بعنوان \"مفارقة المعلومات المثالية\"، أكثر أعماله تأثيراً.",
                'word_count' => 425,
                'estimated_reading_time' => 6,
                'difficulty' => 8,
                'tags' => ['philosophy', 'psychology', 'decision-making', 'science-fiction'],
                'questions' => [
                    ['id' => 'q7_1', 'type' => 'multiple-choice', 'text' => "What was Professor Schwartz's field of study?", 'options' => ['Physics', 'Decision-making', 'Technology', 'Medicine'], 'correctAnswer' => 'Decision-making'],
                    ['id' => 'q7_2', 'type' => 'multiple-choice', 'text' => 'What problem did the Omniscient Choice Engine create?', 'options' => ['It was too expensive', 'It showed too many possibilities and paralyzed decision-making', 'It was inaccurate', 'It was too slow'], 'correctAnswer' => 'It showed too many possibilities and paralyzed decision-making'],
                    ['id' => 'q7_3', 'type' => 'text-input', 'text' => 'According to the story, what makes human decision-making beautiful?', 'correctAnswer' => 'choosing despite limitations'],
                ],
            ],
            [
                'title' => 'The Ethics of Immortality',
                'description' => 'A scientist must decide whether humanity should live forever.',
                'level' => 'Advanced',
                'image' => 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=800',
                'content' => "Dr. Amara Okafor had done the impossible: she had discovered the cure for aging. Her laboratory in Lagos had become the center of the scientific world. World leaders, billionaires, and ordinary people alike begged for access to her treatment. But Amara refused to release it.\n\nThe treatment was simple—a single injection that would reset cellular aging indefinitely. No more disease, no more death from old age. Humanity could live forever. It seemed like the ultimate gift, but Amara saw the darker implications.\n\nShe convened a secret council of ethicists, economists, philosophers, and scientists. \"If we release this,\" she began, \"what happens to society?\"\n\nThe debates continued for weeks. Amara listened to every argument, her burden growing heavier each day.\n\n\"I am a scientist, not a god,\" she wrote in her final paper. \"I can give humanity the tools, but I cannot make the choice for them. The question isn't whether we can live forever—it's whether we should. And that decision belongs to all of us, not just to me.\"\n\nAmara herself never took the treatment. \"I want to experience life as humans always have,\" she explained. \"With a beginning, a middle, and an end. That's what makes each moment precious.\"",
                'translation' => "فعلت الدكتورة أمارا أوكافور المستحيل: اكتشفت علاج الشيخوخة.\n\nكان العلاج بسيطاً—حقنة واحدة من شأنها إعادة ضبط شيخوخة الخلايا إلى أجل غير مسمى.\n\nاستمرت المناقشات لأسابيع.\n\n\"أنا عالمة، لست إلهاً\".\n\nأمارا نفسها لم تأخذ العلاج أبداً.",
                'word_count' => 445,
                'estimated_reading_time' => 7,
                'difficulty' => 9,
                'tags' => ['ethics', 'philosophy', 'science', 'immortality', 'society'],
                'questions' => [
                    ['id' => 'q8_1', 'type' => 'multiple-choice', 'text' => 'What did Dr. Okafor discover?', 'options' => ['A cure for cancer', 'A cure for aging', 'Time travel', 'Teleportation'], 'correctAnswer' => 'A cure for aging'],
                    ['id' => 'q8_2', 'type' => 'checkbox', 'text' => 'Which concerns were raised about immortality? (Select all that apply)', 'options' => ['Economic collapse', 'Overpopulation', 'Inequality', 'Loss of tradition'], 'correctAnswer' => ['Economic collapse', 'Overpopulation', 'Inequality']],
                    ['id' => 'q8_3', 'type' => 'multiple-choice', 'text' => "What was Dr. Okafor's final decision?", 'options' => ['Keep the formula secret', 'Sell it to the highest bidder', 'Publish it openly and let humanity decide', 'Destroy the research'], 'correctAnswer' => 'Publish it openly and let humanity decide'],
                    ['id' => 'q8_4', 'type' => 'true-false', 'text' => 'Dr. Okafor took the immortality treatment herself.', 'correctAnswer' => 'false'],
                ],
            ],
            [
                'title' => 'The Language of Silence',
                'description' => 'A linguist discovers that some things transcend words.',
                'level' => 'Advanced',
                'image' => 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800',
                'content' => "Professor Katherine Wells had mastered forty-seven languages. She could discuss philosophy in ancient Greek, negotiate business in Mandarin, recite poetry in Arabic, and tell jokes in Swahili. Language was her life, her passion, her identity.\n\nThen she met the Sentinelese.\n\nThe Sentinelese people lived on a remote island, completely isolated from the modern world.\n\nFrustrated, Katherine sat down on the beach and simply waited. An elderly Sentinelese woman approached slowly. She didn't speak. Instead, she sat beside Katherine and began drawing patterns in the sand.\n\nThey sat together for hours. No words were exchanged, yet Katherine felt she understood more than any conversation had ever taught her.\n\nKatherine returned to her university a changed person. She wrote a controversial paper titled \"The Limits of Language.\" In it, she argued that language, for all its power, could never fully capture certain human experiences.",
                'translation' => "أتقنت البروفيسورة كاثرين ويلز سبعاً وأربعين لغة.\n\nثم التقت بشعب سنتينيليز.\n\nكان الاجتماع الأول متوتراً.\n\nبدأت امرأة مسنة ترسم أنماطاً في الرمال.\n\nعادت كاثرين إلى جامعتها وكتبت ورقة بعنوان \"حدود اللغة\".",
                'word_count' => 468,
                'estimated_reading_time' => 7,
                'difficulty' => 9,
                'tags' => ['linguistics', 'philosophy', 'communication', 'culture', 'anthropology'],
                'questions' => [
                    ['id' => 'q9_1', 'type' => 'multiple-choice', 'text' => 'How many languages had Professor Wells mastered?', 'options' => ['Twenty-seven', 'Thirty-seven', 'Forty-seven', 'Fifty-seven'], 'correctAnswer' => 'Forty-seven'],
                    ['id' => 'q9_2', 'type' => 'multiple-choice', 'text' => 'How did the Sentinelese woman communicate with Katherine?', 'options' => ['Through spoken words', 'Through drawings in the sand', 'Through sign language', 'Through writing'], 'correctAnswer' => 'Through drawings in the sand'],
                    ['id' => 'q9_3', 'type' => 'text-input', 'text' => "What was the title of Katherine's controversial paper?", 'correctAnswer' => 'The Limits of Language'],
                    ['id' => 'q9_4', 'type' => 'multiple-choice', 'text' => 'What did Katherine learn from her experience?', 'options' => ['Language is useless', 'Some experiences transcend words', 'All cultures are the same', 'Silence is always better than words'], 'correctAnswer' => 'Some experiences transcend words'],
                ],
            ],
            [
                'title' => 'The Weight of Knowledge',
                'description' => 'A historian discovers that knowing the past can be a burden.',
                'level' => 'Advanced',
                'image' => 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800',
                'content' => "Dr. James Morrison was the world's leading expert on World War II. He had read every document, interviewed every surviving veteran, visited every battlefield. He knew the war in intimate, horrifying detail.\n\nAt first, this knowledge felt like a sacred trust. But as the years passed, the weight of that knowledge began to crush him.\n\nOne day, a student asked him a simple question: \"Professor, if you could go back and prevent World War II, would you?\"\n\n\"If I prevented World War II,\" he said slowly, \"I would erase millions of lives. Not just the deaths—the births too.\"\n\nHis therapist helped him understand something crucial: knowledge without wisdom is a burden.\n\n\"We study history,\" he told his students in his final lecture, \"not to find simple answers, but to understand complex questions.\"",
                'translation' => "كان الدكتور جيمس موريسون الخبير الرائد في العالم في الحرب العالمية الثانية.\n\nفي البداية، شعر بأن هذه المعرفة أمانة مقدسة. لكن مع مرور السنين، بدأ ثقل تلك المعرفة يسحقه.\n\n\"إذا منعت الحرب العالمية الثانية\"، قال ببطء، \"سأمحو ملايين الأرواح\".\n\n\"ندرس التاريخ\"، قال لطلابه، \"ليس للعثور على إجابات بسيطة، بل لفهم أسئلة معقدة.\"",
                'word_count' => 492,
                'estimated_reading_time' => 7,
                'difficulty' => 9,
                'tags' => ['history', 'philosophy', 'ethics', 'war', 'responsibility'],
                'questions' => [
                    ['id' => 'q10_1', 'type' => 'multiple-choice', 'text' => "What was Dr. Morrison's area of expertise?", 'options' => ['Ancient Rome', 'World War I', 'World War II', 'The Cold War'], 'correctAnswer' => 'World War II'],
                    ['id' => 'q10_2', 'type' => 'multiple-choice', 'text' => "Why couldn't Dr. Morrison simply say he would prevent WWII?", 'options' => ['He supported the war', 'Changing history would erase people born after 1945', 'It was impossible', "He didn't care"], 'correctAnswer' => 'Changing history would erase people born after 1945'],
                    ['id' => 'q10_3', 'type' => 'text-input', 'text' => 'According to the story, what is knowledge without wisdom?', 'correctAnswer' => 'a burden'],
                    ['id' => 'q10_4', 'type' => 'multiple-choice', 'text' => 'What did Dr. Morrison teach his students in his final lecture?', 'options' => ['History is simple', 'We should forget the past', 'History helps us make better future choices', "The past doesn't matter"], 'correctAnswer' => 'History helps us make better future choices'],
                ],
            ],
        ];

        $storiesDe = [
            [
                'title' => 'Rotkäppchen (Little Red Riding Hood)',
                'description' => 'Ein klassisches Märchen über ein kleines Mädchen.',
                'level' => 'Beginner',
                'image' => 'https://images.unsplash.com/photo-1606210122158-eeb10e0823bf?auto=format&fit=crop&q=80&w=800',
                'content' => "Es war einmal ein kleines Mädchen. Alle nannten es Rotkäppchen, weil es immer eine rote Kappe trug.\n\nEines Tages sagte die Mutter: \"Rotkäppchen, hier ist ein Korb mit Kuchen und Wein. Bring ihn der Großmutter. Sie ist krank.\"\n\nRotkäppchen ging in den Wald. Dort traf sie den Wolf. Der Wolf war sehr höflich, aber er war böse.\n\n\"Guten Tag, Rotkäppchen\", sagte der Wolf. \"Wohin gehst du?\"\n\"Zur Großmutter\", antwortete Rotkäppchen.\n\nDer Wolf rannte schnell zum Haus der Großmutter. Er fraß die Großmutter und legte sich in ihr Bett. Als Rotkäppchen kam, fragte sie: \"Großmutter, warum hast du so große Ohren?\"\n\"Damit ich dich besser hören kann!\", sagte der Wolf.\n\nAber zum Glück kam ein Jäger vorbei. Er rettete Rotkäppchen und die Großmutter. Und sie lebten glücklich bis ans Ende ihrer Tage.",
                'translation' => "كان يا ما كان هناك فتاة صغيرة. كان الجميع يسمونها ذات الرداء الأحمر، لأنها كانت ترتدي دائماً قبعة حمراء.\n\nفي أحد الأيام قالت الأم: \"ذات الرداء الأحمر، هذه سلة بها كعك ونبيذ. خذيها للجدة. إنها مريضة.\"\n\nذهبت ذات الرداء الأحمر إلى الغابة. هناك التقت بالذئب. كان الذئب مهذباً جداً، لكنه كان شريراً.\n\nقال الذئب: \"طاب يومك يا ذات الرداء الأحمر. إلى أين تذهبين؟\"\nأجابت: \"إلى الجدة\".\n\nلحسن الحظ مر صياد. أنقذ ذات الرداء الأحمر والجدة. وعاشوا في سعادة دائمة.",
                'questions' => [],
            ],
            [
                'title' => 'Der faule Hans (Lazy Hans)',
                'description' => 'Eine Geschichte über Arbeit.',
                'level' => 'Beginner',
                'image' => 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
                'content' => "Hans war ein sehr fauler Junge. Er schlief gerne lange. Sein Vater arbeitete hart.\n\nEines Tages sagte der Vater: \"Hans, hilf mir bitte.\" Hans sagte: \"Ich bin zu müde.\"\n\nAber dann lernte Hans eine Lektion. Arbeit macht stark und glücklich. Er begann zu arbeiten und fühlte sich gut.\n\nEnde gut, alles gut.",
                'translation' => "كان هانز فتى كسولاً جداً. كان يحب النوم طويلاً. كان والده يعمل بجد.\n\nفي أحد الأيام قال الأب: \"هانز، ساعدني من فضلك.\" قال هانز: \"أنا متعب جداً.\"\n\nولكن بعد ذلك تعلم هانز درساً. العمل يجعلك قوياً وسعيداً. بدأ العمل وشعر بالرضا.\n\nالنهاية السعيدة.",
                'questions' => [],
            ],
        ];

        $this->seedLang('en', $storiesEn);
        $this->seedLang('de', $storiesDe);
    }

    private function seedLang(string $lang, array $stories): void
    {
        foreach ($stories as $s) {
            Story::query()->updateOrCreate(
                ['lang' => $lang, 'title' => $s['title']],
                [
                    'lang' => $lang,
                    'title' => $s['title'],
                    'description' => $s['description'],
                    'content' => $s['content'],
                    'translation' => $s['translation'] ?? null,
                    'image' => $s['image'] ?? null,
                    'level' => $s['level'] ?? 'A1',
                    'sub_level' => $s['sub_level'] ?? null,
                    'questions' => $s['questions'] ?? [],
                    'tags' => $s['tags'] ?? null,
                    'word_count' => $s['word_count'] ?? null,
                    'estimated_reading_time' => $s['estimated_reading_time'] ?? null,
                    'difficulty' => $s['difficulty'] ?? null,
                    'is_active' => true,
                ]
            );
        }
    }
}

