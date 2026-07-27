<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Core\BarangRequest;
use App\Models\Barang;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BarangController extends Controller
{
    /**
     * Display a listing of items.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Barang::with('conversions');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('nama_barang', 'like', "%{$search}%");
            });
        }

        if ($request->has('kategori') && $request->kategori !== '') {
            $query->where('kategori', $request->kategori);
        }

        $barang = $query->latest()->paginate($request->get('limit', 10));

        return $this->successResponse($barang, 'Items retrieved successfully');
    }

    /**
     * Store a newly created item.
     */
    public function store(BarangRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('barang', 'public');
            $data['image_url'] = asset('storage/' . $path);
        }

        unset($data['image']); // Remove file upload object from data array

        $barang = Barang::create($data);

        return $this->successResponse($barang, 'Item created successfully', 201);
    }

    /**
     * Display the specified item.
     */
    public function show(string $id): JsonResponse
    {
        $barang = Barang::find($id);

        if (!$barang) {
            return $this->errorResponse('Item not found', 404);
        }

        return $this->successResponse($barang, 'Item retrieved successfully');
    }

    /**
     * Update the specified item.
     */
    public function update(BarangRequest $request, string $id): JsonResponse
    {
        $barang = Barang::find($id);

        if (!$barang) {
            return $this->errorResponse('Item not found', 404);
        }

        $data = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($barang->image_url) {
                $oldPath = str_replace(asset('storage/'), '', $barang->image_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image')->store('barang', 'public');
            $data['image_url'] = asset('storage/' . $path);
        }

        unset($data['image']);

        $barang->update($data);

        return $this->successResponse($barang, 'Item updated successfully');
    }

    /**
     * Remove the specified item.
     */
    public function destroy(string $id): JsonResponse
    {
        $barang = Barang::find($id);

        if (!$barang) {
            return $this->errorResponse('Item not found', 404);
        }

        $barang->delete();

        return $this->successResponse(null, 'Item deleted successfully');
    }

    /**
     * Import multiple items.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.sku' => 'required|string',
            'items.*.nama_barang' => 'required|string|max:255',
            'items.*.kategori' => 'required|string|exists:kategoris,name',
            'items.*.satuan' => 'required|string|exists:satuans,code',
            'items.*.min_stock' => 'required|integer|min:0',
            'items.*.deskripsi' => 'nullable|string',
        ]);

        $created = [];
        $errors = [];

        foreach ($request->items as $index => $item) {
            // Check if SKU already exists
            if (Barang::where('sku', $item['sku'])->exists()) {
                $errors[] = "Baris " . ($index + 1) . ": SKU '{$item['sku']}' sudah digunakan.";
                continue;
            }

            $created[] = Barang::create([
                'sku' => $item['sku'],
                'nama_barang' => $item['nama_barang'],
                'kategori' => $item['kategori'],
                'satuan' => $item['satuan'],
                'min_stock' => $item['min_stock'],
                'deskripsi' => $item['deskripsi'] ?? null,
                'current_stock' => 0,
            ]);
        }

        if (count($errors) > 0 && count($created) === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengimpor data barang.',
                'errors' => $errors
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => count($errors) > 0 ? 'Beberapa barang berhasil diimpor dengan catatan' : 'Semua barang berhasil diimpor',
            'data' => [
                'imported_count' => count($created),
                'errors' => $errors
            ]
        ]);
    }
}
