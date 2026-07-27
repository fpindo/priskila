'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Badge, Alert, Loading, Select2 } from '@priskila/ui';
import {
  Search,
  Loader2,
  RefreshCw,
  BarChart2,
  TrendingUp,
  AlertCircle,
  ArrowDown,
} from 'lucide-react';

interface TurnoverItem {
  id: number;
  sku: string;
  nama_barang: string;
  kategori: string;
  current_stock: number;
  units_moved: number;
  tx_count: number;
  classification: 'FAST_MOVING' | 'SLOW_MOVING' | 'DEAD_STOCK';
  classification_label: string;
}

const classBadges: Record<string, string> = {
  FAST_MOVING: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-250',
  SLOW_MOVING: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-250',
  DEAD_STOCK: 'bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-250',
};

export default function TurnoverReportPage() {
  const [data, setData] = useState<TurnoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<string>('');

  const fetchTurnover = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (classificationFilter) params.classification = classificationFilter;

      const res = await ApiService.get<TurnoverItem[]>('/reports/turnover', params);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal memuat analisis perputaran stok.');
    } finally {
      setLoading(false);
    }
  }, [classificationFilter]);

  useEffect(() => {
    fetchTurnover();
  }, [fetchTurnover]);

  // Client side search filtering
  const filteredData = data.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.nama_barang.toLowerCase().includes(s) ||
      item.sku.toLowerCase().includes(s) ||
      item.kategori.toLowerCase().includes(s)
    );
  });

  const getStats = () => {
    const fast = data.filter((x) => x.classification === 'FAST_MOVING').length;
    const slow = data.filter((x) => x.classification === 'SLOW_MOVING').length;
    const dead = data.filter((x) => x.classification === 'DEAD_STOCK').length;
    return { fast, slow, dead };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-[#F97316]" />
            Analisis Perputaran Stok (FSD)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Klasifikasi Fast Moving, Slow Moving, dan Dead Stock berdasarkan volume transaksi 30
            hari terakhir.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shrink-0 print:hidden"
        >
          Cetak Laporan
        </button>
      </div>

      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 print:hidden">
        <Card className="border-emerald-250 bg-emerald-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                Fast Moving
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {stats.fast}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-500 opacity-60" />
          </CardContent>
        </Card>

        <Card className="border-amber-250 bg-amber-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                Slow Moving
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {stats.slow}
              </p>
            </div>
            <ArrowDown className="h-8 w-8 text-amber-500 opacity-60" />
          </CardContent>
        </Card>

        <Card className="border-red-250 bg-red-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">
                Dead Stock
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                {stats.dead}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500 opacity-60" />
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center print:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU, Nama Barang, atau Kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
              />
            </div>
            <div className="flex gap-2">
              <Select2
                value={classificationFilter}
                onChange={(val) => setClassificationFilter(val)}
                options={[
                  { value: '', label: 'Semua Klasifikasi' },
                  { value: 'FAST_MOVING', label: 'Fast Moving' },
                  { value: 'SLOW_MOVING', label: 'Slow Moving' },
                  { value: 'DEAD_STOCK', label: 'Dead Stock' },
                ]}
                placeholder="Klasifikasi"
                className="w-48"
              />
              <button
                onClick={fetchTurnover}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-500 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-slate-500 font-semibold">
                  <th className="px-5 py-3 text-left">SKU</th>
                  <th className="px-5 py-3 text-left">Nama Barang</th>
                  <th className="px-5 py-3 text-left">Kategori</th>
                  <th className="px-5 py-3 text-center">Stok Saat Ini</th>
                  <th className="px-5 py-3 text-center">Unit Terpakai (30 H)</th>
                  <th className="px-5 py-3 text-center">Frekuensi Transaksi</th>
                  <th className="px-5 py-3 text-right">Klasifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <div className="flex justify-center">
                        <Loading size="sm" />
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Belum ada data barang terekam.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-xs text-[#F97316]">
                        {item.sku}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                        {item.nama_barang}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                        {item.kategori}
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-bold">
                        {item.current_stock}
                      </td>
                      <td className="px-5 py-4 text-center font-mono">{item.units_moved}</td>
                      <td className="px-5 py-4 text-center font-mono">{item.tx_count} kali</td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${classBadges[item.classification] || 'bg-slate-100 text-slate-500'}`}
                        >
                          {item.classification_label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
