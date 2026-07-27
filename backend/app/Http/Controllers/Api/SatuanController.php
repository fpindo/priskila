<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Satuan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SatuanController extends Controller
{
    /**
     * Display a listing of units.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Satuan::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        return $this->successResponse($query->oldest('code')->get(), 'Units retrieved successfully');
    }

    /**
     * Store a newly created unit.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedData($request);
        $unit = Satuan::create($data);

        return $this->successResponse($unit, 'Unit created successfully', 201);
    }

    /**
     * Display the specified unit.
     */
    public function show(string $id): JsonResponse
    {
        $unit = Satuan::find($id);

        if (!$unit) {
            return $this->errorResponse('Unit not found', 404);
        }

        return $this->successResponse($unit, 'Unit retrieved successfully');
    }

    /**
     * Update the specified unit and keep dependent conversions aligned.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $unit = Satuan::find($id);

        if (!$unit) {
            return $this->errorResponse('Unit not found', 404);
        }

        $data = $this->validatedData($request, $unit);
        $previousCode = $unit->code;

        DB::transaction(function () use ($unit, $data, $previousCode) {
            $unit->update($data);

            if ($previousCode !== $data['code']) {
                DB::table('barang')
                    ->where('satuan', $previousCode)
                    ->update(['satuan' => $data['code'], 'updated_at' => now()]);

                DB::table('konversi_satuans')
                    ->where('from_unit', $previousCode)
                    ->update(['from_unit' => $data['code'], 'updated_at' => now()]);

                DB::table('konversi_satuans')
                    ->where('to_unit', $previousCode)
                    ->update(['to_unit' => $data['code'], 'updated_at' => now()]);
            }
        });

        return $this->successResponse($unit->fresh(), 'Unit updated successfully');
    }

    /**
     * Remove the specified unit when no conversion depends on it.
     */
    public function destroy(string $id): JsonResponse
    {
        $unit = Satuan::find($id);

        if (!$unit) {
            return $this->errorResponse('Unit not found', 404);
        }

        $isUsed = DB::table('konversi_satuans')
            ->where('from_unit', $unit->code)
            ->orWhere('to_unit', $unit->code)
            ->exists()
            || DB::table('barang')->where('satuan', $unit->code)->exists();

        if ($isUsed) {
            return $this->errorResponse('Unit cannot be deleted because it is used by an item or conversion.', 422);
        }

        $unit->delete();

        return $this->successResponse(null, 'Unit deleted successfully');
    }

    private function validatedData(Request $request, ?Satuan $unit = null): array
    {
        $request->merge(['code' => strtoupper((string) $request->input('code'))]);

        return $request->validate([
            'code' => 'required|string|max:50|unique:satuans,code' . ($unit ? ",{$unit->id}" : ''),
            'name' => 'required|string|max:255',
        ]);
    }
}
