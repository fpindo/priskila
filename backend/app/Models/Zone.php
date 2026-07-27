<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class Zone extends Model
{
    use Auditable;

    protected $fillable = ['warehouse_id', 'code', 'name'];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function racks(): HasMany
    {
        return $this->hasMany(Rack::class);
    }
}
