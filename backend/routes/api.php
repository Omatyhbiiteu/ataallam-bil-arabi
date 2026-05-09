<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminAppUserController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminNotificationController;
use App\Http\Controllers\Api\AdminBroadcastNotificationController;
use App\Http\Controllers\Api\AdminSupportTicketController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminMarketingController;
use App\Http\Controllers\Api\AdminInspirationalController;
use App\Http\Controllers\Api\MarketingController;
use App\Http\Controllers\Api\PaymentsController;
use App\Http\Controllers\Api\PaymentSettingsController;
use App\Http\Controllers\Api\StoriesController;
use App\Http\Controllers\Api\AdminStoriesController;
use App\Http\Controllers\Api\CurriculumController;
use App\Http\Controllers\Api\AdminCurriculumController;
use App\Http\Controllers\Api\AdminMediaUploadController;
use App\Http\Controllers\Api\AdminSentencesController;
use App\Http\Controllers\Api\SentencesController;
use App\Http\Controllers\Api\FolderController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\AdminFolderController;
use App\Http\Controllers\Api\AdminCardController;
use App\Http\Controllers\Api\UserAuthController;
use App\Http\Controllers\Api\UserCardController;
use App\Http\Controllers\Api\UserFolderController;
use App\Http\Controllers\Api\UserNotificationController;
use App\Http\Controllers\Api\UserSupportTicketController;
use App\Http\Controllers\Api\LanguageAvailabilityController;
use App\Http\Controllers\Api\AdminAnalyticsController;
use App\Http\Controllers\Api\StoryQuizAttemptController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\PasswordRecoveryRequestController;
use App\Http\Controllers\Api\AdminPasswordRecoveryRequestController;

Route::get('/health', function () {
    return response()->json([
        'ok' => true,
        'service' => 'Laravel API',
    ]);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('auth')->group(function () {
    Route::post('/register', [UserAuthController::class, 'register']);
    Route::post('/login', [UserAuthController::class, 'login']);
    Route::post('/social-register', [UserAuthController::class, 'socialRegister']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [UserAuthController::class, 'logout']);
        Route::get('/me', [UserAuthController::class, 'me']);
        Route::put('/profile', [UserAuthController::class, 'updateProfile']);
        Route::delete('/account', [UserAuthController::class, 'deleteAccount']);
        Route::get('/notifications', [UserNotificationController::class, 'index']);
        Route::put('/notifications/read', [UserNotificationController::class, 'markRead']);
    });
});

Route::middleware('auth:sanctum')->prefix('user')->group(function () {
    Route::post('/story-quiz-attempts', [StoryQuizAttemptController::class, 'store']);
    Route::post('/community/{lang}/sync', [CommunityController::class, 'sync']);
    Route::get('/community/{lang}', [CommunityController::class, 'show']);
});

Route::middleware('auth:sanctum')->prefix('support')->group(function () {
    Route::get('/tickets', [UserSupportTicketController::class, 'index']);
    Route::post('/tickets', [UserSupportTicketController::class, 'store']);
    Route::post('/tickets/{ticket}/messages', [UserSupportTicketController::class, 'addMessage']);
});

// محتوى المستخدم: مجلدات وبطاقات خاصة (يتطلب تسجيل دخول مستخدم التطبيق — ليس مسئول)
Route::middleware('auth:sanctum')->prefix('user/content/{lang}')->group(function () {
    Route::post('/folders', [UserFolderController::class, 'store']);
    Route::put('/folders/{folderId}', [UserFolderController::class, 'update']);
    Route::delete('/folders/{folderId}', [UserFolderController::class, 'destroy']);
    Route::delete('/folders-all-mine', [UserFolderController::class, 'destroyAllMine']);

    Route::post('/cards', [UserCardController::class, 'store']);
    Route::put('/cards/{cardId}', [UserCardController::class, 'update']);
    Route::delete('/cards/{cardId}', [UserCardController::class, 'destroy']);
});

// ---------------------------
// Marketing (Public APIs)
// ---------------------------
Route::get('/marketing/coupons', [MarketingController::class, 'coupons']);
Route::get('/marketing/banners', [MarketingController::class, 'banners']);
Route::get('/marketing/inspirational', [MarketingController::class, 'inspirational']);

// ---------------------------
// Content (Public APIs)
// ---------------------------
Route::get('/content/{lang}/stories', [StoriesController::class, 'index']);
Route::get('/content/{lang}/stories/{story}', [StoriesController::class, 'show']);
Route::get('/content/{lang}/curriculum', [CurriculumController::class, 'index']);
Route::get('/content/{lang}/curriculum/{module}', [CurriculumController::class, 'show']);
Route::get('/content/{lang}/sentences', [SentencesController::class, 'index']);
Route::get('/content/{lang}/folders', [FolderController::class, 'index']);
Route::get('/content/{lang}/cards', [CardController::class, 'index']);

// ---------------------------
// Payments
// ---------------------------
Route::post('/payments/verify-coupon', [PaymentsController::class, 'verifyCoupon']);
Route::get('/payment-settings', [PaymentSettingsController::class, 'public']);

// ---------------------------
// Platform Settings (Public)
// ---------------------------
Route::get('/settings/language-availability', [LanguageAvailabilityController::class, 'public']);

Route::middleware('throttle:15,1')->post('/password-recovery-requests', [PasswordRecoveryRequestController::class, 'store']);

