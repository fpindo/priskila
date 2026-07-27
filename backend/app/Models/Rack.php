<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class Rack extends Model
{
    use Auditable;

    protected $fillable = ['zone_id', 'code', 'name'];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function shelves(): HasMany
    {
        return $this->hasMany(Shelf::class);
    }
}
