<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\Auditable;

#[Fillable(['sku', 'barcode', 'nama_barang', 'deskripsi', 'kategori', 'satuan', 'min_stock', 'image_url', 'bin_id'])]
class Barang extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $table = 'barang';

    protected $appends = ['current_stock', 'effective_min_stock'];

    public function bin(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Bin::class, 'bin_id');
    }

    /**
     * Get the dynamic current stock balance.
     */
    public function getCurrentStockAttribute(): int
    {
        return $this->stockLedgers()->sum('jumlah');
    }

    /**
     * Get the effective minimum stock.
     */
    public function getEffectiveMinStockAttribute(): int
    {
        if ($this->min_stock > 0) {
            return $this->min_stock;
        }
        $globalMin = \App\Models\Setting::getConfig('min_stock_global');
        return (int) ($globalMin['min_stock'] ?? 0);
    }

    /**
     * Relationship with StockLedger.
     */
    public function stockLedgers(): HasMany
    {
        return $this->hasMany(StockLedger::class, 'barang_id');
    }

    /**
     * Relationship with KonversiSatuan.
     */
    public function conversions(): HasMany
    {
        return $this->hasMany(KonversiSatuan::class, 'barang_id');
    }
}
