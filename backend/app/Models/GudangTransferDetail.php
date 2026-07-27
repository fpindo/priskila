<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GudangTransferDetail extends Model
{
    protected $table = 'gudang_transfer_details';

    protected $fillable = [
        'gudang_transfer_id',
        'barang_id',
        'jumlah',
    ];

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(GudangTransfer::class, 'gudang_transfer_id');
    }

    public function barang(): BelongsTo
    {
        return $this->belongsTo(Barang::class, 'barang_id');
    }
}
