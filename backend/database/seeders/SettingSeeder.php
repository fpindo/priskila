<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            [
                'key'         => 'sku',
                'label'       => 'Format SKU Barang',
                'description' => 'Format kode SKU untuk master barang',
                'value'       => [
                    'prefix'    => 'BRG',
                    'separator' => '-',
                    'padding'   => 3,
                    'use_year'  => false,
                    'use_month' => false,
                ],
            ],
            [
                'key'         => 'kode_project',
                'label'       => 'Format Kode Project',
                'description' => 'Format kode untuk master project',
                'value'       => [
                    'prefix'    => 'PRJ',
                    'separator' => '-',
                    'padding'   => 3,
                    'use_year'  => true,
                    'use_month' => false,
                ],
            ],
            [
                'key'         => 'kode_supplier',
                'label'       => 'Format Kode Supplier',
                'description' => 'Format kode untuk master supplier',
                'value'       => [
                    'prefix'    => 'SUP',
                    'separator' => '-',
                    'padding'   => 3,
                    'use_year'  => false,
                    'use_month' => false,
                ],
            ],
            [
                'key'         => 'nomor_barang_masuk',
                'label'       => 'Format No. Dokumen Barang Masuk',
                'description' => 'Format nomor dokumen transaksi barang masuk',
                'value'       => [
                    'prefix'    => 'BM',
                    'separator' => '-',
                    'padding'   => 3,
                    'use_year'  => true,
                    'use_month' => true,
                ],
            ],
            [
                'key'         => 'nomor_pemakaian',
                'label'       => 'Format No. Dokumen Pemakaian',
                'description' => 'Format nomor dokumen pemakaian barang',
                'value'       => [
                    'prefix'    => 'PKB',
                    'separator' => '-',
                    'padding'   => 3,
                    'use_year'  => true,
                    'use_month' => true,
                ],
            ],
            [
                'key'         => 'format_tanggal',
                'label'       => 'Format Tampilan Tanggal',
                'description' => 'Format tampilan tanggal di seluruh sistem',
                'value'       => [
                    'format' => 'DD-MM-YYYY',
                ],
            ],
            [
                'key'         => 'nomor_delivery',
                'label'       => 'Format No. Dokumen Delivery Order',
                'description' => 'Format nomor dokumen transaksi delivery order (DO)',
                'value'       => [
                    'prefix'    => 'DO',
                    'separator' => '-',
                    'padding'   => 3,
                    'use_year'  => true,
                    'use_month' => true,
                ],
            ],
            [
                'key'         => 'kode_gudang',
                'label'       => 'Format Kode Gudang',
                'description' => 'Format kode untuk master gudang',
                'value'       => [
                    'prefix'    => 'GDG',
                    'separator' => '-',
                    'padding'   => 3,
                    'use_year'  => false,
                    'use_month' => false,
                ],
            ],
            [
                'key'         => 'nomor_transfer',
                'label'       => 'Format No. Dokumen Transfer Gudang',
                'description' => 'Format nomor dokumen transaksi transfer antar gudang',
                'value'       => [
                    'prefix'    => 'TRF',
                    'separator' => '-',
                    'padding'   => 3,
                    'use_year'  => true,
                    'use_month' => true,
                ],
            ],
            [
                'key'         => 'nomor_opname',
                'label'       => 'Format No. Dokumen Stock Opname',
                'description' => 'Format nomor dokumen transaksi stock opname',
                'value'       => [
                    'prefix'    => 'OPN',
                    'separator' => '-',
                    'padding'   => 3,
                    'use_year'  => true,
                    'use_month' => true,
                ],
            ],
            [
                'key'         => 'nomor_adjustment',
                'label'       => 'Format No. Dokumen Stock Adjustment',
                'description' => 'Format nomor dokumen transaksi penyesuaian stock',
                'value'       => [
                    'prefix'    => 'ADJ',
                    'separator' => '-',
                    'padding'   => 3,
                    'use_year'  => true,
                    'use_month' => true,
                ],
            ],
            [
                'key'         => 'nama_perusahaan',
                'label'       => 'Nama Perusahaan',
                'description' => 'Nama instansi atau perusahaan yang ditampilkan di sistem',
                'value'       => [
                    'name' => 'PRISKILA',
                ],
            ],
            [
                'key'         => 'logo_perusahaan',
                'label'       => 'Logo Perusahaan',
                'description' => 'Logo ikon atau gambar yang ditampilkan di sidebar',
                'value'       => [
                    'type'      => 'icon',
                    'icon_name' => 'Zap',
                    'image_url' => null,
                ],
            ],
            [
                'key'         => 'min_stock_global',
                'label'       => 'Minimal Stock Global',
                'description' => 'Batas minimum stock global jika data barang tidak mengaturnya secara spesifik',
                'value'       => [
                    'min_stock' => 5,
                ],
            ],
        ];

        foreach ($defaults as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
