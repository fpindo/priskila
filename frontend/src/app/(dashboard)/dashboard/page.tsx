'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ApiService } from '@priskila/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Loading,
  Alert,
  Button,
} from '@priskila/ui';
import {
  Briefcase,
  Package,
  Truck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  Plus,
  Coins,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Scale,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  total_projects: number;
  total_barang: number;
  total_suppliers: number;
  low_stock_count: number;
  total_inventory_value: number;
  inbound_30_days: number;
  outbound_30_days: number;
  recent_activities: Array<{
    id: number;
    type: string;
    message: string;
    time: string;
  }>;
  chart_data: Array<{
    name: string;
    inbound: number;
    outbound: number;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get<DashboardStats>('/dashboard');
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Gagal memuat statistik.');
      }
    } catch (err) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" title="Kesalahan Sistem" className="my-6">
        {error}
      </Alert>
    );
  }

  // Define KPI Cards
  const kpiCards = [
    {
      title: 'Total Project',
      value: stats?.total_projects || 0,
      description: 'Konstruksi & Elektrikal',
      icon: Briefcase,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      link: '/projects',
    },
    {
      title: 'Total Barang',
      value: stats?.total_barang || 0,
      description: 'Item stock di gudang',
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      link: '/barang',
    },
    {
      title: 'Total Supplier',
      value: stats?.total_suppliers || 0,
      description: 'Mitra logistik terdaftar',
      icon: Truck,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/20',
      link: '/suppliers',
    },
    {
      title: 'Stock Menipis',
      value: stats?.low_stock_count || 0,
      description: 'Item di bawah batas minimum',
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-950/20',
      link: '/reports/stock',
    },
  ];

  // Secondary metrics
  const secondaryKpis = [
    {
      title: 'Nilai Inventory',
      value: formatIDR(stats?.total_inventory_value || 0),
      description: 'Valuasi total aset gudang',
      icon: Coins,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    },
    {
      title: 'Barang Masuk (30 H)',
      value: `${stats?.inbound_30_days || 0} unit`,
      description: 'Total penerimaan barang',
      icon: ArrowDownToLine,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 dark:bg-cyan-950/20',
    },
    {
      title: 'Barang Keluar (30 H)',
      value: `${stats?.outbound_30_days || 0} unit`,
      description: 'Total pengeluaran barang',
      icon: ArrowUpFromLine,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-950/20',
    },
  ];

  // SVG Chart Dimensions & Computations
  const chartHeight = 200;
  const chartWidth = 500;
  const chartData = stats?.chart_data || [];
  const maxVal = Math.max(...chartData.map((d) => Math.max(d.inbound, d.outbound, 10)));
  const yPadding = 30;
  const xPadding = 40;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Sistem Inventori & Logistik
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Selamat Datang Kembali, {user?.name}!
          </h2>
          <p className="text-orange-50 text-sm max-w-2xl font-medium">
            Anda login sebagai{' '}
            <span className="font-semibold capitalize">{user?.roles?.[0] || 'Staff'}</span>. Kelola
            data master gudang, buat dokumen barang masuk, atau ajukan pemakaian barang konstruksi
            dengan cepat.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center w-1/3 pointer-events-none">
          <TrendingUp className="h-48 w-48" />
        </div>
      </div>

      {/* Grid KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="hover:scale-[1.01] transition-transform duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">PRISKILA</span>
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {card.value}
                  </h3>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {card.title}
                  </p>
                  <p className="text-xs text-slate-500">{card.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                  <Link
                    href={card.link}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#F97316] hover:underline"
                  >
                    <span>Lihat detail</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grid Secondary MVP Metrics (Nilai Inventory, Inbound, Outbound sums) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {secondaryKpis.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="bg-white dark:bg-slate-900/40">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${card.bg} ${card.color} shrink-0`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    {card.title}
                  </p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-slate-50 mt-0.5">
                    {card.value}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart Section */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Riwayat Keluar Masuk Barang</CardTitle>
              <CardDescription>
                Visualisasi jumlah unit barang masuk vs keluar selama 6 bulan terakhir.
              </CardDescription>
            </div>
            <button
              onClick={fetchStats}
              className="p-1.5 rounded-lg border hover:bg-slate-50 text-slate-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-6">
            {chartData.length > 0 ? (
              <div className="w-full space-y-4">
                {/* SVG Chart */}
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-fit overflow-visible"
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                    const y = yPadding + (chartHeight - yPadding * 2) * (1 - p);
                    return (
                      <g key={idx}>
                        <line
                          x1={xPadding}
                          y1={y}
                          x2={chartWidth - 20}
                          y2={y}
                          stroke="#E2E8F0"
                          strokeDasharray="3 3"
                          className="stroke-slate-200 dark:stroke-slate-800"
                        />
                        <text
                          x={xPadding - 8}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-slate-400 text-[10px] font-mono"
                        >
                          {Math.round(maxVal * p)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Render Bars */}
                  {chartData.map((d, idx) => {
                    const colWidth = (chartWidth - xPadding - 30) / chartData.length;
                    const x = xPadding + idx * colWidth + 15;
                    const chartAreaHeight = chartHeight - yPadding * 2;

                    const barHeightIn = (d.inbound / maxVal) * chartAreaHeight;
                    const barHeightOut = (d.outbound / maxVal) * chartAreaHeight;

                    const yIn = chartHeight - yPadding - barHeightIn;
                    const yOut = chartHeight - yPadding - barHeightOut;

                    return (
                      <g key={idx}>
                        {/* Inbound Bar (Orange) */}
                        <rect
                          x={x}
                          y={yIn}
                          width={colWidth / 2.8}
                          height={Math.max(barHeightIn, 2)}
                          rx="3"
                          fill="#F97316"
                          className="transition-all hover:opacity-80"
                        />
                        {/* Outbound Bar (Slate/Dark Blue) */}
                        <rect
                          x={x + colWidth / 2.5}
                          y={yOut}
                          width={colWidth / 2.8}
                          height={Math.max(barHeightOut, 2)}
                          rx="3"
                          fill="#475569"
                          className="transition-all hover:opacity-80"
                        />
                        {/* X Axis Labels */}
                        <text
                          x={x + colWidth / 3}
                          y={chartHeight - yPadding + 15}
                          textAnchor="middle"
                          className="fill-slate-500 text-[9px] font-semibold"
                        >
                          {d.name}
                        </text>
                      </g>
                    );
                  })}
                  <line
                    x1={xPadding}
                    y1={chartHeight - yPadding}
                    x2={chartWidth - 20}
                    y2={chartHeight - yPadding}
                    stroke="#94A3B8"
                  />
                </svg>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#F97316]" />
                    <span className="text-slate-600 dark:text-slate-400">Barang Masuk (unit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">Barang Keluar (unit)</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Tidak ada data transaksi chart.</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Jalan pintas pembuatan dokumen & input transaksi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <Link href="/barang-masuk" className="block">
              <Button variant="primary" className="w-full justify-start py-3 text-sm">
                <Plus className="h-4 w-4" />
                <span>Perekaman Barang Masuk</span>
              </Button>
            </Link>
            <Link href="/pemakaian-barang" className="block">
              <Button variant="secondary" className="w-full justify-start py-3 text-sm">
                <Plus className="h-4 w-4" />
                <span>Permintaan Pemakaian</span>
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link href="/inventory/transfers" className="block">
                <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                  Transfer Gudang
                </button>
              </Link>
              <Link href="/inventory/adjustments" className="block">
                <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                  Adjustment Stok
                </button>
              </Link>
            </div>
            <Link href="/inventory/opname" className="block">
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl bg-orange-50 text-[#F97316] hover:bg-orange-100 transition-colors">
                <Scale className="h-3.5 w-3.5" />
                <span>Mulai Stock Opname Fisik</span>
              </button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activities Timeline */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Aktivitas Terkini (Real-time)</CardTitle>
              <CardDescription>Log mutasi database dan audit perubahan terkini.</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            {stats?.recent_activities && stats.recent_activities.length > 0 ? (
              <div className="relative pl-6 border-l border-slate-100 dark:border-slate-800 space-y-6">
                {stats.recent_activities.map((activity) => (
                  <div key={activity.id} className="relative">
                    {/* Timeline Node */}
                    <span className="absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-100 text-[#F97316] ring-4 ring-white dark:ring-slate-900">
                      <div className="h-2 w-2 rounded-full bg-[#F97316]" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {activity.message}
                      </p>
                      <span className="text-xs text-slate-400 font-semibold block">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center text-center">
                <Activity className="h-8 w-8 text-slate-350 mb-2" />
                <p className="text-sm font-medium text-slate-500">Belum ada aktivitas terekam.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
