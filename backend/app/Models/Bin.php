<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class Bin extends Model
{
    use Auditable;

    protected $table = 'bins';

    protected $fillable = ['shelf_id', 'code', 'name'];

    protected $appends = ['full_path'];

    public function shelf(): BelongsTo
    {
        return $this->belongsTo(Shelf::class);
    }

    public function barang(): HasMany
    {
        return $this->hasMany(Barang::class);
    }

    // Helper to get the full formatted hierarchy path
    public function getFullPathAttribute(): string
    {
        $shelf = $this->shelf;
        $rack = $shelf ? $shelf->rack : null;
        $zone = $rack ? $rack->zone : null;
        $warehouse = $zone ? $zone->warehouse : null;

        $parts = [];
        if ($warehouse) $parts[] = $warehouse->nama_gudang;
        if ($zone) $parts[] = "Zone " . $zone->name;
        if ($rack) $parts[] = "Rack " . $rack->name;
        if ($shelf) $parts[] = "Shelf " . $shelf->name;
        $parts[] = "Bin " . $this->name;

        return implode(' - ', $parts);
    }
}
