<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class WarehouseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $warehouses = [
            [
                'kode_gudang' => 'GDG-JKT',
                'nama_gudang' => 'Gudang Utama Jakarta',
                'alamat' => 'Jl. Danau Sunter Blok A No. 10, Jakarta Utara',
            ],
            [
                'kode_gudang' => 'GDG-SBY',
                'nama_gudang' => 'Gudang Cabang Surabaya',
                'alamat' => 'Kawasan Industri Rungkut Blok B No. 4, Surabaya',
            ],
        ];

        foreach ($warehouses as $w) {
            // We use DB or check if model exists. Let's make sure it is updated.
            \Illuminate\Support\Facades\DB::table('warehouses')->updateOrInsert(
                ['kode_gudang' => $w['kode_gudang']],
                $w
            );
        }
    }
}
