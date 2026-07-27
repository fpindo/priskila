'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Button, Loading } from '@priskila/ui';
import { Search, Plus, Pencil, Trash2, Loader2, Home, RefreshCw, X, Zap } from 'lucide-react';

interface Warehouse {
  id: number;
  kode_gudang: string;
  nama_gudang: string;
  alamat: string | null;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

const emptyForm = { kode_gudang: '', nama_gudang: '', alamat: '' };

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await ApiService.get<{ code: string }>('/settings/generate-code/kode_gudang');
      if (res.success && res.data) {
        setFormData((f) => ({ ...f, kode_gudang: res.data.code }));
      }
    } catch {
      /* ignore */
    } finally {
      setGenerating(false);
    }
  };

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: 10, page };
      if (search) params.search = search;

      const res = await ApiService.get<PaginatedResponse<Warehouse>>('/warehouses', params);
      if (res.success && res.data) {
        setWarehouses(res.data.data);
        setMeta({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal memuat data gudang.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const openCreate = () => {
    setEditId(null);
    setFormData({ ...emptyForm });
    setFormError(null);
    setModalOpen(true);
    generateCode();
  };

  const openEdit = (w: Warehouse) => {
    setEditId(w.id);
    setFormData({
      kode_gudang: w.kode_gudang,
      nama_gudang: w.nama_gudang,
      alamat: w.alamat || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editId) {
        await ApiService.put(`/warehouses/${editId}`, formData);
      } else {
        await ApiService.post('/warehouses', formData);
      }
      setModalOpen(false);
      fetchWarehouses();
    } catch (e) {
      setFormError((e as { message?: string }).message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await ApiService.delete(`/warehouses/${deleteId}`);
      setDeleteId(null);
      fetchWarehouses();
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal menghapus.');
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Home className="h-5 w-5 text-[#F97316]" />
            Master Gudang
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola lokasi dan kapasitas gudang penyimpanan barang inventaris.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span>Tambah Gudang</span>
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
                placeholder="Cari kode, nama, atau alamat gudang..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
              />
            </div>
            <button
              onClick={fetchWarehouses}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-slate-500 font-semibold">
                  <th className="px-5 py-3 text-left">Kode Gudang</th>
                  <th className="px-5 py-3 text-left">Nama Gudang</th>
                  <th className="px-5 py-3 text-left">Alamat / Lokasi</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center">
                      <div className="flex justify-center">
                        <Loading size="sm" />
                      </div>
                    </td>
                  </tr>
                ) : warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Belum ada data gudang.
                    </td>
                  </tr>
                ) : (
                  warehouses.map((w) => (
                    <tr
                      key={w.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-xs text-[#F97316]">
                        {w.kode_gudang}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                        {w.nama_gudang}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-450">
                        {w.alamat || '-'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(w)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(w.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && warehouses.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">Total {meta.total} data</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  &larr; Sebelumnya
                </button>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {meta.current_page} / {meta.last_page}
                </span>
                <button
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Selanjutnya &rarr;
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                {editId ? 'Edit Gudang' : 'Tambah Gudang Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
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
                  Kode Gudang *
                </label>
                <div className="flex gap-2">
                  <input
                    required
                    value={formData.kode_gudang}
                    onChange={(e) =>
                      setFormData({ ...formData, kode_gudang: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] uppercase"
                    placeholder="GDG-JKT"
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
                  Nama Gudang *
                </label>
                <input
                  required
                  value={formData.nama_gudang}
                  onChange={(e) => setFormData({ ...formData, nama_gudang: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                  placeholder="Gudang Utama Jakarta"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Alamat / Lokasi
                </label>
                <textarea
                  rows={3}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] resize-none"
                  placeholder="Alamat lengkap gudang..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  Simpan Gudang
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">Hapus Gudang?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus gudang ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-500 hover:bg-red-650 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
