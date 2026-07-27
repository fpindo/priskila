<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class DeliveryOrder extends Model
{
    use Auditable;

    protected $table = 'delivery_orders';

    protected $fillable = [
        'nomor_dokumen',
        'tanggal_delivery',
        'pemakaian_barang_id',
        'project_id',
        'nama_penerima',
        'alamat_tujuan',
        'catatan',
        'verification_token',
        'status',
        'signature_path',
        'delivered_at',
        'created_by',
    ];

    protected $casts = [
        'tanggal_delivery' => 'date',
        'delivered_at' => 'datetime',
    ];

    public function pemakaianBarang(): BelongsTo
    {
        return $this->belongsTo(PemakaianBarang::class, 'pemakaian_barang_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(DeliveryOrderDetail::class, 'delivery_order_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(DeliveryPhoto::class, 'delivery_order_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
