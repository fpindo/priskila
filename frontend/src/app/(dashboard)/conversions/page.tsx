'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Button, Loading, Select2, Badge } from '@priskila/ui';
import { Search, Plus, Pencil, Trash2, Loader2, ArrowRightLeft, RefreshCw, X, HelpCircle } from 'lucide-react';

interface Barang {
  id: number;
  sku: string;
  nama_barang: string;
  satuan: string;
}

interface Satuan {
  id: number;
  code: string;
  name: string;
}

interface Conversion {
  id: number;
  barang_id: number | null;
  from_unit: string;
  to_unit: string;
  factor: number;
  created_at: string;
  barang: Barang | null;
}

const emptyForm = {
  barang_id: '' as string | number,
  from_unit: '',
  to_unit: '',
  factor: '1',
};

export default function ConversionsPage() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [items, setItems] = useState<Barang[]>([]);
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

  const fetchConversions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const res = await ApiService.get<Conversion[]>('/conversions', params);
      if (res.success && res.data) {
        setConversions(res.data);
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal memuat data konversi.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchItems = async () => {
    try {
      const res = await ApiService.get<{ data: Barang[] }>('/barang', { limit: 1000 });
      if (res.success && res.data) {
        setItems(res.data.data);
      }
    } catch {
      /* optional item scope */
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await ApiService.get<Satuan[]>('/satuans');
      if (res.success && res.data) {
        setUnits(res.data);
      }
    } catch {
      setError('Gagal memuat master satuan.');
    }
  };

  useEffect(() => {
    fetchConversions();
    fetchItems();
    fetchUnits();
  }, [fetchConversions]);

  const openCreate = () => {
    setEditId(null);
    setFormData({
      ...emptyForm,
      from_unit: units[0]?.code ?? '',
      to_unit: units[1]?.code ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (c: Conversion) => {
    setEditId(c.id);
    setFormData({
      barang_id: c.barang_id !== null ? c.barang_id.toString() : '',
      from_unit: c.from_unit,
      to_unit: c.to_unit,
      factor: c.factor.toString(),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.from_unit || !formData.to_unit || !formData.factor) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        barang_id: formData.barang_id !== '' ? Number(formData.barang_id) : null,
        from_unit: formData.from_unit.toUpperCase(),
        to_unit: formData.to_unit.toUpperCase(),
        factor: Number(formData.factor),
      };

      if (payload.from_unit === payload.to_unit) {
        setFormError('Satuan asal dan tujuan harus berbeda.');
        return;
      }

      if (editId) {
        await ApiService.put(`/conversions/${editId}`, payload);
      } else {
        await ApiService.post('/conversions', payload);
      }
      setModalOpen(false);
      fetchConversions();
    } catch (e) {
      setFormError((e as { message?: string }).message || 'Gagal menyimpan konversi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await ApiService.delete(`/conversions/${deleteId}`);
      setDeleteId(null);
      fetchConversions();
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal menghapus konversi.');
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
            <ArrowRightLeft className="h-5 w-5 text-[#F97316]" />
            Konversi Satuan
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola rumus konversi satuan multi-UOM baik secara global maupun khusus per barang.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0" disabled={units.length < 2}>
          <Plus className="h-4 w-4" />
          <span>Tambah Konversi</span>
        </Button>
      </div>

      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {units.length < 2 && !loading && (
        <Alert variant="warning" title="Master satuan belum siap">
          Tambahkan minimal dua satuan di Master Satuan sebelum membuat konversi.
        </Alert>
      )}

      {/* Info Card */}
      <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-950/30 flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-[#F97316] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
          <strong className="text-slate-800 dark:text-slate-200">Cara Kerja Konversi:</strong> Rumus ini mendefinisikan faktor pengali untuk mengubah satuan besar ke satuan dasar/kecil.
          <br />Contoh: Jika 1 <strong>BOX</strong> = 12 <strong>PCS</strong>, maka pilih Satuan Asal <strong>BOX</strong>, Satuan Tujuan <strong>PCS</strong>, dan isi Faktor <strong>12</strong>.
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan satuan atau nama barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
              />
            </div>
            <button
              onClick={fetchConversions}
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
                    Cakupan / Barang
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Satuan Asal
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Satuan Tujuan
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Faktor Pengali
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Keterangan Rumus
                  </th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Loading size="sm" />
                    </td>
                  </tr>
                ) : conversions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      Belum ada data konversi satuan.
                    </td>
                  </tr>
                ) : (
                  conversions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        {c.barang ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {c.barang.nama_barang}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              SKU: {c.barang.sku}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="secondary">Global (Semua Barang)</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {c.from_unit}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {c.to_unit}
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#F97316]">
                        {c.factor}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-[#F97316] font-mono text-xs font-semibold">
                          1 {c.from_unit} = {c.factor} {c.to_unit}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            title="Edit Konversi"
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#F97316] transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(c.id)}
                            title="Hapus Konversi"
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
                {editId ? 'Edit Konversi Satuan' : 'Tambah Konversi Baru'}
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
                  Cakupan Barang (Opsional)
                </label>
                <Select2
                  value={formData.barang_id}
                  onChange={(val) => setFormData({ ...formData, barang_id: val })}
                  options={[
                    { value: '', label: 'Global (Semua Barang)' },
                    ...items.map((item) => ({
                      value: item.id.toString(),
                      label: `${item.nama_barang} (${item.sku}) [Dasar: ${item.satuan}]`,
                    })),
                  ]}
                  placeholder="Pilih barang (Kosongkan jika global)"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Satuan Asal (Unit Besar) *
                  </label>
                  <Select2
                    value={formData.from_unit}
                    onChange={(value) => setFormData({ ...formData, from_unit: value })}
                    options={units.map((unit) => ({ value: unit.code, label: `${unit.code} ? ${unit.name}` }))}
                    placeholder="Pilih satuan asal"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Satuan Tujuan (Unit Dasar) *
                  </label>
                  <Select2
                    value={formData.to_unit}
                    onChange={(value) => setFormData({ ...formData, to_unit: value })}
                    options={units.map((unit) => ({ value: unit.code, label: `${unit.code} ? ${unit.name}` }))}
                    placeholder="Pilih satuan tujuan"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Faktor Nilai Konversi *
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  min="0.0001"
                  value={formData.factor}
                  onChange={(e) => setFormData({ ...formData, factor: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                  placeholder="Berapa satuan dasar dalam 1 satuan asal?"
                />
              </div>

              {formData.from_unit && formData.to_unit && formData.factor && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-500 mb-0.5">Rumus Terbentuk</p>
                  <p className="font-mono text-base font-bold text-[#F97316]">
                    1 {formData.from_unit} = {formData.factor} {formData.to_unit}
                  </p>
                </div>
              )}

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
                  {editId ? 'Simpan Perubahan' : 'Tambah Konversi'}
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
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Hapus Konversi Satuan?</h3>
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
