<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use App\Models\Zone;
use App\Models\Rack;
use App\Models\Shelf;
use App\Models\Bin;
use Illuminate\Database\Seeder;

class LocationHierarchySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the seeded warehouses
        $gudangJkt = Warehouse::where('kode_gudang', 'GDG-JKT')->first();
        $gudangSby = Warehouse::where('kode_gudang', 'GDG-SBY')->first();

        if ($gudangJkt) {
            // Seed Zones for Jakarta
            $zonesJkt = [
                ['code' => 'ZONE-A', 'name' => 'A'],
                ['code' => 'ZONE-B', 'name' => 'B'],
            ];

            foreach ($zonesJkt as $z) {
                $zone = Zone::updateOrCreate(
                    ['warehouse_id' => $gudangJkt->id, 'code' => $z['code']],
                    ['name' => $z['name']]
                );

                // Seed Racks for Zone A
                if ($z['code'] === 'ZONE-A') {
                    $racks = [
                        ['code' => 'RACK-A1', 'name' => 'A1'],
                        ['code' => 'RACK-A2', 'name' => 'A2'],
                    ];

                    foreach ($racks as $r) {
                        $rack = Rack::updateOrCreate(
                            ['zone_id' => $zone->id, 'code' => $r['code']],
                            ['name' => $r['name']]
                        );

                        // Seed Shelves for Rack A1
                        if ($r['code'] === 'RACK-A1') {
                            $shelves = [
                                ['code' => 'SHELF-A1-1', 'name' => 'A1-1'],
                                ['code' => 'SHELF-A1-2', 'name' => 'A1-2'],
                            ];

                            foreach ($shelves as $s) {
                                $shelf = Shelf::updateOrCreate(
                                    ['rack_id' => $rack->id, 'code' => $s['code']],
                                    ['name' => $s['name']]
                                );

                                // Seed Bins for Shelf A1-1
                                if ($s['code'] === 'SHELF-A1-1') {
                                    $bins = [
                                        ['code' => 'BIN-A1-1-A', 'name' => 'A1-1-A'],
                                        ['code' => 'BIN-A1-1-B', 'name' => 'A1-1-B'],
                                    ];

                                    foreach ($bins as $b) {
                                        Bin::updateOrCreate(
                                            ['shelf_id' => $shelf->id, 'code' => $b['code']],
                                            ['name' => $b['name']]
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if ($gudangSby) {
            // Seed Zones for Surabaya
            $zonesSby = [
                ['code' => 'ZONE-S1', 'name' => 'Surabaya 1'],
            ];

            foreach ($zonesSby as $z) {
                $zone = Zone::updateOrCreate(
                    ['warehouse_id' => $gudangSby->id, 'code' => $z['code']],
                    ['name' => $z['name']]
                );

                $racks = [
                    ['code' => 'RACK-S1-01', 'name' => 'S1-01'],
                ];

                foreach ($racks as $r) {
                    $rack = Rack::updateOrCreate(
                        ['zone_id' => $zone->id, 'code' => $r['code']],
                        ['name' => $r['name']]
                    );

                    $shelves = [
                        ['code' => 'SHELF-S1-01A', 'name' => 'S1-01A'],
                    ];

                    foreach ($shelves as $s) {
                        $shelf = Shelf::updateOrCreate(
                            ['rack_id' => $rack->id, 'code' => $s['code']],
                            ['name' => $s['name']]
                        );

                        $bins = [
                            ['code' => 'BIN-S1-01A-1', 'name' => 'S1-01A-1'],
                        ];

                        foreach ($bins as $b) {
                            Bin::updateOrCreate(
                                ['shelf_id' => $shelf->id, 'code' => $b['code']],
                                ['name' => $b['name']]
                            );
                        }
                    }
                }
            }
        }
    }
}
