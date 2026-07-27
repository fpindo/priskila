<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class GudangTransfer extends Model
{
    use Auditable;

    protected $table = 'gudang_transfers';

    protected $fillable = [
        'nomor_dokumen',
        'tanggal_transfer',
        'gudang_asal_id',
        'gudang_tujuan_id',
        'catatan',
        'status',
        'created_by',
        'approved_by',
    ];

    protected $casts = [
        'tanggal_transfer' => 'date',
    ];

    public function gudangAsal(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'gudang_asal_id');
    }

    public function gudangTujuan(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'gudang_tujuan_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(GudangTransferDetail::class, 'gudang_transfer_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
