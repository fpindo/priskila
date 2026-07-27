'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Button, Loading, Select2 } from '@priskila/ui';
import { Search, Plus, Eye, Loader2, RefreshCw, X, Trash2, Zap, Scale } from 'lucide-react';

interface Warehouse {
  id: number;
  nama_gudang: string;
}
interface Barang {
  id: number;
  nama_barang: string;
  sku: string;
}

interface AdjustmentItem {
  id: number;
  nomor_dokumen: string;
  tanggal_adjustment: string;
  gudang: { nama_gudang: string } | null;
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

const emptyDetail = (): DetailItem => ({ barang_id: '', jumlah: 0 });

export default function AdjustmentsPage() {
  const [docs, setDocs] = useState<AdjustmentItem[]>([]);
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
    tanggal_adjustment: '',
    gudang_id: '',
    catatan: '',
  });
  const [details, setDetails] = useState<DetailItem[]>([emptyDetail()]);

  // View Modal
  const [viewDoc, setViewDoc] = useState<any>(null);

  const [generating, setGenerating] = useState(false);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await ApiService.get<{ code: string }>('/settings/generate-code/nomor_adjustment');
      if (res.success && res.data) {
        setFormData((f) => ({ ...f, nomor_dokumen: res.data.code }));
      }
    } catch {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(100 + Math.random() * 900);
      setFormData((f) => ({ ...f, nomor_dokumen: `ADJ-${dateStr}-${rand}` }));
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
      const res = await ApiService.get<PaginatedResponse<AdjustmentItem>>(
        '/inventory/adjustments',
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
      tanggal_adjustment: new Date().toISOString().slice(0, 10),
      gudang_id: '',
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

      await ApiService.post('/inventory/adjustments', {
        ...formData,
        gudang_id: Number(formData.gudang_id),
        details: formattedDetails,
      });

      setModalOpen(false);
      fetchDocs();
    } catch (e) {
      setFormError((e as { message?: string }).message || 'Gagal menyimpan adjustment.');
    } finally {
      setSaving(false);
    }
  };

  const openView = async (doc: AdjustmentItem) => {
    try {
      const res = await ApiService.get<any>(`/inventory/adjustments/${doc.id}`);
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
            <Scale className="h-5 w-5 text-[#F97316]" />
            Stock Adjustment
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Penyesuaian stok barang (tambah/kurang) untuk selisih transaksi.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span>Buat Adjustment</span>
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
                  <th className="px-5 py-3 text-left">Gudang</th>
                  <th className="px-5 py-3 text-left">Catatan</th>
                  <th className="px-5 py-3 text-left">Oleh</th>
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
                      Belum ada data adjustment.
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
                        {d.tanggal_adjustment}
                      </td>
                      <td className="px-5 py-4 font-semibold">{d.gudang?.nama_gudang || '-'}</td>
                      <td className="px-5 py-4 text-xs max-w-[200px] truncate">
                        {d.catatan || '-'}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                        {d.creator?.name || 'System'}
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
                Buat Penyesuaian Stok (Adjustment)
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
                      placeholder="ADJ-2026-001"
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
                    Tanggal Adjustment *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_adjustment}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggal_adjustment: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Gudang *
                </label>
                <Select2
                  required
                  value={formData.gudang_id}
                  onChange={(val) => setFormData({ ...formData, gudang_id: val })}
                  options={warehouses.map((w) => ({ value: w.id, label: w.nama_gudang }))}
                  placeholder="-- Pilih Lokasi Gudang --"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Catatan / Alasan Penyesuaian
                </label>
                <textarea
                  rows={2}
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 focus:outline-none resize-none"
                  placeholder="Misal: Barang rusak, salah pencatatan awal, dll..."
                />
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Daftar Penyesuaian Barang
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
                    <div className="w-36 space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold">
                        Jumlah Mutasi *
                      </label>
                      <input
                        type="number"
                        required
                        value={row.jumlah}
                        onChange={(e) => updateDetail(idx, 'jumlah', Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 focus:outline-none"
                        placeholder="+/- angka"
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
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}Simpan Adjustment
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
                Detail Adjustment: {viewDoc.nomor_dokumen}
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
                <p className="text-slate-400 font-semibold">Gudang</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {viewDoc.gudang?.nama_gudang}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Tanggal Adjustment</p>
                <p className="font-semibold text-slate-700 dark:text-slate-350">
                  {viewDoc.tanggal_adjustment}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 font-semibold">Catatan / Alasan</p>
                <p className="text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                  {viewDoc.catatan || '-'}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="text-xs text-slate-400 font-semibold mb-2">Item Penyesuaian</p>
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
                    <p
                      className={`font-mono font-bold ${item.jumlah >= 0 ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {item.jumlah >= 0 ? `+${item.jumlah}` : item.jumlah} {item.barang?.satuan}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
