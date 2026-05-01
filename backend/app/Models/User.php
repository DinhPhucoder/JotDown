<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'avatar', 'preferences', 'otp', 'otp_expires_at'])]
#[Hidden(['password', 'remember_token', 'otp'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $appends = ['avatar_url'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'otp_expires_at' => 'datetime',
            'password' => 'hashed',
            'preferences' => 'array',
        ];
    }


    /**
     * Generate a 6-digit OTP and set expiry (5 minutes).
     */
    public function generateOtp(): string
    {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->update([
            'otp' => $otp,
            'otp_expires_at' => now()->addMinutes(5),
        ]);
        return $otp;
    }

    /**
     * Verify a given OTP code.
     */
    public function verifyOtp(string $code): bool
    {
        return $this->otp === $code
            && $this->otp_expires_at
            && $this->otp_expires_at->isFuture();
    }

    /**
     * Clear OTP after successful verification.
     */
    public function clearOtp(): void
    {
        $this->update([
            'otp' => null,
            'otp_expires_at' => null,
        ]);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    public function sharedNotes(): HasMany
    {
        return $this->hasMany(NoteShare::class, 'sender_id');
    }

    public function receivedShares(): HasMany
    {
        return $this->hasMany(NoteShare::class, 'receiver_id');
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar) {
            return null;
        }

        if (str_starts_with($this->avatar, 'http')) {
            return $this->avatar;
        }

        return asset('storage/' . $this->avatar);
    }
}
