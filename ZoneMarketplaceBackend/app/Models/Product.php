<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'price',
        'location',
        'category',
        'images',
        'sold',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'images' => 'array',
        'sold' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getImagesArrayAttribute()
    {
        $images = $this->getAttribute('images');

        if (is_array($images)) {
            return $images;
        }
        if (is_string($images)) {
            return json_decode($images, true) ?? [];
        }
        return [];
    }
}
