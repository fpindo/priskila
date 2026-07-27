'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Button, Badge, Loading, Select2 } from '@priskila/ui';
import {
  Search,
  Plus,
  Eye,
  Loader2,
  ArrowRightLeft,
  RefreshCw,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Warehouse {
  id: number;
  kode_gudang: string;
  nama_gudang: string;
}
interface Barang {
  id: number;
  nama_barang: string;
  sku: string;
  current_stock: number;
}

interface TransferItem {
  id: number;
  nomor_dokumen: string;
  tanggal_transfer: string;
  gudang_asal: { nama_gudang: string } | null;
  gudang_tujuan: { nama_gudang: string } | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  catatan: string | null;
  creator?: { name: string };
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}
interface DetailItem {
  barang_id: string;
  jumlah: number;
}

const emptyDetail = (): DetailItem => ({ barang_id: '', jumlah: 1 });

const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: 'Menunggu', variant: 'warning' },
  APPROVED: { label: 'Disetujui', variant: 'success' },
  REJECTED: { label: 'Ditolak', variant: 'danger' },
};

export default function TransfersPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin');

  const [docs, setDocs] = useState<TransferItem[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Lookups
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [barangAll, setBarangAll] = useState<Barang[]>([]);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nomor_dokumen: '',
    tanggal_transfer: '',
    gudang_asal_id: '',
    gudang_tujuan_id: '',
    catatan: '',
  });
  const [details, setDetails] = useState<DetailItem[]>([emptyDetail()]);
  const [generating, setGenerating] = useState(false);

  // View Modal
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [approving, setApproving] = useState(false);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await ApiService.get<{ code: string }>('/settings/generate-code/nomor_transfer');
      if (res.success && res.data) {
        setFormData((f) => ({ ...f, nomor_dokumen: res.data.code }));
      }
    } catch {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(100 + Math.random() * 900);
      setFormData((f) => ({ ...f, nomor_dokumen: `TRF-${dateStr}-${rand}` }));
    } finally {
      setGenerating(false);
    }
  };

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: 10, page };
      if (search) params.search = search;
      const res = await ApiService.get<PaginatedResponse<TransferItem>>(
        '/inventory/transfers',
        params
      );
      if (res.success && res.data) {
        setDocs(res.data.data);
        setMeta({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  const fetchLookups = useCallback(async () => {
    try {
      const [wRes, bRes] = await Promise.all([
        ApiService.get<{ data: Warehouse[] }>('/warehouses', { limit: 100 }),
        ApiService.get<{ data: Barang[] }>('/barang', { limit: 100 }),
      ]);
      if (wRes.success && wRes.data) setWarehouses(wRes.data.data);
      if (bRes.success && bRes.data) setBarangAll(bRes.data.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchDocs();
    fetchLookups();
  }, [fetchDocs, fetchLookups]);

  const openCreate = () => {
    setFormData({
      nomor_dokumen: '',
      tanggal_transfer: new Date().toISOString().slice(0, 10),
      gudang_asal_id: '',
      gudang_tujuan_id: '',
      catatan: '',
    });
    setDetails([emptyDetail()]);
    setFormError(null);
    setModalOpen(true);
    generateCode();
  };

  const addDetailRow = () => setDetails([...details, emptyDetail()]);
  const removeDetailRow = (idx: number) => setDetails(details.filter((_, i) => i !== idx));
  const updateDetail = (idx: number, field: keyof DetailItem, val: string | number) => {
    setDetails((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const formattedDetails = details.map((d) => ({
        barang_id: Number(d.barang_id),
        jumlah: Number(d.jumlah),
      }));

      await ApiService.post('/inventory/transfers', {
        ...formData,
        gudang_asal_id: Number(formData.gudang_asal_id),
        gudang_tujuan_id: Number(formData.gudang_tujuan_id),
        details: formattedDetails,
      });

      setModalOpen(false);
      fetchDocs();
    } catch (e) {
      setFormError((e as { message?: string }).message || 'Gagal mengirim pengajuan.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: number) => {
    setApproving(true);
    setError(null);
    try {
      const res = await ApiService.post(`/inventory/transfers/${id}/approve`);
      if (res.success) {
        setViewDoc(null);
        fetchDocs();
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal menyetujui transfer.');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (id: number) => {
    setApproving(true);
    setError(null);
    try {
      const res = await ApiService.post(`/inventory/transfers/${id}/reject`);
      if (res.success) {
        setViewDoc(null);
        fetchDocs();
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal menolak transfer.');
    } finally {
      setApproving(false);
    }
  };

  const openView = async (doc: TransferItem) => {
    try {
      const res = await ApiService.get<any>(`/inventory/transfers/${doc.id}`);
      if (res.success) setViewDoc(res.data);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-[#F97316]" />
            Transfer Gudang
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pemindahan stok antar gudang cabang secara terarah.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span>Ajukan Transfer</span>
        </Button>
      </div>

      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nomor dokumen..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
              />
            </div>
            <button
              onClick={fetchDocs}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-slate-500 font-semibold">
                  <th className="px-5 py-3 text-left">No. Dokumen</th>
                  <th className="px-5 py-3 text-left">Tanggal</th>
                  <th className="px-5 py-3 text-left">Asal Gudang</th>
                  <th className="px-5 py-3 text-left">Tujuan Gudang</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <Loading size="sm" />
                    </td>
                  </tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Belum ada transaksi transfer.
                    </td>
                  </tr>
                ) : (
                  docs.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-[#F97316] bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded-lg">
                          {d.nomor_dokumen}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {d.tanggal_transfer}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {d.gudang_asal?.nama_gudang || '-'}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {d.gudang_tujuan?.nama_gudang || '-'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge variant={statusConfig[d.status]?.variant || 'secondary'}>
                          {statusConfig[d.status]?.label || d.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openView(d)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 mb-10">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                Pengajuan Transfer Gudang
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {formError && (
                <Alert variant="danger" title="Error">
                  {formError}
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    No. Dokumen *
                  </label>
                  <div className="flex gap-2">
                    <input
                      required
                      value={formData.nomor_dokumen}
                      onChange={(e) => setFormData({ ...formData, nomor_dokumen: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                      placeholder="TRF-2026-001"
                    />
                    <button
                      type="button"
                      disabled={generating}
                      onClick={generateCode}
                      className="px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-[#F97316] hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1 disabled:opacity-50 text-xs font-semibold shrink-0"
                    >
                      {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      Auto
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Tanggal Transfer *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_transfer}
                    onChange={(e) => setFormData({ ...formData, tanggal_transfer: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Gudang Asal *
                  </label>
                  <Select2
                    required
                    value={formData.gudang_asal_id}
                    onChange={(val) => setFormData({ ...formData, gudang_asal_id: val, gudang_tujuan_id: val === formData.gudang_tujuan_id ? '' : formData.gudang_tujuan_id })}
                    options={warehouses.map((w) => ({ value: w.id, label: w.nama_gudang }))}
                    placeholder="-- Pilih Gudang Asal --"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Gudang Tujuan *
                  </label>
                  <Select2
                    required
                    value={formData.gudang_tujuan_id}
                    onChange={(val) => setFormData({ ...formData, gudang_tujuan_id: val })}
                    options={warehouses
                      .filter((w) => String(w.id) !== formData.gudang_asal_id)
                      .map((w) => ({ value: w.id, label: w.nama_gudang }))}
                    placeholder="-- Pilih Gudang Tujuan --"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Catatan
                </label>
                <textarea
                  rows={2}
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 focus:outline-none resize-none"
                  placeholder="Keterangan transfer..."
                />
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Daftar Barang Transfer
                  </h4>
                  <button
                    type="button"
                    onClick={addDetailRow}
                    className="text-xs font-semibold text-[#F97316] hover:underline"
                  >
                    + Tambah Barang
                  </button>
                </div>
                {details.map((row, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold">
                        Pilih Barang *
                      </label>
                      <Select2
                        required
                        value={row.barang_id}
                        onChange={(val) => updateDetail(idx, 'barang_id', val)}
                        options={barangAll.map((b) => ({ value: b.id, label: `${b.nama_barang} (${b.sku})` }))}
                        placeholder="-- Pilih Barang --"
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold">Jumlah *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={row.jumlah}
                        onChange={(e) => updateDetail(idx, 'jumlah', Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 focus:outline-none"
                      />
                    </div>
                    {details.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDetailRow(idx)}
                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors mb-0.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}Kirim Pengajuan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                Detail Transfer: {viewDoc.nomor_dokumen}
              </h3>
              <button
                onClick={() => setViewDoc(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-semibold">Gudang Asal</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {viewDoc.gudang_asal?.nama_gudang}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Gudang Tujuan</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {viewDoc.gudang_tujuan?.nama_gudang}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Tanggal Transfer</p>
                <p className="font-semibold text-slate-700 dark:text-slate-350">
                  {viewDoc.tanggal_transfer}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Status Dokumen</p>
                <Badge variant={statusConfig[viewDoc.status]?.variant || 'secondary'}>
                  {statusConfig[viewDoc.status]?.label}
                </Badge>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="text-xs text-slate-400 font-semibold mb-2">Item yang ditransfer</p>
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {viewDoc.details?.map((item: any) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between text-xs font-semibold"
                  >
                    <div>
                      <p className="text-slate-800 dark:text-slate-200">
                        {item.barang?.nama_barang}
                      </p>
                      <p className="text-slate-400 text-[10px]">{item.barang?.sku}</p>
                    </div>
                    <p className="font-mono font-bold text-[#F97316]">
                      {item.jumlah} {item.barang?.satuan}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {viewDoc.status === 'PENDING' && isAdmin && (
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={approving}
                  onClick={() => handleReject(viewDoc.id)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
                >
                  <XCircle className="h-4 w-4" /> Tolak
                </button>
                <button
                  disabled={approving}
                  onClick={() => handleApprove(viewDoc.id)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-green-600 hover:bg-green-750 text-white transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="h-4 w-4" /> Setujui
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
