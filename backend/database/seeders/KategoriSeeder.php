<?php

namespace Database\Seeders;

use App\Models\Kategori;
use Illuminate\Database\Seeder;

class KategoriSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'Elektrikal',
            'K3',
            'Mekanikal',
            'Sipil',
            'Peralatan',
            'Consumable',
        ] as $name) {
            Kategori::firstOrCreate(['name' => $name]);
        }
    }
}
