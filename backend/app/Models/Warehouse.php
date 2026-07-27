<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class Warehouse extends Model
{
    use Auditable;

    protected $table = 'warehouses';

    protected $fillable = [
        'kode_gudang',
        'nama_gudang',
        'alamat',
    ];

    public function stockLedgers(): HasMany
    {
        return $this->hasMany(StockLedger::class, 'gudang_id');
    }
}
