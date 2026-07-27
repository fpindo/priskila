<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class Shelf extends Model
{
    use Auditable;

    protected $fillable = ['rack_id', 'code', 'name'];

    public function rack(): BelongsTo
    {
        return $this->belongsTo(Rack::class);
    }

    public function bins(): HasMany
    {
        return $this->hasMany(Bin::class);
    }
}
