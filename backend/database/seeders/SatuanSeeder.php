<?php

namespace Database\Seeders;

use App\Models\Satuan;
use Illuminate\Database\Seeder;

class SatuanSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            'PCS' => 'Pieces',
            'BOX' => 'Box',
            'PACK' => 'Pack',
            'ROLL' => 'Roll',
            'METER' => 'Meter',
            'KG' => 'Kilogram',
            'SAK' => 'Sak',
            'DUS' => 'Dus',
            'CARTON' => 'Karton',
            'PALLET' => 'Pallet',
        ];

        foreach ($units as $code => $name) {
            Satuan::updateOrCreate(['code' => $code], ['name' => $name]);
        }
    }
}
