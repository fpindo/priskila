<?php

namespace Database\Seeders;

use App\Models\KonversiSatuan;
use Illuminate\Database\Seeder;

class KonversiSatuanSeeder extends Seeder
{
    public function run(): void
    {
        $conversions = [
            ['from_unit' => 'PACK', 'to_unit' => 'PCS', 'factor' => 10.0],
            ['from_unit' => 'ROLL', 'to_unit' => 'METER', 'factor' => 100.0],
            ['from_unit' => 'SAK', 'to_unit' => 'KG', 'factor' => 50.0],
            ['from_unit' => 'CARTON', 'to_unit' => 'PCS', 'factor' => 24.0],
            ['from_unit' => 'PALLET', 'to_unit' => 'BOX', 'factor' => 50.0],
        ];

        foreach ($conversions as $conversion) {
            KonversiSatuan::firstOrCreate([
                'barang_id' => null,
                ...$conversion,
            ]);
        }
    }
}
