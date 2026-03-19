<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['name','description'];

    // Relation inverse si nécessaire
    public function users()
    {
        return $this->hasMany(User::class);
    }
}