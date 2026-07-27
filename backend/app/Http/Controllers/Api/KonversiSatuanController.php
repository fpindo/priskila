<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KonversiSatuan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KonversiSatuanController extends Controller
{
    /**
     * Display a listing of conversions.
     */
    public function index(Request $request): JsonResponse
    {
        $query = KonversiSatuan::with('barang');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('from_unit', 'like', "%{$search}%")
                    ->orWhere('to_unit', 'like', "%{$search}%")
                    ->orWhereHas('barang', function ($barangQuery) use ($search) {
                        $barangQuery->where('nama_barang', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
            });
        }

        return $this->successResponse($query->latest()->get(), 'Conversions retrieved successfully');
    }

    /**
     * Store a newly created conversion.
     */
    public function store(Request $request): JsonResponse
    {
        $conversion = KonversiSatuan::create($this->validatedData($request));

        return $this->successResponse($conversion->load('barang'), 'Conversion created successfully', 201);
    }

    /**
     * Display the specified conversion.
     */
    public function show(string $id): JsonResponse
    {
        $conversion = KonversiSatuan::with('barang')->find($id);

        if (!$conversion) {
            return $this->errorResponse('Conversion not found', 404);
        }

        return $this->successResponse($conversion, 'Conversion retrieved successfully');
    }

    /**
     * Update the specified conversion.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $conversion = KonversiSatuan::find($id);

        if (!$conversion) {
            return $this->errorResponse('Conversion not found', 404);
        }

        $conversion->update($this->validatedData($request));

        return $this->successResponse($conversion->load('barang'), 'Conversion updated successfully');
    }

    /**
     * Remove the specified conversion.
     */
    public function destroy(string $id): JsonResponse
    {
        $conversion = KonversiSatuan::find($id);

        if (!$conversion) {
            return $this->errorResponse('Conversion not found', 404);
        }

        $conversion->delete();

        return $this->successResponse(null, 'Conversion deleted successfully');
    }

    private function validatedData(Request $request): array
    {
        $request->merge([
            'from_unit' => strtoupper((string) $request->input('from_unit')),
            'to_unit' => strtoupper((string) $request->input('to_unit')),
        ]);

        return $request->validate([
            'barang_id' => 'nullable|integer|exists:barang,id',
            'from_unit' => ['required', 'string', 'max:50', Rule::exists('satuans', 'code'), 'different:to_unit'],
            'to_unit' => ['required', 'string', 'max:50', Rule::exists('satuans', 'code')],
            'factor' => 'required|numeric|min:0.0001',
        ]);
    }
}
