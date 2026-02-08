<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'buyer_id',
        'seller_id',
        'rating',
        'comment',
        'has_offensive_language',
        'is_hidden_by_admin',
        'hidden_at',
        'hidden_by_admin_id',
        'hide_reason',
    ];

    protected $casts = [
        'hidden_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function hiddenByAdmin()
    {
        return $this->belongsTo(User::class, 'hidden_by_admin_id');
    }
}
