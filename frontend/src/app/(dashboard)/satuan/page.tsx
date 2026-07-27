'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Button, Loading } from '@priskila/ui';
import { Search, Plus, Pencil, Trash2, Loader2, Scale, RefreshCw, X } from 'lucide-react';

interface Satuan {
  id: number;
  code: string;
  name: string;
  created_at: string;
}

const emptyForm = {
  code: '',
  name: '',
};

export default function SatuanPage() {
  const [units, setUnits] = useState<Satuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const res = await ApiService.get<Satuan[]>('/satuans', params);
      if (res.success && res.data) {
        setUnits(res.data);
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal memuat data satuan.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const openCreate = () => {
    setEditId(null);
    setFormData({ ...emptyForm });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (u: Satuan) => {
    setEditId(u.id);
    setFormData({
      code: u.code,
      name: u.name,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
      };

      if (editId) {
        await ApiService.put(`/satuans/${editId}`, payload);
      } else {
        await ApiService.post('/satuans', payload);
      }
      setModalOpen(false);
      fetchUnits();
    } catch (e) {
      setFormError((e as { message?: string }).message || 'Gagal menyimpan satuan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await ApiService.delete(`/satuans/${deleteId}`);
      setDeleteId(null);
      fetchUnits();
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal menghapus satuan.');
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
            <Scale className="h-5 w-5 text-[#F97316]" />
            Master Satuan Barang (UOM)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola kode satuan barang dan unit pengukuran (Unit of Measurement) dinamis.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span>Tambah Satuan</span>
        </Button>
      </div>

      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {/* Filter Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode atau nama satuan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
              />
            </div>
            <button
              onClick={fetchUnits}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Table list */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Kode Satuan
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Nama Deskripsi
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Tanggal Dibuat
                  </th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <Loading size="sm" />
                    </td>
                  </tr>
                ) : units.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-slate-500">
                      Belum ada data satuan.
                    </td>
                  </tr>
                ) : (
                  units.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-[#F97316] bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-lg">
                          {u.code}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                        {u.name}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(u.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            title="Edit Satuan"
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#F97316] transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(u.id)}
                            title="Hapus Satuan"
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-500 transition-colors"
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
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                {editId ? 'Edit Satuan' : 'Tambah Satuan Baru'}
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Kode Satuan (Singkat & Kapital) *
                </label>
                <input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] uppercase font-mono"
                  placeholder="Contoh: PCS, BOX, ROLL, KG"
                  maxLength={10}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Nama Lengkap Deskripsi *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                  placeholder="Contoh: Pieces, Box Besar, Roll Kabel, Kilogram"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#F97316] hover:bg-orange-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? 'Simpan Perubahan' : 'Tambah Satuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 mx-auto">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Hapus Satuan Barang?</h3>
              <p className="text-sm text-slate-500 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
