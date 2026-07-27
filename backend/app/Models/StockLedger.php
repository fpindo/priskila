<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['barang_id', 'project_id', 'tipe_transaksi', 'referensi_id', 'jumlah', 'saldo_stock'])]
class StockLedger extends Model
{
    protected $table = 'stock_ledgers';

    public $timestamps = false; // only uses created_at timestamp set by DB default

    protected function casts(): array
    {
        return [
            'jumlah' => 'integer',
            'saldo_stock' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function barang(): BelongsTo
    {
        return $this->belongsTo(Barang::class, 'barang_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }
}
