<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Core\BarangMasukRequest;
use App\Models\Barang;
use App\Models\BarangMasuk;
use App\Models\BarangMasukDetail;
use App\Models\StockLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BarangMasukController extends Controller
{
    /**
     * Display a listing of Goods Inbound documents.
     */
    public function index(Request $request): JsonResponse
    {
        $query = BarangMasuk::with(['supplier', 'project', 'creator']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nomor_dokumen', 'like', "%{$search}%");
        }

        $documents = $query->latest()->paginate($request->get('limit', 10));

        return $this->successResponse($documents, 'Goods Inbound documents retrieved successfully');
    }

    /**
     * Store a newly created Goods Inbound document.
     */
    public function store(BarangMasukRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        DB::beginTransaction();
        try {
            // Handle file attachment
            $attachmentPath = null;
            if ($request->hasFile('attachment')) {
                $attachmentPath = $request->file('attachment')->store('attachments', 'public');
            }

            // Create Inbound Header
            $barangMasuk = BarangMasuk::create([
                'nomor_dokumen' => $data['nomor_dokumen'],
                'tanggal_masuk' => $data['tanggal_masuk'],
                'supplier_id' => $data['supplier_id'],
                'project_id' => $data['project_id'] ?? null,
                'catatan' => $data['catatan'] ?? null,
                'attachment_path' => $attachmentPath ? asset('storage/' . $attachmentPath) : null,
                'created_by' => $request->user()->id,
            ]);

            // Create Details & Stock Ledger Entries
            foreach ($data['items'] as $item) {
                // Save Detail
                BarangMasukDetail::create([
                    'barang_masuk_id' => $barangMasuk->id,
                    'barang_id' => $item['barang_id'],
                    'jumlah' => $item['jumlah'],
                    'harga_satuan' => $item['harga_satuan'] ?? null,
                    'catatan' => $item['catatan'] ?? null,
                ]);

                // Query item to get current stock and add stock ledger
                $barang = Barang::findOrFail($item['barang_id']);
                $currentStock = $barang->current_stock;
                $newStock = $currentStock + $item['jumlah'];

                StockLedger::create([
                    'barang_id' => $item['barang_id'],
                    'project_id' => $barangMasuk->project_id,
                    'tipe_transaksi' => 'MASUK',
                    'referensi_id' => $barangMasuk->id,
                    'jumlah' => $item['jumlah'],
                    'saldo_stock' => $newStock,
                ]);
            }

            DB::commit();

            return $this->successResponse(
                $barangMasuk->load(['supplier', 'project', 'details.barang']),
                'Goods Inbound recorded and stock updated successfully',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to record transaction: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display details of a Goods Inbound document.
     */
    public function show(string $id): JsonResponse
    {
        $barangMasuk = BarangMasuk::with(['supplier', 'project', 'creator', 'details.barang'])->find($id);

        if (!$barangMasuk) {
            return $this->errorResponse('Inbound document not found', 404);
        }

        return $this->successResponse($barangMasuk, 'Inbound document details retrieved successfully');
    }
}
