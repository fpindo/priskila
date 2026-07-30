<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\Auditable;

#[Fillable([
    'kode_supplier',
    'nama_supplier',
    'kontak_person',
    'telepon',
    'email',
    'alamat',
    'pic_utama',
    'no_hp',
    'jenis_supplier',
    'alamat_lengkap',
    'kota',
    'provinsi',
    'termin_pembayaran',
    'metode_pembayaran',
    'mata_uang',
    'lead_time',
    'ppn',
    'status',
])]
class Supplier extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $casts = [
        'lead_time' => 'integer',
        'ppn' => 'decimal:2',
    ];
}
