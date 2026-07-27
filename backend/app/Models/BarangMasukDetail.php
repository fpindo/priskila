<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['barang_masuk_id', 'barang_id', 'jumlah', 'harga_satuan', 'catatan'])]
class BarangMasukDetail extends Model
{
    protected $table = 'barang_masuk_detail';
    
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'harga_satuan' => 'decimal:2',
            'jumlah' => 'integer',
        ];
    }

    public function barang(): BelongsTo
    {
        return $this->belongsTo(Barang::class, 'barang_id');
    }

    public function barangMasuk(): BelongsTo
    {
        return $this->belongsTo(BarangMasuk::class, 'barang_masuk_id');
    }
}
