<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Core\SupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('kode_supplier', 'like', "%{$search}%")
                  ->orWhere('nama_supplier', 'like', "%{$search}%")
                  ->orWhere('kontak_person', 'like', "%{$search}%");
            });
        }

        $suppliers = $query->latest()->paginate($request->get('limit', 10));

        return $this->successResponse($suppliers, 'Suppliers retrieved successfully');
    }

    /**
     * Store a newly created supplier.
     */
    public function store(SupplierRequest $request): JsonResponse
    {
        $supplier = Supplier::create($request->validated());

        return $this->successResponse($supplier, 'Supplier created successfully', 201);
    }

    /**
     * Display the specified supplier.
     */
    public function show(string $id): JsonResponse
    {
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return $this->errorResponse('Supplier not found', 404);
        }

        return $this->successResponse($supplier, 'Supplier retrieved successfully');
    }

    /**
     * Update the specified supplier.
     */
    public function update(SupplierRequest $request, string $id): JsonResponse
    {
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return $this->errorResponse('Supplier not found', 404);
        }

        $supplier->update($request->validated());

        return $this->successResponse($supplier, 'Supplier updated successfully');
    }

    /**
     * Remove the specified supplier.
     */
    public function destroy(string $id): JsonResponse
    {
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return $this->errorResponse('Supplier not found', 404);
        }

        $supplier->delete();

        return $this->successResponse(null, 'Supplier deleted successfully');
    }
}
