<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class StockOpname extends Model
{
    use Auditable;

    protected $table = 'stock_opnames';

    protected $fillable = [
        'nomor_dokumen',
        'tanggal_opname',
        'gudang_id',
        'catatan',
        'status',
        'created_by',
    ];

    protected $casts = [
        'tanggal_opname' => 'date',
    ];

    public function gudang(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'gudang_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(StockOpnameDetail::class, 'stock_opname_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
