<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GudangTransfer;
use App\Models\GudangTransferDetail;
use App\Models\StockLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TransferGudangController extends Controller
{
    /**
     * Get paginated transfers.
     */
    public function index(Request $request): JsonResponse
    {
        $query = GudangTransfer::with(['gudangAsal', 'gudangTujuan', 'creator', 'approver']);

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where('nomor_dokumen', 'like', "%{$search}%")
                  ->orWhere('catatan', 'like', "%{$search}%");
        }

        $transfers = $query->latest()->paginate($request->get('limit', 10));

        return $this->successResponse($transfers, 'Transfers retrieved successfully');
    }

    /**
     * Store a new pending transfer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nomor_dokumen' => 'required|string|unique:gudang_transfers,nomor_dokumen',
            'tanggal_transfer' => 'required|date',
            'gudang_asal_id' => 'required|exists:warehouses,id',
            'gudang_tujuan_id' => 'required|exists:warehouses,id|different:gudang_asal_id',
            'catatan' => 'nullable|string',
            'details' => 'required|array|min:1',
            'details.*.barang_id' => 'required|exists:barang,id',
            'details.*.jumlah' => 'required|integer|min:1',
        ]);

        // Check if sufficient stock is available in origin warehouse for all items
        foreach ($validated['details'] as $item) {
            $currentStock = StockLedger::where('barang_id', $item['barang_id'])
                ->where('gudang_id', $validated['gudang_asal_id'])
                ->sum('jumlah');

            if ($currentStock < $item['jumlah']) {
                return $this->errorResponse("Stok tidak mencukupi untuk item ID {$item['barang_id']} di gudang asal. Tersedia: {$currentStock}, Diminta: {$item['jumlah']}", 422);
            }
        }

        $transfer = DB::transaction(function () use ($validated) {
            $transfer = GudangTransfer::create([
                'nomor_dokumen' => $validated['nomor_dokumen'],
                'tanggal_transfer' => $validated['tanggal_transfer'],
                'gudang_asal_id' => $validated['gudang_asal_id'],
                'gudang_tujuan_id' => $validated['gudang_tujuan_id'],
                'catatan' => $validated['catatan'],
                'status' => 'PENDING',
                'created_by' => Auth::id(),
            ]);

            foreach ($validated['details'] as $det) {
                GudangTransferDetail::create([
                    'gudang_transfer_id' => $transfer->id,
                    'barang_id' => $det['barang_id'],
                    'jumlah' => $det['jumlah'],
                ]);
            }

            return $transfer;
        });

        return $this->successResponse($transfer->load('details.barang'), 'Transfer gudang berhasil diajukan.', 201);
    }

    /**
     * Show transfer.
     */
    public function show(string $id): JsonResponse
    {
        $transfer = GudangTransfer::with(['details.barang', 'gudangAsal', 'gudangTujuan', 'creator', 'approver'])->find($id);

        if (!$transfer) {
            return $this->errorResponse('Transfer tidak ditemukan.', 404);
        }

        return $this->successResponse($transfer, 'Transfer retrieved successfully');
    }

    /**
     * Approve transfer and execute stock movement.
     */
    public function approve(string $id): JsonResponse
    {
        $transfer = GudangTransfer::find($id);

        if (!$transfer) {
            return $this->errorResponse('Transfer tidak ditemukan.', 404);
        }

        if ($transfer->status !== 'PENDING') {
            return $this->errorResponse('Hanya transfer berstatus PENDING yang dapat disetujui.', 400);
        }

        // Re-check stock in origin warehouse
        foreach ($transfer->details as $item) {
            $currentStock = StockLedger::where('barang_id', $item->barang_id)
                ->where('gudang_id', $transfer->gudang_asal_id)
                ->sum('jumlah');

            if ($currentStock < $item->jumlah) {
                return $this->errorResponse("Stok tidak mencukupi untuk item ID {$item->barang_id} di gudang asal. Tersedia: {$currentStock}, Diminta: {$item->jumlah}", 422);
            }
        }

        DB::transaction(function () use ($transfer) {
            $transfer->update([
                'status' => 'APPROVED',
                'approved_by' => Auth::id(),
            ]);

            foreach ($transfer->details as $item) {
                // 1. Reduce stock from Origin
                $originBal = StockLedger::where('barang_id', $item->barang_id)->where('gudang_id', $transfer->gudang_asal_id)->sum('jumlah');
                StockLedger::create([
                    'barang_id' => $item->barang_id,
                    'gudang_id' => $transfer->gudang_asal_id,
                    'tipe_transaksi' => 'KELUAR',
                    'referensi_id' => $transfer->id,
                    'jumlah' => -$item->jumlah,
                    'saldo_stock' => $originBal - $item->jumlah,
                ]);

                // 2. Add stock to Destination
                $destBal = StockLedger::where('barang_id', $item->barang_id)->where('gudang_id', $transfer->gudang_tujuan_id)->sum('jumlah');
                StockLedger::create([
                    'barang_id' => $item->barang_id,
                    'gudang_id' => $transfer->gudang_tujuan_id,
                    'tipe_transaksi' => 'MASUK',
                    'referensi_id' => $transfer->id,
                    'jumlah' => $item->jumlah,
                    'saldo_stock' => $destBal + $item->jumlah,
                ]);
            }
        });

        return $this->successResponse(null, 'Transfer gudang disetujui dan stok berhasil dipindahkan.');
    }

    /**
     * Reject transfer.
     */
    public function reject(string $id): JsonResponse
    {
        $transfer = GudangTransfer::find($id);

        if (!$transfer) {
            return $this->errorResponse('Transfer tidak ditemukan.', 404);
        }

        if ($transfer->status !== 'PENDING') {
            return $this->errorResponse('Hanya transfer berstatus PENDING yang dapat ditolak.', 400);
        }

        $transfer->update([
            'status' => 'REJECTED',
            'approved_by' => Auth::id(),
        ]);

        return $this->successResponse(null, 'Transfer gudang telah ditolak.');
    }
}
