<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Supplier extends Model
{
    use HasFactory;

    // Champs remplissables
    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'city',
    ];

    // Relation avec les produits
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}