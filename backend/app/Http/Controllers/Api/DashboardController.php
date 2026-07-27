<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Barang;
use App\Models\Supplier;
use App\Models\StockLedger;
use App\Models\ActivityLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $totalProjects = Project::count();
        $totalBarang = Barang::count();
        $totalSuppliers = Supplier::count();

        // Calculate low stock count
        $lowStockCount = Barang::all()->filter(function ($b) {
            return $b->current_stock < $b->effective_min_stock;
        })->count();

        // Calculate total inventory value
        $totalInventoryValue = Barang::all()->sum(function ($b) {
            return $b->current_stock * ($b->harga_satuan ?? 0);
        });

        // 30 Days transaction sums
        $inbound30Days = StockLedger::where('tipe_transaksi', 'MASUK')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('jumlah');

        // Outbound is recorded as negative in KELUAR ledger
        $outbound30Days = abs(StockLedger::where('tipe_transaksi', 'KELUAR')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('jumlah'));

        // Recent activities
        $activities = ActivityLog::with('user')
            ->latest()
            ->take(6)
            ->get()
            ->map(function ($act) {
                return [
                    'id' => $act->id,
                    'type' => strtolower($act->method),
                    'message' => ($act->user ? $act->user->name : 'System') . ' ' . strtolower($act->activity),
                    'time' => $act->created_at->diffForHumans(),
                ];
            });

        // Generate 6-month chart data
        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $start = $month->copy()->startOfMonth();
            $end = $month->copy()->endOfMonth();

            $in = StockLedger::where('tipe_transaksi', 'MASUK')
                ->whereBetween('created_at', [$start, $end])
                ->sum('jumlah');

            $out = abs(StockLedger::where('tipe_transaksi', 'KELUAR')
                ->whereBetween('created_at', [$start, $end])
                ->sum('jumlah'));

            $chartData[] = [
                'name' => $month->translatedFormat('M Y'),
                'inbound' => (int) $in,
                'outbound' => (int) $out,
            ];
        }

        return $this->successResponse([
            'total_projects' => $totalProjects,
            'total_barang' => $totalBarang,
            'total_suppliers' => $totalSuppliers,
            'low_stock_count' => $lowStockCount,
            'total_inventory_value' => $totalInventoryValue,
            'inbound_30_days' => (int) $inbound30Days,
            'outbound_30_days' => (int) $outbound30Days,
            'recent_activities' => $activities,
            'chart_data' => $chartData,
        ], 'Dashboard statistics retrieved successfully');
    }
}
