<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['barang_id', 'from_unit', 'to_unit', 'factor'])]
class KonversiSatuan extends Model
{
    protected $table = 'konversi_satuans';

    protected $casts = [
        'factor' => 'double',
    ];

    /**
     * Get the item associated with this conversion.
     */
    public function barang(): BelongsTo
    {
        return $this->belongsTo(Barang::class, 'barang_id');
    }
}