Route::prefix('admin')->group(function () {
    Route::post('/auth/login', [AdminAuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AdminAuthController::class, 'logout']);

        Route::get('/notifications', [AdminNotificationController::class, 'index']);
        Route::put('/notifications/read', [AdminNotificationController::class, 'markRead']);
        Route::put('/notifications/read-all', [AdminNotificationController::class, 'markAllRead']);

        // Broadcasts (إشعارات التسويق/الطلاب) -> تُرسل للمستخدمين في user_notifications
        Route::get('/broadcasts', [AdminBroadcastNotificationController::class, 'index']);
        Route::post('/broadcasts', [AdminBroadcastNotificationController::class, 'store']);
        Route::delete('/broadcasts/{broadcast}', [AdminBroadcastNotificationController::class, 'destroy']);

        Route::get('/admin-users', [AdminUserController::class, 'index']);
        Route::post('/admin-users', [AdminUserController::class, 'store']);
        Route::put('/admin-users/me/password', [AdminUserController::class, 'updatePassword']);
        Route::put('/admin-users/{adminUser}/password', [AdminUserController::class, 'resetPassword']);
        Route::delete('/admin-users/{adminUser}', [AdminUserController::class, 'destroy']);

        Route::get('/password-recovery-requests', [AdminPasswordRecoveryRequestController::class, 'index']);

        Route::get('/users', [AdminAppUserController::class, 'index']);
        Route::put('/users/{user}/plan', [AdminAppUserController::class, 'updatePlan']);
        Route::put('/users/{user}/toggle-freeze', [AdminAppUserController::class, 'toggleFreeze']);
        Route::put('/users/{user}/password', [AdminAppUserController::class, 'updatePassword']);

        Route::get('/support/tickets', [AdminSupportTicketController::class, 'index']);
        Route::put('/support/tickets/{ticket}', [AdminSupportTicketController::class, 'update']);
        Route::post('/support/tickets/{ticket}/messages', [AdminSupportTicketController::class, 'addMessage']);

        // ---------------------------
        // Admin Marketing Mgmt
        // ---------------------------
        Route::post('/coupons', [AdminMarketingController::class, 'createCoupon']);
        Route::put('/coupons/{coupon}', [AdminMarketingController::class, 'updateCoupon']);
        Route::delete('/coupons/{coupon}', [AdminMarketingController::class, 'deleteCoupon']);

        Route::post('/banners', [AdminMarketingController::class, 'createBanner']);
        Route::put('/banners/{banner}', [AdminMarketingController::class, 'updateBanner']);
        Route::delete('/banners/{banner}', [AdminMarketingController::class, 'deleteBanner']);

        // Inspirational bar (الشريط الإلهامي)
        Route::get('/inspirational', [AdminInspirationalController::class, 'index']);
        Route::post('/inspirational', [AdminInspirationalController::class, 'store']);
        Route::put('/inspirational/{slide}', [AdminInspirationalController::class, 'update']);
        Route::delete('/inspirational/{slide}', [AdminInspirationalController::class, 'destroy']);

        // Stories (القصص)
        Route::get('/content/{lang}/stories', [AdminStoriesController::class, 'index']);
        Route::post('/content/{lang}/stories', [AdminStoriesController::class, 'store']);
        Route::put('/content/{lang}/stories/{story}', [AdminStoriesController::class, 'update']);
        Route::delete('/content/{lang}/stories/{story}', [AdminStoriesController::class, 'destroy']);

        // رفع وسائط المنهج (ملفات على القرص — الرابط فقط في قاعدة البيانات)
        Route::post('/media/upload', [AdminMediaUploadController::class, 'store']);

        // Curriculum (المنهج)
        Route::get('/content/{lang}/curriculum', [AdminCurriculumController::class, 'index']);
        Route::post('/content/{lang}/curriculum', [AdminCurriculumController::class, 'store']);
        Route::put('/content/{lang}/curriculum/{module}', [AdminCurriculumController::class, 'update']);
        Route::delete('/content/{lang}/curriculum/{module}', [AdminCurriculumController::class, 'destroy']);

        // Sentence topics (المواقف الحياتية / الجمل)
        Route::get('/content/{lang}/sentences', [AdminSentencesController::class, 'index']);
        Route::post('/content/{lang}/sentences', [AdminSentencesController::class, 'store']);
        Route::put('/content/{lang}/sentences/{sentenceTopic}', [AdminSentencesController::class, 'update']);
        Route::delete('/content/{lang}/sentences/{sentenceTopic}', [AdminSentencesController::class, 'destroy']);

        // Folders & Cards (المجلدات والبطاقات)
        Route::get('/content/{lang}/folders', [AdminFolderController::class, 'index']);
        Route::post('/content/{lang}/folders', [AdminFolderController::class, 'store']);
        Route::put('/content/{lang}/folders/{folderId}', [AdminFolderController::class, 'update']);
        Route::delete('/content/{lang}/folders/{folderId}', [AdminFolderController::class, 'destroy']);

        Route::get('/content/{lang}/cards', [AdminCardController::class, 'index']);
        Route::post('/content/{lang}/cards', [AdminCardController::class, 'store']);
        Route::put('/content/{lang}/cards/{cardId}', [AdminCardController::class, 'update']);
        Route::delete('/content/{lang}/cards/{cardId}', [AdminCardController::class, 'destroy']);

        Route::get('/payment-settings', [PaymentSettingsController::class, 'adminShow']);
        Route::put('/payment-settings', [PaymentSettingsController::class, 'adminUpdate']);

        // Settings
        Route::get('/settings/language-availability', [LanguageAvailabilityController::class, 'adminShow']);
        Route::put('/settings/language-availability', [LanguageAvailabilityController::class, 'adminUpdate']);

        Route::get('/analytics/dashboard', [AdminAnalyticsController::class, 'dashboard']);
    });
});

// create-session يحتاج لتسجيل دخول المستخدم
Route::middleware('auth:sanctum')->post('/payments/create-session', [PaymentsController::class, 'createSession']);
