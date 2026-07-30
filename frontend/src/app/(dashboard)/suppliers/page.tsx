'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Button, Loading, Select2 } from '@priskila/ui';
import { Search, Plus, Pencil, Trash2, Loader2, Truck, RefreshCw, X, Zap, Building2, UserCircle, MapPin, CreditCard } from 'lucide-react';

interface Supplier {
  id: number;
  kode_supplier: string;
  nama_supplier: string;
  pic_utama: string | null;
  no_hp: string | null;
  telepon: string | null;
  email: string | null;
  jenis_supplier: string | null;
  alamat_lengkap: string | null;
  kota: string | null;
  provinsi: string | null;
  termin_pembayaran: string | null;
  metode_pembayaran: string | null;
  mata_uang: string | null;
  lead_time: number | null;
  ppn: number | null;
  status: 'aktif' | 'nonaktif';
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

const JENIS_SUPPLIER_OPTIONS = [
  'Distributor',
  'Pabrik',
  'Importir',
  'Vendor Jasa',
  'Retailer',
  'Agen',
];

const TERMIN_PEMBAYARAN_OPTIONS = ['COD', 'Net 7', 'Net 14', 'Net 30', 'Net 45', 'Net 60', 'Tunai'];

const METODE_PEMBAYARAN_OPTIONS = [
  'Transfer Bank',
  'Tunai',
  'Cek/Giro',
  'Kartu Kredit',
];

const MATA_UANG_OPTIONS = ['IDR', 'USD', 'EUR', 'JPY', 'SGD', 'MYR', 'CNY'];

const emptyForm = {
  kode_supplier: '',
  nama_supplier: '',
  pic_utama: '',
  no_hp: '',
  telepon: '',
  email: '',
  jenis_supplier: '',
  alamat_lengkap: '',
  kota: '',
  provinsi: '',
  termin_pembayaran: '',
  metode_pembayaran: '',
  mata_uang: 'IDR',
  lead_time: '',
  ppn: '',
  status: 'aktif' as 'aktif' | 'nonaktif',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'identitas' | 'kontak' | 'alamat' | 'pembayaran'>('identitas');

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setActiveTab('identitas');
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await ApiService.get<{ code: string }>('/settings/generate-code/kode_supplier');
      if (res.success && res.data) setFormData((f) => ({ ...f, kode_supplier: res.data.code }));
    } catch {
      /* ignore */
    } finally {
      setGenerating(false);
    }
  };

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: 10, page };
      if (search) params.search = search;
      const res = await ApiService.get<PaginatedResponse<Supplier>>('/suppliers', params);
      if (res.success && res.data) {
        setSuppliers(res.data.data);
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

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const openCreate = () => {
    resetForm();
    setEditId(null);
    setFormError(null);
    setModalOpen(true);
    generateCode();
  };
  const openEdit = (s: Supplier) => {
    setEditId(s.id);
    setActiveTab('identitas');
    setFormData({
      kode_supplier: s.kode_supplier,
      nama_supplier: s.nama_supplier,
      pic_utama: s.pic_utama || '',
      no_hp: s.no_hp || '',
      telepon: s.telepon || '',
      email: s.email || '',
      jenis_supplier: s.jenis_supplier || '',
      alamat_lengkap: s.alamat_lengkap || '',
      kota: s.kota || '',
      provinsi: s.provinsi || '',
      termin_pembayaran: s.termin_pembayaran || '',
      metode_pembayaran: s.metode_pembayaran || '',
      mata_uang: s.mata_uang || 'IDR',
      lead_time: s.lead_time !== null ? String(s.lead_time) : '',
      ppn: s.ppn !== null ? String(s.ppn) : '',
      status: (s.status as 'aktif' | 'nonaktif') || 'aktif',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        ...formData,
        lead_time: formData.lead_time === '' ? null : Number(formData.lead_time),
        ppn: formData.ppn === '' ? null : Number(formData.ppn),
      };
      // Empty optional string fields -> null
      for (const [k, v] of Object.entries(payload)) {
        if (v === '' && k !== 'kode_supplier' && k !== 'nama_supplier') payload[k] = null;
      }
      if (editId) await ApiService.put(`/suppliers/${editId}`, payload);
      else await ApiService.post('/suppliers', payload);
      setModalOpen(false);
      fetchSuppliers();
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
      await ApiService.delete(`/suppliers/${deleteId}`);
      setDeleteId(null);
      fetchSuppliers();
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal menghapus.');
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Master Supplier</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola data mitra penyedia barang dan logistik.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span>Tambah Supplier</span>
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
                placeholder="Cari kode atau nama supplier..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
              />
            </div>
            <button
              onClick={fetchSuppliers}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Kode
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Nama Supplier
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    PIC / HP
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Jenis
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Kota
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Aksi
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
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Truck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500 text-sm">Belum ada data supplier.</p>
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-[#F97316] bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded-lg">
                          {s.kode_supplier}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                        <div className="flex flex-col">
                          <span>{s.nama_supplier}</span>
                          {s.email && (
                            <span className="text-[10px] text-slate-400 mt-0.5">{s.email}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                        <div className="flex flex-col">
                          <span className="text-xs">{s.pic_utama || '-'}</span>
                          <span className="text-[10px] text-slate-400">{s.no_hp || s.telepon || '-'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                        {s.jenis_supplier ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                            {s.jenis_supplier}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                        {s.kota || '-'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            s.status === 'aktif'
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-950/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {s.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#F97316] transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(s.id)}
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
          {!loading && suppliers.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">Total {meta.total} data</span>
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                {editId ? 'Edit Supplier' : 'Tambah Supplier Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs (settings-style underline tabs) */}
            <div className="px-6 pt-1 pb-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setActiveTab('identitas')}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none -mb-px shrink-0 ${
                    activeTab === 'identitas'
                      ? 'border-[#F97316] text-[#F97316]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Identitas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('kontak')}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none -mb-px shrink-0 ${
                    activeTab === 'kontak'
                      ? 'border-[#F97316] text-[#F97316]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <UserCircle className="h-4 w-4" />
                  Kontak & PIC
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('alamat')}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none -mb-px shrink-0 ${
                    activeTab === 'alamat'
                      ? 'border-[#F97316] text-[#F97316]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  Alamat
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pembayaran')}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none -mb-px shrink-0 ${
                    activeTab === 'pembayaran'
                      ? 'border-[#F97316] text-[#F97316]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Pembayaran
                </button>
              </div>
            </div>

            {/* Scrollable form body */}
            <form id="supplier-form" onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
              {formError && (
                <Alert variant="danger" title="Error">
                  {formError}
                </Alert>
              )}

              {/* SECTION: Identitas */}
              {activeTab === 'identitas' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1">
                  Identitas Supplier
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kode Supplier *
                    </label>
                    <input
                      required
                      value={formData.kode_supplier}
                      onChange={(e) => setFormData({ ...formData, kode_supplier: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                      placeholder="SUP-001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nama Supplier *
                    </label>
                    <input
                      required
                      value={formData.nama_supplier}
                      onChange={(e) => setFormData({ ...formData, nama_supplier: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                      placeholder="PT. Nama Supplier..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Jenis Supplier
                    </label>
                    <Select2
                      value={formData.jenis_supplier}
                      onChange={(val) => setFormData({ ...formData, jenis_supplier: val })}
                      options={[
                        { value: '', label: '-- Pilih Jenis --' },
                        ...JENIS_SUPPLIER_OPTIONS.map((j) => ({ value: j, label: j })),
                      ]}
                      placeholder="Pilih Jenis Supplier"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <Select2
                      value={formData.status}
                      onChange={(val) => setFormData({ ...formData, status: val as 'aktif' | 'nonaktif' })}
                      options={[
                        { value: 'aktif', label: 'Aktif' },
                        { value: 'nonaktif', label: 'Nonaktif' },
                      ]}
                      placeholder="Pilih Status"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* SECTION: Kontak & PIC */}
              {activeTab === 'kontak' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1">
                  Kontak & PIC
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      PIC Utama
                    </label>
                    <input
                      value={formData.pic_utama}
                      onChange={(e) => setFormData({ ...formData, pic_utama: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                      placeholder="Nama PIC Utama"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No. HP
                    </label>
                    <input
                      value={formData.no_hp}
                      onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                      placeholder="0812-xxxx-xxxx"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Telepon Kantor
                    </label>
                    <input
                      value={formData.telepon}
                      onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                      placeholder="021-xxxx"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                      placeholder="email@supplier.com"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* SECTION: Alamat */}
              {activeTab === 'alamat' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1">
                  Alamat
                </h4>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Alamat Lengkap
                  </label>
                  <textarea
                    rows={2}
                    value={formData.alamat_lengkap}
                    onChange={(e) => setFormData({ ...formData, alamat_lengkap: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 resize-none"
                    placeholder="Jl. ..., No. ..., RT/RW ..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kota
                    </label>
                    <input
                      value={formData.kota}
                      onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                      placeholder="Jakarta"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Provinsi
                    </label>
                    <input
                      value={formData.provinsi}
                      onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                      placeholder="DKI Jakarta"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* SECTION: Pembayaran & Logistik */}
              {activeTab === 'pembayaran' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1">
                  Pembayaran & Logistik
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Termin Pembayaran
                    </label>
                    <Select2
                      value={formData.termin_pembayaran}
                      onChange={(val) => setFormData({ ...formData, termin_pembayaran: val })}
                      options={[
                        { value: '', label: '-- Pilih Termin --' },
                        ...TERMIN_PEMBAYARAN_OPTIONS.map((t) => ({ value: t, label: t })),
                      ]}
                      placeholder="Pilih Termin Pembayaran"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Metode Pembayaran
                    </label>
                    <Select2
                      value={formData.metode_pembayaran}
                      onChange={(val) => setFormData({ ...formData, metode_pembayaran: val })}
                      options={[
                        { value: '', label: '-- Pilih Metode --' },
                        ...METODE_PEMBAYARAN_OPTIONS.map((m) => ({ value: m, label: m })),
                      ]}
                      placeholder="Pilih Metode Pembayaran"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mata Uang
                    </label>
                    <Select2
                      value={formData.mata_uang}
                      onChange={(val) => setFormData({ ...formData, mata_uang: val })}
                      options={MATA_UANG_OPTIONS.map((c) => ({ value: c, label: c }))}
                      placeholder="Pilih Mata Uang"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Lead Time (hari)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.lead_time}
                      onChange={(e) => setFormData({ ...formData, lead_time: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      PPN (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.ppn}
                      onChange={(e) => setFormData({ ...formData, ppn: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                      placeholder="11"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* spacer pushes submit area to bottom of scrollable region */}
              <div className="h-2" />
            </form>

            {/* Footer (pinned, outside scroll) */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => (document.getElementById('supplier-form') as HTMLFormElement | null)?.requestSubmit()}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#F97316] hover:bg-orange-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? 'Simpan Perubahan' : 'Tambah Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 mx-auto">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Hapus Supplier?</h3>
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
