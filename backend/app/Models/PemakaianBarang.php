<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Traits\Auditable;

#[Fillable(['nomor_dokumen', 'tanggal_pemakaian', 'project_id', 'keterangan', 'status_approval', 'approved_by', 'created_by'])]
class PemakaianBarang extends Model
{
    use Auditable;
    protected $table = 'pemakaian_barang';

    protected function casts(): array
    {
        return [
            'tanggal_pemakaian' => 'date',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function details(): HasMany
    {
        return $this->hasMany(PemakaianBarangDetail::class, 'pemakaian_barang_id');
    }
}
