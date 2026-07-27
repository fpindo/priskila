<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\Auditable;

#[Fillable(['kode_supplier', 'nama_supplier', 'kontak_person', 'telepon', 'email', 'alamat'])]
class Supplier extends Model
{
    use HasFactory, SoftDeletes, Auditable;
}
