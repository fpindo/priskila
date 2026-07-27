<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    /**
     * Get paginated warehouses.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Warehouse::query();

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where('kode_gudang', 'like', "%{$search}%")
                  ->orWhere('nama_gudang', 'like', "%{$search}%")
                  ->orWhere('alamat', 'like', "%{$search}%");
        }

        $warehouses = $query->paginate($request->get('limit', 10));

        return $this->successResponse($warehouses, 'Warehouses retrieved successfully');
    }

    /**
     * Store new warehouse.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode_gudang' => 'required|string|unique:warehouses,kode_gudang',
            'nama_gudang' => 'required|string',
            'alamat' => 'nullable|string',
        ]);

        $warehouse = Warehouse::create($validated);

        return $this->successResponse($warehouse, 'Gudang berhasil ditambahkan.', 201);
    }

    /**
     * Show warehouse.
     */
    public function show(string $id): JsonResponse
    {
        $warehouse = Warehouse::find($id);

        if (!$warehouse) {
            return $this->errorResponse('Gudang tidak ditemukan.', 404);
        }

        return $this->successResponse($warehouse, 'Warehouse retrieved successfully');
    }

    /**
     * Update warehouse.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $warehouse = Warehouse::find($id);

        if (!$warehouse) {
            return $this->errorResponse('Gudang tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'kode_gudang' => 'required|string|unique:warehouses,kode_gudang,' . $id,
            'nama_gudang' => 'required|string',
            'alamat' => 'nullable|string',
        ]);

        $warehouse->update($validated);

        return $this->successResponse($warehouse, 'Gudang berhasil diubah.');
    }

    /**
     * Delete warehouse.
     */
    public function destroy(string $id): JsonResponse
    {
        $warehouse = Warehouse::find($id);

        if (!$warehouse) {
            return $this->errorResponse('Gudang tidak ditemukan.', 404);
        }

        // Check if there are stock ledgers referencing this warehouse
        if ($warehouse->stockLedgers()->exists()) {
            return $this->errorResponse('Gudang tidak dapat dihapus karena sudah memiliki histori transaksi barang.', 400);
        }

        $warehouse->delete();

        return $this->successResponse(null, 'Gudang berhasil dihapus.');
    }
}
