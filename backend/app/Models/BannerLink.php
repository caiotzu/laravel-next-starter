<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BannerLink extends Model
{
    use HasUuids;

    protected $table = 'banner_links';

    protected $fillable = [
        'id',
        'banner_id',
        'nome',
        'url',
        'ordem',
    ];

    protected $casts = [
        'ordem' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function banner(): BelongsTo
    {
        return $this->belongsTo(Banner::class, 'banner_id', 'id');
    }
}
