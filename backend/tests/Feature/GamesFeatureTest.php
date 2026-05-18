<?php

namespace Tests\Feature;

use App\Models\AdminUser;
use App\Models\GameAttempt;
use App\Models\GameQuestion;
use App\Models\GameSet;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GamesFeatureTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->rebuildTables();
        $this->seedGameSet();
    }

    private function rebuildTables(): void
    {
        Schema::dropIfExists('game_attempts');
        Schema::dropIfExists('game_questions');
        Schema::dropIfExists('game_sets');
        Schema::dropIfExists('user_daily_activity');
        Schema::dropIfExists('admin_users');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('plan', 32)->default('free');
            $table->timestamp('plan_subscribed_at')->nullable();
            $table->timestamp('plan_expires_at')->nullable();
            $table->string('target_language', 2)->nullable();
            $table->string('avatar')->nullable();
            $table->unsignedTinyInteger('age')->nullable();
            $table->string('gender', 32)->nullable();
            $table->string('start_level', 32)->nullable();
            $table->boolean('is_frozen')->default(false);
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('admin_users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('user_daily_activity', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->date('activity_on');
            $table->timestamps();
        });

        Schema::create('game_sets', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('lang', 2);
            $table->string('type', 32);
            $table->string('title');
            $table->string('description', 1024)->default('');
            $table->string('level', 32)->default('A1');
            $table->string('sub_level', 16)->nullable();
            $table->string('icon', 64)->nullable();
            $table->string('color', 64)->default('indigo');
            $table->unsignedSmallInteger('xp_reward')->default(120);
            $table->unsignedSmallInteger('time_limit_seconds')->default(90);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('game_questions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('game_set_id');
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
        });

        Schema::create('game_attempts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id');
            $table->string('game_set_id');
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
        });
    }

    private function seedGameSet(): void
    {
        GameSet::query()->create([
            'id' => 'game_en_word_match_a1',
            'lang' => 'en',
            'type' => 'word_match',
            'title' => 'Word Match Sprint',
            'description' => 'Starter word matching game',
            'level' => 'A1',
            'sub_level' => 'A1.1',
            'icon' => 'Puzzle',
            'color' => 'blue',
            'xp_reward' => 120,
            'time_limit_seconds' => 75,
            'is_active' => true,
        ]);

        foreach ([
            ['id' => 'game_en_word_match_a1_q1', 'prompt' => 'Train', 'answer' => 'قطار', 'options' => ['قطار', 'طائرة', 'سيارة']],
            ['id' => 'game_en_word_match_a1_q2', 'prompt' => 'Water', 'answer' => 'ماء', 'options' => ['ماء', 'باب', 'قلم']],
        ] as $index => $question) {
            GameQuestion::query()->create([
                'id' => $question['id'],
                'game_set_id' => 'game_en_word_match_a1',
                'prompt' => $question['prompt'],
                'answer' => $question['answer'],
                'translation' => $question['answer'],
                'options' => $question['options'],
                'tokens' => [],
                'audio_text' => null,
                'explanation' => null,
                'sort_order' => $index + 1,
                'is_active' => true,
            ]);
        }
    }

    public function test_public_games_only_returns_active_sets(): void
    {
        $inactive = GameSet::query()->where('lang', 'en')->firstOrFail();
        $inactive->update(['is_active' => false]);

        $response = $this->getJson('/api/content/en/games')
            ->assertOk()
            ->assertJsonStructure(['games']);

        $ids = collect($response->json('games'))->pluck('id');
        $this->assertFalse($ids->contains($inactive->id));
    }

    public function test_daily_attempt_limits_are_enforced_and_counted_on_start(): void
    {
        $game = GameSet::query()->where('lang', 'en')->where('is_active', true)->firstOrFail();

        $free = User::factory()->create(['plan' => 'free']);
        Sanctum::actingAs($free);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson("/api/user/games/{$game->id}/start")->assertOk();
        }
        $this->postJson("/api/user/games/{$game->id}/start")
            ->assertStatus(429)
            ->assertJsonPath('code', 'game_limit_reached');
        $this->assertSame(5, GameAttempt::query()->where('user_id', $free->id)->count());

        $silver = User::factory()->create(['plan' => 'silver']);
        Sanctum::actingAs($silver);
        for ($i = 0; $i < 25; $i++) {
            $this->postJson("/api/user/games/{$game->id}/start")->assertOk();
        }
        $this->postJson("/api/user/games/{$game->id}/start")->assertStatus(429);

        foreach (['pro', 'enterprise'] as $plan) {
            $user = User::factory()->create(['plan' => $plan]);
            Sanctum::actingAs($user);
            for ($i = 0; $i < 30; $i++) {
                $this->postJson("/api/user/games/{$game->id}/start")->assertOk();
            }
        }
    }

    public function test_user_cannot_complete_another_users_attempt(): void
    {
        $game = GameSet::query()->where('lang', 'en')->where('is_active', true)->firstOrFail();
        $owner = User::factory()->create();
        $other = User::factory()->create();

        Sanctum::actingAs($owner);
        $attemptId = $this->postJson("/api/user/games/{$game->id}/start")
            ->assertOk()
            ->json('attempt.id');

        Sanctum::actingAs($other);
        $this->postJson("/api/user/games/attempts/{$attemptId}/complete", ['answers' => []])
            ->assertForbidden();
    }

    public function test_completing_game_attempt_saves_score_and_xp(): void
    {
        $game = GameSet::query()->where('lang', 'en')->where('is_active', true)->firstOrFail();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $start = $this->postJson("/api/user/games/{$game->id}/start")
            ->assertOk()
            ->json();

        $answers = collect($start['game']['questions'])
            ->map(fn (array $question) => [
                'questionId' => $question['id'],
                'answer' => $question['answer'],
            ])
            ->values()
            ->all();

        $this->postJson("/api/user/games/attempts/{$start['attempt']['id']}/complete", ['answers' => $answers])
            ->assertOk()
            ->assertJsonPath('attempt.score', 100)
            ->assertJsonPath('attempt.correctCount', count($answers))
            ->assertJsonPath('attempt.xpEarned', (int) $game->xp_reward);
    }

    public function test_admin_can_create_update_and_delete_game_with_questions(): void
    {
        $admin = AdminUser::query()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);
        Sanctum::actingAs($admin);

        $payload = [
            'id' => 'test_admin_game_set',
            'type' => 'word_match',
            'title' => 'Admin Game',
            'description' => 'Managed from dashboard',
            'level' => 'A1',
            'subLevel' => 'A1.1',
            'color' => 'indigo',
            'xpReward' => 80,
            'timeLimitSeconds' => 60,
            'isActive' => true,
            'questions' => [
                [
                    'id' => 'test_admin_game_set_q1',
                    'prompt' => 'Train',
                    'answer' => 'قطار',
                    'options' => ['قطار', 'طائرة', 'سيارة'],
                    'sortOrder' => 1,
                    'isActive' => true,
                ],
            ],
        ];

        $this->postJson('/api/admin/content/en/games', $payload)
            ->assertOk()
            ->assertJsonPath('game.title', 'Admin Game')
            ->assertJsonCount(1, 'game.questions');

        $this->putJson('/api/admin/content/en/games/test_admin_game_set', [
            ...$payload,
            'title' => 'Updated Admin Game',
            'questions' => [
                [
                    'id' => 'test_admin_game_set_q2',
                    'prompt' => 'Water',
                    'answer' => 'ماء',
                    'options' => ['ماء', 'باب', 'قلم'],
                    'sortOrder' => 1,
                    'isActive' => true,
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('game.title', 'Updated Admin Game')
            ->assertJsonPath('game.questions.0.answer', 'ماء');

        $this->deleteJson('/api/admin/content/en/games/test_admin_game_set')
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseMissing('game_sets', ['id' => 'test_admin_game_set']);
    }
}
