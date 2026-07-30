<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Reset Spatie Cache to prevent caching issues during seeding
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. Define Permissions
        $permissions = [
            'manage-projects',
            'manage-barang',
            'manage-suppliers',
            'manage-transactions',
            'approve-pemakaian',
            'view-reports',
            'manage-settings',
            'manage-users',
            'manage-adjustments',
        ];

        foreach ($permissions as $permissionName) {
            Permission::create(['name' => $permissionName, 'guard_name' => 'web']);
        }

        // 3. Create Roles and Assign Permissions
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $managerRole = Role::create(['name' => 'manager', 'guard_name' => 'web']);
        $staffRole = Role::create(['name' => 'staff', 'guard_name' => 'web']);

        // Admin gets all permissions
        $adminRole->givePermissionTo(Permission::all());

        // Manager permissions
        $managerRole->givePermissionTo([
            'manage-projects',
            'manage-barang',
            'manage-suppliers',
            'approve-pemakaian',
            'view-reports',
        ]);

        // Staff permissions
        $staffRole->givePermissionTo([
            'manage-transactions',
            'manage-barang',
        ]);

        // 4. Create Default Admin User
        $adminUser = User::create([
            'name' => 'Administrator',
            'email' => 'admin@priskila.com',
            'password' => Hash::make('password'),
        ]);
        $adminUser->assignRole($adminRole);

        // 5. Create Default Staff User
        $staffUser = User::create([
            'name' => 'Staff User',
            'email' => 'staff@priskila.com',
            'password' => Hash::make('password'),
        ]);
        $staffUser->assignRole($staffRole);

        // 6. Seed master categories and units before dependent records
        $this->call([
            KategoriSeeder::class,
            SatuanSeeder::class,
        ]);

        // 7. Seed Master Projects
        \App\Models\Project::create([
            'kode_project' => 'PRJ-2026-001',
            'nama_project' => 'SUTET 500kV Java-Bali Construction',
            'deskripsi' => 'High voltage transmission network construction connecting Java and Bali.',
            'tanggal_mulai' => '2026-01-01',
            'tanggal_selesai' => '2026-12-31',
            'status' => 'ACTIVE',
        ]);

        \App\Models\Project::create([
            'kode_project' => 'PRJ-2026-002',
            'nama_project' => 'Electrical Substation Maintenance Surabaya',
            'deskripsi' => 'Preventive and corrective maintenance of primary substation systems in East Java.',
            'tanggal_mulai' => '2026-03-15',
            'tanggal_selesai' => '2026-09-15',
            'status' => 'ACTIVE',
        ]);

        // 8. Seed Master Items (Barang)
        \App\Models\Barang::create([
            'sku' => 'SKU-CB-100',
            'barcode' => '7890123456001',
            'nama_barang' => 'Circuit Breaker 100A ABB',
            'deskripsi' => 'High-quality 3-phase air circuit breaker 100 Ampere.',
            'kategori' => 'Elektrikal',
            'satuan' => 'PCS',
            'min_stock' => 5,
        ]);

        \App\Models\Barang::create([
            'sku' => 'SKU-CBL-050',
            'barcode' => '7890123456002',
            'nama_barang' => 'Copper Cable 50mm 100m',
            'deskripsi' => 'Insulated copper ground cable 50mm cross-section, length 100 meters.',
            'kategori' => 'Elektrikal',
            'satuan' => 'ROLL',
            'min_stock' => 10,
        ]);

        \App\Models\Barang::create([
            'sku' => 'SKU-SLT-012',
            'barcode' => '7890123456003',
            'nama_barang' => 'Safety Helmet Yellow',
            'deskripsi' => 'Yellow protective industrial helmet with chin strap.',
            'kategori' => 'K3',
            'satuan' => 'PCS',
            'min_stock' => 15,
        ]);

        // 9. Seed Master Suppliers
        \App\Models\Supplier::create([
            'kode_supplier' => 'SPL-ABB-01',
            'nama_supplier' => 'PT. ABB Power Indonesia',
            'kontak_person' => 'John Doe',
            'telepon' => '021-5551234',
            'email' => 'contact@abb.co.id',
            'alamat' => 'Sudirman Central Business District, Kav 52-53, Jakarta Selatan',
        ]);

        \App\Models\Supplier::create([
            'kode_supplier' => 'SPL-CBL-02',
            'nama_supplier' => 'PT. Kabelindo Murni Tbk',
            'kontak_person' => 'Jane Smith',
            'telepon' => '021-5556789',
            'email' => 'sales@kabelindo.com',
            'alamat' => 'Kawasan Industri Rungkut, Jalan Rungkut Industri Raya No 10, Surabaya',
        ]);

        // 10. Call additional seeders
        $this->call([
            SettingSeeder::class,
            WarehouseSeeder::class,
            LocationHierarchySeeder::class,
            KonversiSatuanSeeder::class,
        ]);
    }
}
