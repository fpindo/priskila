<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['pemakaian_barang_id', 'barang_id', 'jumlah', 'catatan'])]
class PemakaianBarangDetail extends Model
{
    protected $table = 'pemakaian_barang_detail';

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'jumlah' => 'integer',
        ];
    }

    public function barang(): BelongsTo
    {
        return $this->belongsTo(Barang::class, 'barang_id');
    }

    public function pemakaianBarang(): BelongsTo
    {
        return $this->belongsTo(PemakaianBarang::class, 'pemakaian_barang_id');
    }
}
