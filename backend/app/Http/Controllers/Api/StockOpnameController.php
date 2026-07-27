<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\StockLedger;
use App\Models\StockOpname;
use App\Models\StockOpnameDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockOpnameController extends Controller
{
    /**
     * Get paginated opnames.
     */
    public function index(Request $request): JsonResponse
    {
        $query = StockOpname::with(['gudang', 'creator']);

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where('nomor_dokumen', 'like', "%{$search}%")
                  ->orWhere('catatan', 'like', "%{$search}%");
        }

        $opnames = $query->latest()->paginate($request->get('limit', 10));

        return $this->successResponse($opnames, 'Stock opnames retrieved successfully');
    }

    /**
     * Create a new draft stock opname, pre-filling system stock for all items in the warehouse.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nomor_dokumen' => 'required|string|unique:stock_opnames,nomor_dokumen',
            'tanggal_opname' => 'required|date',
            'gudang_id' => 'required|exists:warehouses,id',
            'catatan' => 'nullable|string',
        ]);

        $opname = DB::transaction(function () use ($validated) {
            $opname = StockOpname::create([
                'nomor_dokumen' => $validated['nomor_dokumen'],
                'tanggal_opname' => $validated['tanggal_opname'],
                'gudang_id' => $validated['gudang_id'],
                'catatan' => $validated['catatan'],
                'status' => 'DRAFT',
                'created_by' => Auth::id(),
            ]);

            // Fetch all items to prefill the opname details
            $items = Barang::all();
            foreach ($items as $item) {
                $systemStock = StockLedger::where('barang_id', $item->id)
                    ->where('gudang_id', $validated['gudang_id'])
                    ->sum('jumlah');

                StockOpnameDetail::create([
                    'stock_opname_id' => $opname->id,
                    'barang_id' => $item->id,
                    'stok_sistem' => $systemStock,
                    'stok_fisik' => $systemStock, // Default physical stock matches system stock initially
                    'selisih' => 0,
                ]);
            }

            return $opname;
        });

        return $this->successResponse($opname->load('details.barang'), 'Draft Stock Opname berhasil dibuat.', 201);
    }

    /**
     * Show opname.
     */
    public function show(string $id): JsonResponse
    {
        $opname = StockOpname::with(['details.barang', 'gudang', 'creator'])->find($id);

        if (!$opname) {
            return $this->errorResponse('Stock opname tidak ditemukan.', 404);
        }

        return $this->successResponse($opname, 'Stock opname retrieved successfully');
    }

    /**
     * Update physical counts in the draft opname.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $opname = StockOpname::find($id);

        if (!$opname) {
            return $this->errorResponse('Stock opname tidak ditemukan.', 404);
        }

        if ($opname->status !== 'DRAFT') {
            return $this->errorResponse('Hanya stock opname berstatus DRAFT yang dapat diubah.', 400);
        }

        $validated = $request->validate([
            'catatan' => 'nullable|string',
            'details' => 'required|array',
            'details.*.id' => 'required|exists:stock_opname_details,id',
            'details.*.stok_fisik' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($opname, $validated) {
            $opname->update(['catatan' => $validated['catatan']]);

            foreach ($validated['details'] as $det) {
                $detail = StockOpnameDetail::find($det['id']);
                if ($detail && $detail->stock_opname_id === $opname->id) {
                    $selisih = $det['stok_fisik'] - $detail->stok_sistem;
                    $detail->update([
                        'stok_fisik' => $det['stok_fisik'],
                        'selisih' => $selisih,
                    ]);
                }
            }
        });

        return $this->successResponse($opname->load('details.barang'), 'Pemeriksaan fisik berhasil disimpan.');
    }

    /**
     * Finalize stock opname, adjustments are immediately written to ledger.
     */
    public function finalize(string $id): JsonResponse
    {
        $opname = StockOpname::find($id);

        if (!$opname) {
            return $this->errorResponse('Stock opname tidak ditemukan.', 404);
        }

        if ($opname->status !== 'DRAFT') {
            return $this->errorResponse('Hanya stock opname berstatus DRAFT yang dapat difinalisasi.', 400);
        }

        DB::transaction(function () use ($opname) {
            $opname->update(['status' => 'FINAL']);

            foreach ($opname->details as $item) {
                // If there's a difference, adjust in the ledger
                if ($item->selisih !== 0) {
                    $currentBal = StockLedger::where('barang_id', $item->barang_id)
                        ->where('gudang_id', $opname->gudang_id)
                        ->sum('jumlah');

                    StockLedger::create([
                        'barang_id' => $item->barang_id,
                        'gudang_id' => $opname->gudang_id,
                        'tipe_transaksi' => 'ADJUSTMENT',
                        'referensi_id' => $opname->id,
                        'jumlah' => $item->selisih,
                        'saldo_stock' => $currentBal + $item->selisih,
                    ]);
                }
            }
        });

        return $this->successResponse(null, 'Stock opname berhasil difinalisasi dan stok sistem telah disesuaikan.');
    }
}
