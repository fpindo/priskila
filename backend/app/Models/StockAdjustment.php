<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class StockAdjustment extends Model
{
    use Auditable;

    protected $table = 'stock_adjustments';

    protected $fillable = [
        'nomor_dokumen',
        'tanggal_adjustment',
        'gudang_id',
        'catatan',
        'created_by',
    ];

    protected $casts = [
        'tanggal_adjustment' => 'date',
    ];

    public function gudang(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'gudang_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(StockAdjustmentDetail::class, 'stock_adjustment_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
