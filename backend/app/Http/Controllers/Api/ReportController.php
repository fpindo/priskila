<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\StockLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Get the general stock inventory report.
     */
    public function stockReport(Request $request): JsonResponse
    {
        $query = Barang::query();

        // Optional: search by SKU/Name
        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")
                  ->orWhere('nama_barang', 'like', "%{$search}%");
            });
        }

        // Optional: filter by category
        if ($request->has('kategori') && $request->kategori !== '') {
            $query->where('kategori', $request->kategori);
        }

        // Optional: filter items below minimum stock level
        if ($request->has('low_stock') && $request->low_stock === 'true') {
            $globalMin = (int) (\App\Models\Setting::getConfig('min_stock_global')['min_stock'] ?? 0);
            $query->whereRaw('(select coalesce(sum(jumlah), 0) from stock_ledgers where stock_ledgers.barang_id = barang.id) < coalesce(nullif(min_stock, 0), ?)', [$globalMin]);
        }

        $items = $query->paginate($request->get('limit', 15));

        // Format items output with safety status flags
        $items->getCollection()->transform(function ($item) {
            $currentStock = $item->current_stock;
            $minStock = $item->effective_min_stock;
            return [
                'id' => $item->id,
                'sku' => $item->sku,
                'barcode' => $item->barcode,
                'nama_barang' => $item->nama_barang,
                'kategori' => $item->kategori,
                'satuan' => $item->satuan,
                'min_stock' => $item->min_stock,
                'effective_min_stock' => $minStock,
                'current_stock' => $currentStock,
                'status_stock' => $currentStock <= 0 ? 'OUT_OF_STOCK' : ($currentStock < $minStock ? 'LOW_STOCK' : 'SAFE'),
                'image_url' => $item->image_url,
            ];
        });

        return $this->successResponse($items, 'Stock report generated successfully');
    }

    /**
     * Get the transaction stock card ledger for a specific item.
     */
    public function stockCard(string $barangId, Request $request): JsonResponse
    {
        $barang = Barang::find($barangId);

        if (!$barang) {
            return $this->errorResponse('Item not found', 404);
        }

        $query = StockLedger::where('barang_id', $barangId)
            ->with(['project']);

        // Optional filters
        if ($request->has('project_id') && $request->project_id !== '') {
            $query->where('project_id', $request->project_id);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        }

        $ledgerEntries = $query->orderBy('created_at', 'asc')->get();

        // Map entries and append transaction document references if needed
        $cards = $ledgerEntries->map(function ($entry) {
            return [
                'id' => $entry->id,
                'tanggal' => $entry->created_at->toIso8601String(),
                'project' => $entry->project ? [
                    'id' => $entry->project->id,
                    'kode_project' => $entry->project->kode_project,
                    'nama_project' => $entry->project->nama_project
                ] : null,
                'tipe_transaksi' => $entry->tipe_transaksi,
                'referensi_id' => $entry->referensi_id,
                'jumlah' => $entry->jumlah,
                'saldo_stock' => $entry->saldo_stock,
            ];
        });

        return $this->successResponse([
            'barang' => [
                'id' => $barang->id,
                'sku' => $barang->sku,
                'nama_barang' => $barang->nama_barang,
                'satuan' => $barang->satuan,
                'current_stock' => $barang->current_stock,
            ],
            'entries' => $cards
        ], 'Stock card ledger retrieved successfully');
    }

    /**
     * Get stock turnover analysis (Fast / Slow / Dead Stock).
     */
    public function turnoverReport(Request $request): JsonResponse
    {
        $items = Barang::all();
        $thirtyDaysAgo = now()->subDays(30);

        $classified = $items->map(function ($item) use ($thirtyDaysAgo) {
            // Get total absolute units moved (both in and out) in last 30 days
            $unitsMoved = abs(StockLedger::where('barang_id', $item->id)
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->sum('jumlah'));

            $txCount = StockLedger::where('barang_id', $item->id)
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->count();

            // Classification logic
            if ($txCount === 0 || $unitsMoved === 0) {
                $category = 'DEAD_STOCK';
                $label = 'Dead Stock (0 mutasi)';
            } elseif ($unitsMoved > 50 || $txCount >= 5) {
                $category = 'FAST_MOVING';
                $label = 'Fast Moving';
            } else {
                $category = 'SLOW_MOVING';
                $label = 'Slow Moving';
            }

            return [
                'id' => $item->id,
                'sku' => $item->sku,
                'nama_barang' => $item->nama_barang,
                'kategori' => $item->kategori,
                'current_stock' => $item->current_stock,
                'units_moved' => (int) $unitsMoved,
                'tx_count' => $txCount,
                'classification' => $category,
                'classification_label' => $label,
            ];
        });

        // Optional filtering by classification
        if ($request->has('classification') && $request->classification !== '') {
            $classFilter = $request->classification;
            $classified = $classified->filter(function ($item) use ($classFilter) {
                return $item['classification'] === $classFilter;
            })->values();
        }

        return $this->successResponse($classified, 'Stock turnover report generated successfully');
    }
}
