<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\Auditable;

#[Fillable(['kode_project', 'nama_project', 'deskripsi', 'tanggal_mulai', 'tanggal_selesai', 'status'])]
class Project extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
        ];
    }
}
