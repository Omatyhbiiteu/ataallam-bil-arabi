<?php

namespace Tests\Feature;

use App\Models\AdminUser;
use App\Models\CurriculumModule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LessonRatingsFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_rating_is_saved_and_visible_to_admin_analytics(): void
    {
        CurriculumModule::query()->create([
            'lang' => 'en',
            'title' => 'A1 Basics',
            'level' => 'A1',
            'sub_level' => 'A1.1',
            'lessons' => [
                [
                    'id' => 'lesson-rating-test',
                    'title' => 'Greetings',
                    'description' => 'Starter lesson',
                    'duration' => '10 min',
                ],
            ],
            'is_active' => true,
        ]);

        foreach ([5, 5, 4, 3, 1] as $rating) {
            Sanctum::actingAs(User::factory()->create());
            $this->postJson('/api/user/lesson-ratings', [
                'lang' => 'en',
                'lessonId' => 'lesson-rating-test',
                'rating' => $rating,
            ])->assertOk();
        }

        $this->assertDatabaseCount('lesson_ratings', 5);

        $admin = AdminUser::query()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);
        Sanctum::actingAs($admin);

        $curriculum = $this->getJson('/api/admin/content/en/curriculum')
            ->assertOk()
            ->json('modules.0.lessons.0.ratingSummary');

        $this->assertSame(5, $curriculum['ratingsCount']);
        $this->assertSame(3.6, $curriculum['averageRating']);
        $this->assertSame('average', $curriculum['satisfaction']['status']);

        $analytics = $this->getJson('/api/admin/analytics/dashboard?lang=en')
            ->assertOk()
            ->json('lessonRatings');

        $this->assertSame(5, $analytics['overview']['totalRatings']);
        $this->assertSame(1, $analytics['overview']['ratedLessons']);
        $this->assertSame(2, $analytics['lessons'][0]['distribution']['5']);
        $this->assertSame('average', $analytics['lessons'][0]['satisfaction']['status']);
    }
}
