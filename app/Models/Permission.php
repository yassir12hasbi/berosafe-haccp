<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description'
    ];

    // Relation avec les utilisateurs
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_permissions');
    }
}