<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\StockAdjustmentDetail;
use App\Models\StockLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockAdjustmentController extends Controller
{
    /**
     * Get paginated adjustments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = StockAdjustment::with(['gudang', 'creator']);

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where('nomor_dokumen', 'like', "%{$search}%")
                  ->orWhere('catatan', 'like', "%{$search}%");
        }

        $adjustments = $query->latest()->paginate($request->get('limit', 10));

        return $this->successResponse($adjustments, 'Adjustments retrieved successfully');
    }

    /**
     * Store new stock adjustment and write to ledger immediately.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nomor_dokumen' => 'required|string|unique:stock_adjustments,nomor_dokumen',
            'tanggal_adjustment' => 'required|date',
            'gudang_id' => 'required|exists:warehouses,id',
            'catatan' => 'nullable|string',
            'details' => 'required|array|min:1',
            'details.*.barang_id' => 'required|exists:barang,id',
            'details.*.jumlah' => 'required|integer', // Can be positive or negative
        ]);

        $adjustment = DB::transaction(function () use ($validated) {
            $adjustment = StockAdjustment::create([
                'nomor_dokumen' => $validated['nomor_dokumen'],
                'tanggal_adjustment' => $validated['tanggal_adjustment'],
                'gudang_id' => $validated['gudang_id'],
                'catatan' => $validated['catatan'],
                'created_by' => Auth::id(),
            ]);

            foreach ($validated['details'] as $det) {
                StockAdjustmentDetail::create([
                    'stock_adjustment_id' => $adjustment->id,
                    'barang_id' => $det['barang_id'],
                    'jumlah' => $det['jumlah'],
                ]);

                // Write to ledger
                $currentBal = StockLedger::where('barang_id', $det['barang_id'])
                    ->where('gudang_id', $validated['gudang_id'])
                    ->sum('jumlah');

                StockLedger::create([
                    'barang_id' => $det['barang_id'],
                    'gudang_id' => $validated['gudang_id'],
                    'tipe_transaksi' => 'ADJUSTMENT',
                    'referensi_id' => $adjustment->id,
                    'jumlah' => $det['jumlah'],
                    'saldo_stock' => $currentBal + $det['jumlah'],
                ]);
            }

            return $adjustment;
        });

        return $this->successResponse($adjustment->load('details.barang'), 'Penyesuaian stok berhasil disimpan.', 201);
    }

    /**
     * Show adjustment.
     */
    public function show(string $id): JsonResponse
    {
        $adjustment = StockAdjustment::with(['details.barang', 'gudang', 'creator'])->find($id);

        if (!$adjustment) {
            return $this->errorResponse('Adjustment tidak ditemukan.', 404);
        }

        return $this->successResponse($adjustment, 'Adjustment retrieved successfully');
    }
}
