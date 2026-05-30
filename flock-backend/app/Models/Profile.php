<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    protected $fillable = [
        'user_id',
        'username',
        'display_name',
        'bio',
        'avatar',
        'website',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
