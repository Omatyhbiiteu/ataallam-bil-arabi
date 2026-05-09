<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'plan',
        'plan_subscribed_at',
        'plan_expires_at',
        'target_language',
        'avatar',
        'age',
        'gender',
        'start_level',
        'is_frozen',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_frozen' => 'boolean',
            'plan_subscribed_at' => 'datetime',
            'plan_expires_at' => 'datetime',
        ];
    }

    /** خطط مدفوعة نشطة (Pro / Enterprise) مع احترام تاريخ الانتهاء إن وُجد */
    public function hasActivePaidPlan(): bool
    {
        $plan = $this->plan ?? 'free';
        if (! in_array($plan, ['silver', 'pro', 'enterprise'], true)) {
            return false;
        }
        $expires = $this->plan_expires_at;
        if ($expires === null) {
            return true;
        }

        return $expires->isFuture();
    }
}
