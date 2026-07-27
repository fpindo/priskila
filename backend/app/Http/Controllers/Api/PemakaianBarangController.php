<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Core\PemakaianBarangRequest;
use App\Models\Barang;
use App\Models\PemakaianBarang;
use App\Models\PemakaianBarangDetail;
use App\Models\StockLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PemakaianBarangController extends Controller
{
    /**
     * Display a listing of consumption documents.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PemakaianBarang::with(['project', 'creator', 'approver']);

        if ($request->has('status_approval') && $request->status_approval !== '') {
            $query->where('status_approval', $request->status_approval);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nomor_dokumen', 'like', "%{$search}%");
        }

        $documents = $query->latest()->paginate($request->get('limit', 10));

        return $this->successResponse($documents, 'Consumption requests retrieved successfully');
    }

    /**
     * Store a newly created consumption request (Status: PENDING).
     */
    public function store(PemakaianBarangRequest $request): JsonResponse
    {
        $data = $request->validated();

        DB::beginTransaction();
        try {
            // Create Consumption Header
            $pemakaian = PemakaianBarang::create([
                'nomor_dokumen' => $data['nomor_dokumen'],
                'tanggal_pemakaian' => $data['tanggal_pemakaian'],
                'project_id' => $data['project_id'],
                'keterangan' => $data['keterangan'] ?? null,
                'status_approval' => 'PENDING',
                'created_by' => $request->user()->id,
            ]);

            // Save Details
            foreach ($data['items'] as $item) {
                PemakaianBarangDetail::create([
                    'pemakaian_barang_id' => $pemakaian->id,
                    'barang_id' => $item['barang_id'],
                    'jumlah' => $item['jumlah'],
                    'catatan' => $item['catatan'] ?? null,
                ]);
            }

            DB::commit();

            return $this->successResponse(
                $pemakaian->load(['project', 'details.barang']),
                'Consumption request submitted and pending approval',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to create request: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display details of a consumption request.
     */
    public function show(string $id): JsonResponse
    {
        $pemakaian = PemakaianBarang::with(['project', 'creator', 'approver', 'details.barang'])->find($id);

        if (!$pemakaian) {
            return $this->errorResponse('Consumption request not found', 404);
        }

        return $this->successResponse($pemakaian, 'Consumption request details retrieved successfully');
    }

    /**
     * Approve consumption request and deduct stock ledger.
     */
    public function approve(string $id, Request $request): JsonResponse
    {
        $pemakaian = PemakaianBarang::with('details.barang')->find($id);

        if (!$pemakaian) {
            return $this->errorResponse('Consumption request not found', 404);
        }

        if ($pemakaian->status_approval !== 'PENDING') {
            return $this->errorResponse("Request cannot be approved. Current status is: {$pemakaian->status_approval}.", 400);
        }

        DB::beginTransaction();
        try {
            // 1. Verify all items have sufficient stock
            foreach ($pemakaian->details as $detail) {
                $barang = $detail->barang;
                if ($barang->current_stock < $detail->jumlah) {
                    return $this->errorResponse(
                        "Insufficient stock for item '{$barang->nama_barang}'. Available: {$barang->current_stock}, Requested: {$detail->jumlah}",
                        422
                    );
                }
            }

            // 2. Perform Stock Deduction (Write to Stock Ledgers)
            foreach ($pemakaian->details as $detail) {
                $barang = $detail->barang;
                $currentStock = $barang->current_stock;
                $newStock = $currentStock - $detail->jumlah;

                StockLedger::create([
                    'barang_id' => $detail->barang_id,
                    'project_id' => $pemakaian->project_id,
                    'tipe_transaksi' => 'KELUAR',
                    'referensi_id' => $pemakaian->id,
                    'jumlah' => -$detail->jumlah, // negative balance
                    'saldo_stock' => $newStock,
                ]);
            }

            // 3. Mark Header Approved
            $pemakaian->update([
                'status_approval' => 'APPROVED',
                'approved_by' => $request->user()->id,
            ]);

            DB::commit();

            return $this->successResponse($pemakaian->refresh(), 'Consumption request approved and stock deducted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to approve request: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reject consumption request.
     */
    public function reject(string $id, Request $request): JsonResponse
    {
        $pemakaian = PemakaianBarang::find($id);

        if (!$pemakaian) {
            return $this->errorResponse('Consumption request not found', 404);
        }

        if ($pemakaian->status_approval !== 'PENDING') {
            return $this->errorResponse("Request cannot be rejected. Current status is: {$pemakaian->status_approval}.", 400);
        }

        $pemakaian->update([
            'status_approval' => 'REJECTED',
            'approved_by' => $request->user()->id,
        ]);

        return $this->successResponse($pemakaian, 'Consumption request rejected successfully');
    }
}
