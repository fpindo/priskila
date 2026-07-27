'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Badge, Loading } from '@priskila/ui';
import {
  Search,
  Loader2,
  FileBarChart,
  RefreshCw,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';

interface StockItem {
  id: number;
  sku: string;
  nama_barang: string;
  kategori: string;
  satuan: string;
  min_stock: number;
  effective_min_stock?: number;
  current_stock: number;
  status_stock: 'SAFE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface StockCardEntry {
  id: number;
  tanggal: string;
  project: { kode_project: string; nama_project: string } | null;
  tipe_transaksi: 'MASUK' | 'KELUAR';
  jumlah: number;
  saldo_stock: number;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

const stockStatusConfig: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger'; icon: React.ReactNode }
> = {
  SAFE: { label: 'Aman', variant: 'success', icon: <CheckCircle className="h-4 w-4" /> },
  LOW_STOCK: { label: 'Menipis', variant: 'warning', icon: <AlertTriangle className="h-4 w-4" /> },
  OUT_OF_STOCK: { label: 'Habis', variant: 'danger', icon: <TrendingDown className="h-4 w-4" /> },
};

export default function ReportsPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [page, setPage] = useState(1);

  const [stockCardItem, setStockCardItem] = useState<StockItem | null>(null);
  const [stockCardEntries, setStockCardEntries] = useState<StockCardEntry[]>([]);
  const [loadingCard, setLoadingCard] = useState(false);

  // Summary counts
  const safeCount = items.filter((i) => i.status_stock === 'SAFE').length;
  const lowCount = items.filter((i) => i.status_stock === 'LOW_STOCK').length;
  const outCount = items.filter((i) => i.status_stock === 'OUT_OF_STOCK').length;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: 15, page };
      if (search) params.search = search;
      if (filterLowStock) params.low_stock = 'true';
      const res = await ApiService.get<PaginatedResponse<StockItem>>('/reports/stock', params);
      if (res.success && res.data) {
        setItems(res.data.data);
        setMeta({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal memuat data laporan.');
    } finally {
      setLoading(false);
    }
  }, [search, filterLowStock, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openStockCard = async (item: StockItem) => {
    setStockCardItem(item);
    setStockCardEntries([]);
    setLoadingCard(true);
    try {
      const res = await ApiService.get<{ barang: StockItem; entries: StockCardEntry[] }>(
        `/reports/stock-card/${item.id}`
      );
      if (res.success && res.data) {
        setStockCardEntries(res.data.entries);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingCard(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Laporan Stock</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Pantau kondisi stock barang secara real-time.
        </p>
      </div>

      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{safeCount}</p>
              <p className="text-xs text-slate-500">Stock Aman</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{lowCount}</p>
              <p className="text-xs text-slate-500">Stock Menipis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{outCount}</p>
              <p className="text-xs text-slate-500">Stock Habis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU atau nama barang..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => {
                  setFilterLowStock(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-slate-300 text-[#F97316] focus:ring-[#F97316]"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Tampilkan yang menipis saja
              </span>
            </label>
            <button
              onClick={fetchItems}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    SKU
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Nama Barang
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Kategori
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Stock Saat Ini
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Min. Stock
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Kartu Stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Loading size="sm" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <FileBarChart className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500 text-sm">Belum ada data stock.</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const cfg = stockStatusConfig[item.status_stock];
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${item.status_stock === 'OUT_OF_STOCK' ? 'bg-red-50/30 dark:bg-red-950/10' : item.status_stock === 'LOW_STOCK' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-semibold text-[#F97316] bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded-lg">
                            {item.sku}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                          {item.nama_barang}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                          {item.kategori}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`font-bold text-lg ${item.status_stock === 'OUT_OF_STOCK' ? 'text-red-500' : item.status_stock === 'LOW_STOCK' ? 'text-amber-500' : 'text-slate-800 dark:text-slate-200'}`}
                          >
                            {item.current_stock}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">{item.satuan}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                          {item.effective_min_stock ?? item.min_stock} {item.satuan}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => openStockCard(item)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-[#F97316] hover:text-white hover:border-[#F97316] text-slate-600 dark:text-slate-400 transition-colors"
                          >
                            Lihat
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && items.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">Total {meta.total} item</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  &larr; Sebelumnya
                </button>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {meta.current_page} / {meta.last_page}
                </span>
                <button
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Selanjutnya &rarr;
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Card Modal */}
      {stockCardItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 mb-10">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-50">Kartu Stock</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stockCardItem.sku} — {stockCardItem.nama_barang}
                </p>
              </div>
              <button
                onClick={() => setStockCardItem(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              {loadingCard ? (
                <div className="flex items-center justify-center py-12">
                  <Loading size="sm" />
                </div>
              ) : stockCardEntries.length === 0 ? (
                <div className="text-center py-12">
                  <FileBarChart className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">Belum ada transaksi untuk barang ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                          Tipe
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                          Project
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Jumlah
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stockCardEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                            {new Date(entry.tanggal).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={entry.tipe_transaksi === 'MASUK' ? 'success' : 'danger'}
                            >
                              {entry.tipe_transaksi === 'MASUK' ? '+ MASUK' : '- KELUAR'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                            {entry.project?.nama_project || '-'}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${entry.jumlah > 0 ? 'text-emerald-600' : 'text-red-500'}`}
                          >
                            {entry.jumlah > 0 ? '+' : ''}
                            {entry.jumlah}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                            {entry.saldo_stock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setStockCardItem(null)}
                className="w-full py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
