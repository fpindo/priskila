<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bin;
use App\Models\Shelf;
use App\Models\Rack;
use App\Models\Zone;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    // ── Read (hierarchy) ──

    public function getWarehouses(): JsonResponse
    {
        $warehouses = Warehouse::all();
        return $this->successResponse($warehouses, 'Warehouses retrieved successfully');
    }

    public function getZones(string $warehouseId): JsonResponse
    {
        $zones = Zone::where('warehouse_id', $warehouseId)->get();
        return $this->successResponse($zones, 'Zones retrieved successfully');
    }

    public function getRacks(string $zoneId): JsonResponse
    {
        $racks = Rack::where('zone_id', $zoneId)->get();
        return $this->successResponse($racks, 'Racks retrieved successfully');
    }

    public function getShelves(string $rackId): JsonResponse
    {
        $shelves = Shelf::where('rack_id', $rackId)->get();
        return $this->successResponse($shelves, 'Shelves retrieved successfully');
    }

    public function getBins(string $shelfId): JsonResponse
    {
        $bins = Bin::where('shelf_id', $shelfId)->get();
        return $this->successResponse($bins, 'Bins retrieved successfully');
    }

    public function getAllBins(): JsonResponse
    {
        $bins = Bin::with('shelf.rack.zone.warehouse')->get();
        return $this->successResponse($bins, 'Bins retrieved successfully');
    }

    // ── Zone CRUD ──

    public function storeZone(Request $request): JsonResponse
    {
        $data = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'code' => 'required|string|max:10',
            'name' => 'required|string|max:255',
        ]);
        $zone = Zone::create($data);
        return $this->successResponse($zone, 'Zone created', 201);
    }

    public function updateZone(Request $request, int $id): JsonResponse
    {
        $zone = Zone::findOrFail($id);
        $data = $request->validate([
            'code' => 'required|string|max:10',
            'name' => 'required|string|max:255',
        ]);
        $zone->update($data);
        return $this->successResponse($zone, 'Zone updated');
    }

    public function destroyZone(int $id): JsonResponse
    {
        Zone::findOrFail($id)->delete();
        return $this->successResponse(null, 'Zone deleted');
    }

    // ── Rack CRUD ──

    public function storeRack(Request $request): JsonResponse
    {
        $data = $request->validate([
            'zone_id' => 'required|exists:zones,id',
            'code' => 'required|string|max:10',
            'name' => 'required|string|max:255',
        ]);
        $rack = Rack::create($data);
        return $this->successResponse($rack, 'Rack created', 201);
    }

    public function updateRack(Request $request, int $id): JsonResponse
    {
        $rack = Rack::findOrFail($id);
        $data = $request->validate([
            'code' => 'required|string|max:10',
            'name' => 'required|string|max:255',
        ]);
        $rack->update($data);
        return $this->successResponse($rack, 'Rack updated');
    }

    public function destroyRack(int $id): JsonResponse
    {
        Rack::findOrFail($id)->delete();
        return $this->successResponse(null, 'Rack deleted');
    }

    // ── Shelf CRUD ──

    public function storeShelf(Request $request): JsonResponse
    {
        $data = $request->validate([
            'rack_id' => 'required|exists:racks,id',
            'code' => 'required|string|max:10',
            'name' => 'required|string|max:255',
        ]);
        $shelf = Shelf::create($data);
        return $this->successResponse($shelf, 'Shelf created', 201);
    }

    public function updateShelf(Request $request, int $id): JsonResponse
    {
        $shelf = Shelf::findOrFail($id);
        $data = $request->validate([
            'code' => 'required|string|max:10',
            'name' => 'required|string|max:255',
        ]);
        $shelf->update($data);
        return $this->successResponse($shelf, 'Shelf updated');
    }

    public function destroyShelf(int $id): JsonResponse
    {
        Shelf::findOrFail($id)->delete();
        return $this->successResponse(null, 'Shelf deleted');
    }

    // ── Bin CRUD ──

    public function storeBin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'shelf_id' => 'required|exists:shelves,id',
            'code' => 'required|string|max:10',
            'name' => 'required|string|max:255',
        ]);
        $bin = Bin::create($data);
        return $this->successResponse($bin, 'Bin created', 201);
    }

    public function updateBin(Request $request, int $id): JsonResponse
    {
        $bin = Bin::findOrFail($id);
        $data = $request->validate([
            'code' => 'required|string|max:10',
            'name' => 'required|string|max:255',
        ]);
        $bin->update($data);
        return $this->successResponse($bin, 'Bin updated');
    }

    public function destroyBin(int $id): JsonResponse
    {
        Bin::findOrFail($id)->delete();
        return $this->successResponse(null, 'Bin deleted');
    }

    // ── Barcode lookup ──

    public function lookupBarcode(string $code): JsonResponse
    {
        $barang = \App\Models\Barang::where('barcode', $code)
            ->orWhere('sku', $code)
            ->first();

        if (!$barang) {
            return $this->errorResponse('Barang tidak ditemukan dengan kode: ' . $code, 404);
        }

        return $this->successResponse($barang, 'Barang found');
    }
}
