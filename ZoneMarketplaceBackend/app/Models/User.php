<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'city',
        'location',
        'password',
        'role',
        'account_status',
        'ban_expires_at',
        'ban_reason',
        'successful_transactions',
        'last_activity_at',
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
            'ban_expires_at' => 'datetime',
            'last_activity_at' => 'datetime',
        ];
    }

    /**
     * Relaciones
     */
    public function reviews()
    {
        return $this->hasMany(Review::class, 'buyer_id');
    }

    public function givenReviews()
    {
        return $this->hasMany(Review::class, 'seller_id');
    }

    public function sentDisputes()
    {
        return $this->hasMany(Dispute::class, 'buyer_id');
    }

    public function receivedDisputes()
    {
        return $this->hasMany(Dispute::class, 'seller_id');
    }

    public function adminLogs()
    {
        return $this->hasMany(AdminLog::class);
    }

    public function accessLogs()
    {
        return $this->hasMany(UserAccessLog::class);
    }

    /**
     * Verificar si usuario es admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Verificar si usuario está activo
     */
    public function isActive(): bool
    {
        return $this->account_status === 'active';
    }

    /**
     * Verificar si usuario está baneado
     */
    public function isBanned(): bool
    {
        if ($this->account_status === 'banned_perm') {
            return true;
        }
        
        if ($this->account_status === 'banned_temp' && $this->ban_expires_at) {
            return now()->lessThan($this->ban_expires_at);
        }
        
        return false;
    }

    /**
     * Actualizar última actividad
     */
    public function updateLastActivity()
    {
        $this->update(['last_activity_at' => now()]);
    }

    /**
     * Accessor para generar URL dinámica del avatar cuando se accede
     */
    public function getAvatarAttribute($value)
    {
        if (!$value) {
            return null;
        }
        
        // Si ya es una URL completa, reemplazar solo el host con el actual
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            if (app()->runningInConsole() || !request()) {
                return $value;
            }
            $currentHost = request()->getSchemeAndHttpHost();
            $parsedUrl = parse_url($value);
            if (isset($parsedUrl['path'])) {
                return $currentHost . $parsedUrl['path'];
            }
            return $value;
        }
        
        // Si es una ruta relativa, construir URL completa
        if (!app()->runningInConsole() && request()) {
            return request()->getSchemeAndHttpHost() . '/storage/' . ltrim($value, '/');
        }
        
        return $value;
    }
}
