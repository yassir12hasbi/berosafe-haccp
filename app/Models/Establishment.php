<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Establishment extends Model
{
    protected $fillable = [
    'name',
    'type',
    'address',
    'city',
    'phone',
    'email',
    'status'
];
}
