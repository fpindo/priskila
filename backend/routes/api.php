<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarangController;
use App\Http\Controllers\Api\BarangMasukController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeliveryOrderController;
use App\Http\Controllers\Api\KategoriController;
use App\Http\Controllers\Api\KonversiSatuanController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\PemakaianBarangController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SatuanController;
use App\Http\Controllers\Api\SecurityController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StockAdjustmentController;
use App\Http\Controllers\Api\StockOpnameController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TransferGudangController;
use App\Http\Controllers\Api\TwoFactorAuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WarehouseController;
use Illuminate\Support\Facades\Route;

// Public Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/2fa/verify', [TwoFactorAuthController::class, 'verify']);
});

// Public Delivery Verification (no auth required; must precede /delivery-orders/{id})
Route::get('/delivery-orders/verify/{token}', [DeliveryOrderController::class, 'verify']);
Route::post('/delivery-orders/verify/{token}/confirm', [DeliveryOrderController::class, 'confirm']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth profile actions
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Dashboard metrics
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Master CRUDs
    Route::apiResource('projects', ProjectController::class);
    Route::post('barang/import', [BarangController::class, 'import']);
    Route::apiResource('barang', BarangController::class);
    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('users', UserController::class);
    Route::apiResource('kategoris', KategoriController::class);
    Route::apiResource('conversions', KonversiSatuanController::class);
    Route::apiResource('satuans', SatuanController::class);

    // Goods Inbound (Barang Masuk)
    Route::get('/barang-masuk', [BarangMasukController::class, 'index']);
    Route::post('/barang-masuk', [BarangMasukController::class, 'store']);
    Route::get('/barang-masuk/{id}', [BarangMasukController::class, 'show']);

    // Consumption Requests (Pemakaian Barang)
    Route::get('/pemakaian-barang', [PemakaianBarangController::class, 'index']);
    Route::post('/pemakaian-barang', [PemakaianBarangController::class, 'store']);
    Route::get('/pemakaian-barang/{id}', [PemakaianBarangController::class, 'show']);
    Route::post('/pemakaian-barang/{id}/approve', [PemakaianBarangController::class, 'approve']);
    Route::post('/pemakaian-barang/{id}/reject', [PemakaianBarangController::class, 'reject']);

    // Inventory Reports
    Route::get('/reports/stock', [ReportController::class, 'stockReport']);
    Route::get('/reports/stock-card/{barang_id}', [ReportController::class, 'stockCard']);

    // Settings (Code Format Configuration)
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);
    Route::get('/settings/generate-code/{type}', [SettingController::class, 'generateCode']);

    // Two-Factor Authentication Management
    Route::post('/auth/2fa/enable', [TwoFactorAuthController::class, 'enable']);
    Route::post('/auth/2fa/confirm', [TwoFactorAuthController::class, 'confirm']);
    Route::post('/auth/2fa/disable', [TwoFactorAuthController::class, 'disable']);

    // Security Monitoring & Device Sessions
    Route::get('/security/devices', [SecurityController::class, 'activeDevices']);
    Route::delete('/security/devices/{id}', [SecurityController::class, 'revokeDevice']);
    Route::get('/security/logs/audit', [SecurityController::class, 'auditLogs']);
    Route::get('/security/logs/activity', [SecurityController::class, 'activityLogs']);
    Route::get('/security/logs/login-history', [SecurityController::class, 'loginHistories']);

    // Master Warehouses
    Route::apiResource('warehouses', WarehouseController::class);

    // Warehouse transfers (Transfer Gudang)
    Route::get('/inventory/transfers', [TransferGudangController::class, 'index']);
    Route::post('/inventory/transfers', [TransferGudangController::class, 'store']);
    Route::get('/inventory/transfers/{id}', [TransferGudangController::class, 'show']);
    Route::post('/inventory/transfers/{id}/approve', [TransferGudangController::class, 'approve']);
    Route::post('/inventory/transfers/{id}/reject', [TransferGudangController::class, 'reject']);

    // Stock adjustments
    Route::get('/inventory/adjustments', [StockAdjustmentController::class, 'index']);
    Route::post('/inventory/adjustments', [StockAdjustmentController::class, 'store']);
    Route::get('/inventory/adjustments/{id}', [StockAdjustmentController::class, 'show']);

    // Stock opnames
    Route::get('/inventory/opnames', [StockOpnameController::class, 'index']);
    Route::post('/inventory/opnames', [StockOpnameController::class, 'store']);
    Route::get('/inventory/opnames/{id}', [StockOpnameController::class, 'show']);
    Route::put('/inventory/opnames/{id}', [StockOpnameController::class, 'update']);
    Route::post('/inventory/opnames/{id}/finalize', [StockOpnameController::class, 'finalize']);

    // Reports turnover (Fast, Slow, Dead stock)
    Route::get('/reports/turnover', [ReportController::class, 'turnoverReport']);

    // Delivery Orders
    Route::get('/delivery-orders', [DeliveryOrderController::class, 'index']);
    Route::post('/delivery-orders', [DeliveryOrderController::class, 'store']);
    Route::get('/delivery-orders/{id}', [DeliveryOrderController::class, 'show']);
    Route::post('/delivery-orders/{id}/ship', [DeliveryOrderController::class, 'ship']);

    // Location Hierarchy
    Route::prefix('locations')->group(function () {
        Route::get('/warehouses', [LocationController::class, 'getWarehouses']);
        Route::get('/bins', [LocationController::class, 'getAllBins']);
        Route::get('/{warehouseId}/zones', [LocationController::class, 'getZones']);
        Route::get('/{zoneId}/racks', [LocationController::class, 'getRacks']);
        Route::get('/{rackId}/shelves', [LocationController::class, 'getShelves']);
        Route::get('/{shelfId}/bins', [LocationController::class, 'getBins']);
    });

    // Location CRUD
    Route::post('/zones', [LocationController::class, 'storeZone']);
    Route::put('/zones/{id}', [LocationController::class, 'updateZone']);
    Route::delete('/zones/{id}', [LocationController::class, 'destroyZone']);

    Route::post('/racks', [LocationController::class, 'storeRack']);
    Route::put('/racks/{id}', [LocationController::class, 'updateRack']);
    Route::delete('/racks/{id}', [LocationController::class, 'destroyRack']);

    Route::post('/shelves', [LocationController::class, 'storeShelf']);
    Route::put('/shelves/{id}', [LocationController::class, 'updateShelf']);
    Route::delete('/shelves/{id}', [LocationController::class, 'destroyShelf']);

    Route::post('/bins', [LocationController::class, 'storeBin']);
    Route::put('/bins/{id}', [LocationController::class, 'updateBin']);
    Route::delete('/bins/{id}', [LocationController::class, 'destroyBin']);

    // Barcode Lookup
    Route::get('/barcode/{code}', [LocationController::class, 'lookupBarcode']);
});
