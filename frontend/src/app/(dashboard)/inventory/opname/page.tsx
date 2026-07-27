'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Button, Badge, Loading, Select2 } from '@priskila/ui';
import {
  Search,
  Plus,
  Eye,
  Loader2,
  RefreshCw,
  X,
  Zap,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';

interface Warehouse {
  id: number;
  nama_gudang: string;
}

interface OpnameItem {
  id: number;
  nomor_dokumen: string;
  tanggal_opname: string;
  gudang: { nama_gudang: string } | null;
  status: 'DRAFT' | 'FINAL';
  catatan: string | null;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export default function OpnamesPage() {
  const [docs, setDocs] = useState<OpnameItem[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Lookups
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nomor_dokumen: '',
    tanggal_opname: '',
    gudang_id: '',
    catatan: '',
  });

  // View / Edit Draft Modal
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [editDetails, setEditDetails] = useState<
    Array<{
      id: number;
      barang: { nama_barang: string; sku: string };
      stok_sistem: number;
      stok_fisik: number;
      selisih: number;
    }>
  >([]);
  const [updatingDraft, setUpdatingDraft] = useState(false);

  const [generating, setGenerating] = useState(false);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await ApiService.get<{ code: string }>('/settings/generate-code/nomor_opname');
      if (res.success && res.data) {
        setFormData((f) => ({ ...f, nomor_dokumen: res.data.code }));
      }
    } catch {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(100 + Math.random() * 900);
      setFormData((f) => ({ ...f, nomor_dokumen: `OPN-${dateStr}-${rand}` }));
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
      const res = await ApiService.get<PaginatedResponse<OpnameItem>>('/inventory/opnames', params);
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
      const wRes = await ApiService.get<{ data: Warehouse[] }>('/warehouses', { limit: 100 });
      if (wRes.success && wRes.data) setWarehouses(wRes.data.data);
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
      tanggal_opname: new Date().toISOString().slice(0, 10),
      gudang_id: '',
      catatan: '',
    });
    setFormError(null);
    setModalOpen(true);
    generateCode();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await ApiService.post<any>('/inventory/opnames', {
        ...formData,
        gudang_id: Number(formData.gudang_id),
      });
      setModalOpen(false);
      fetchDocs();
      // Directly open the created draft for edit
      if (res.success && res.data) {
        openView(res.data);
      }
    } catch (e) {
      setFormError((e as { message?: string }).message || 'Gagal membuat opname.');
    } finally {
      setSaving(false);
    }
  };

  const openView = async (doc: OpnameItem) => {
    try {
      const res = await ApiService.get<any>(`/inventory/opnames/${doc.id}`);
      if (res.success) {
        setViewDoc(res.data);
        setEditDetails(res.data.details || []);
      }
    } catch {
      /* ignore */
    }
  };

  const handleUpdatePhysical = (idx: number, physicalVal: number) => {
    setEditDetails((prev) => {
      const next = [...prev];
      const selisih = physicalVal - next[idx].stok_sistem;
      next[idx] = { ...next[idx], stok_fisik: physicalVal, selisih };
      return next;
    });
  };

  const saveDraftChanges = async () => {
    if (!viewDoc) return;
    setUpdatingDraft(true);
    try {
      await ApiService.put(`/inventory/opnames/${viewDoc.id}`, {
        catatan: viewDoc.catatan,
        details: editDetails.map((d) => ({
          id: d.id,
          stok_fisik: d.stok_fisik,
        })),
      });
      setViewDoc(null);
      fetchDocs();
    } catch (e) {
      alert((e as { message?: string }).message || 'Gagal menyimpan draf.');
    } finally {
      setUpdatingDraft(false);
    }
  };

  const finalizeOpname = async () => {
    if (!viewDoc) return;
    if (
      !window.confirm(
        'Apakah Anda yakin ingin memfinalisasi opname ini? Stok sistem akan langsung disesuaikan dengan stok fisik dan tidak dapat diubah lagi.'
      )
    )
      return;
    setUpdatingDraft(true);
    try {
      // 1. Save changes first
      await ApiService.put(`/inventory/opnames/${viewDoc.id}`, {
        catatan: viewDoc.catatan,
        details: editDetails.map((d) => ({
          id: d.id,
          stok_fisik: d.stok_fisik,
        })),
      });
      // 2. Finalize
      await ApiService.post(`/inventory/opnames/${viewDoc.id}/finalize`);
      setViewDoc(null);
      fetchDocs();
    } catch (e) {
      alert((e as { message?: string }).message || 'Gagal memfinalisasi.');
    } finally {
      setUpdatingDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#F97316]" />
            Stock Opname
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pemeriksaan dan penyesuaian fisik stok gudang secara periodik.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span>Mulai Stock Opname</span>
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
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <Loading size="sm" />
                    </td>
                  </tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Belum ada dokumen stock opname.
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
                        {d.tanggal_opname}
                      </td>
                      <td className="px-5 py-4 font-semibold">{d.gudang?.nama_gudang || '-'}</td>
                      <td className="px-5 py-4 text-center">
                        <Badge variant={d.status === 'FINAL' ? 'success' : 'warning'}>
                          {d.status === 'FINAL' ? 'Selesai' : 'Draf'}
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

      {/* Create Opname Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                Inisialisasi Stock Opname
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <Alert variant="danger" title="Error">
                  {formError}
                </Alert>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No. Dokumen *
                </label>
                <div className="flex gap-2">
                  <input
                    required
                    value={formData.nomor_dokumen}
                    onChange={(e) => setFormData({ ...formData, nomor_dokumen: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                    placeholder="OPN-2026-001"
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
                  Tanggal Opname *
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal_opname}
                  onChange={(e) => setFormData({ ...formData, tanggal_opname: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Lokasi Gudang *
                </label>
                <Select2
                  required
                  value={formData.gudang_id}
                  onChange={(val) => setFormData({ ...formData, gudang_id: val })}
                  options={warehouses.map((w) => ({ value: w.id, label: w.nama_gudang }))}
                  placeholder="-- Pilih Gudang Opname --"
                />
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
                  placeholder="Keterangan opname bulanan..."
                />
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
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}Mulai Opname
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Audit Detail Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 mb-10">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                Audit Stock Opname: {viewDoc.nomor_dokumen}
              </h3>
              <button
                onClick={() => setViewDoc(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold">Gudang Audit</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {viewDoc.gudang?.nama_gudang}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Tanggal Audit</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-350">
                    {viewDoc.tanggal_opname}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Status Dokumen</p>
                  <Badge variant={viewDoc.status === 'FINAL' ? 'success' : 'warning'}>
                    {viewDoc.status === 'FINAL' ? 'FINAL' : 'DRAF'}
                  </Badge>
                </div>
              </div>

              {/* Table of items */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                  Tabel Penyesuaian Fisik Barang
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-500 font-semibold">
                        <th className="px-4 py-2 text-left">Nama Barang</th>
                        <th className="px-4 py-2 text-center">Stok Sistem</th>
                        <th className="px-4 py-2 text-center">Stok Fisik</th>
                        <th className="px-4 py-2 text-right">Selisih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {editDetails.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20"
                        >
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {row.barang?.nama_barang}
                            </p>
                            <p className="text-slate-400 text-[10px]">{row.barang?.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-semibold">
                            {row.stok_sistem}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {viewDoc.status === 'DRAFT' ? (
                              <input
                                type="number"
                                min="0"
                                value={row.stok_fisik}
                                onChange={(e) => handleUpdatePhysical(idx, Number(e.target.value))}
                                className="w-20 px-2 py-1 text-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                              />
                            ) : (
                              <span className="font-mono font-bold">{row.stok_fisik}</span>
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono font-bold ${row.selisih === 0 ? 'text-slate-500' : row.selisih > 0 ? 'text-green-600' : 'text-red-500'}`}
                          >
                            {row.selisih > 0 ? `+${row.selisih}` : row.selisih}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewDoc.status === 'DRAFT' && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] text-slate-450 italic">
                    Ketik hitungan fisik di atas. Selisih akan otomatis dihitung.
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={updatingDraft}
                      onClick={saveDraftChanges}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-55 flex items-center gap-1.5"
                    >
                      {updatingDraft ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ClipboardList className="h-3.5 w-3.5" />
                      )}{' '}
                      Simpan Draf
                    </button>
                    <button
                      disabled={updatingDraft}
                      onClick={finalizeOpname}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5"
                    >
                      {updatingDraft ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}{' '}
                      Finalisasi Opname
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
