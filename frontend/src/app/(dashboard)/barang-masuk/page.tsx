'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Button, Badge, Loading, Select2 } from '@priskila/ui';
import {
  Search,
  Plus,
  Eye,
  Loader2,
  ArrowDownToLine,
  RefreshCw,
  X,
  Trash2,
  Zap,
  ScanBarcode,
} from 'lucide-react';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });

interface Supplier {
  id: number;
  nama_supplier: string;
}
interface Project {
  id: number;
  nama_project: string;
}
interface Barang {
  id: number;
  nama_barang: string;
  sku: string;
  satuan: string;
}

interface BarangMasukItem {
  id: number;
  nomor_dokumen: string;
  tanggal_masuk: string;
  supplier: { nama_supplier: string } | null;
  project: { nama_project: string } | null;
  catatan: string | null;
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
  harga_satuan: string;
  catatan: string;
  barangList: Barang[];
}

const emptyDetail = (): DetailItem => ({
  barang_id: '',
  jumlah: 1,
  harga_satuan: '',
  catatan: '',
  barangList: [],
});

export default function BarangMasukPage() {
  const [docs, setDocs] = useState<BarangMasukItem[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [barangAll, setBarangAll] = useState<Barang[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nomor_dokumen: '',
    tanggal_masuk: '',
    supplier_id: '',
    project_id: '',
    catatan: '',
  });
  const [details, setDetails] = useState<DetailItem[]>([emptyDetail()]);

  const [viewDoc, setViewDoc] = useState<BarangMasukItem | null>(null);
  const [generating, setGenerating] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleBarcodeScan = useCallback((code: string) => {
    setScannerOpen(false);
    const found = barangAll.find(b => b.sku === code || (b as any).barcode === code);
    if (found) {
      // Check if already in details
      const existIdx = details.findIndex(d => d.barang_id === String(found.id));
      if (existIdx >= 0) {
        setDetails(prev => prev.map((d, i) => i === existIdx ? { ...d, jumlah: d.jumlah + 1 } : d));
      } else {
        setDetails(prev => [
          ...prev.filter(d => d.barang_id !== ''),
          { barang_id: String(found.id), jumlah: 1, harga_satuan: '', catatan: '', barangList: [] },
        ]);
      }
    } else {
      setFormError(`Barang dengan kode "${code}" tidak ditemukan.`);
    }
  }, [barangAll, details]);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await ApiService.get<{ code: string }>(
        '/settings/generate-code/nomor_barang_masuk'
      );
      if (res.success && res.data) setFormData((f) => ({ ...f, nomor_dokumen: res.data.code }));
    } catch {
      /* ignore */
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
      const res = await ApiService.get<PaginatedResponse<BarangMasukItem>>('/barang-masuk', params);
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

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const openCreate = async () => {
    setFormData({
      nomor_dokumen: '',
      tanggal_masuk: new Date().toISOString().split('T')[0],
      supplier_id: '',
      project_id: '',
      catatan: '',
    });
    setDetails([emptyDetail()]);
    setFormError(null);
    setModalOpen(true);
    generateCode();
    try {
      const [supRes, projRes, brgRes] = await Promise.all([
        ApiService.get<PaginatedResponse<Supplier>>('/suppliers', { limit: 100 }),
        ApiService.get<PaginatedResponse<Project>>('/projects', { limit: 100, status: 'ACTIVE' }),
        ApiService.get<PaginatedResponse<Barang>>('/barang', { limit: 500 }),
      ]);
      if (supRes.success) setSuppliers(supRes.data.data);
      if (projRes.success) setProjects(projRes.data.data);
      if (brgRes.success) setBarangAll(brgRes.data.data);
    } catch {
      /* ignore */
    }
  };

  const addDetail = () => setDetails((d) => [...d, emptyDetail()]);
  const removeDetail = (i: number) => setDetails((d) => d.filter((_, idx) => idx !== i));
  const updateDetail = (i: number, field: keyof DetailItem, value: string | number) => {
    setDetails((d) => d.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const invalidItems = details.filter((d) => !d.barang_id || d.jumlah < 1);
    if (invalidItems.length > 0) {
      setFormError('Lengkapi semua item barang.');
      setSaving(false);
      return;
    }
    try {
      const payload = {
        ...formData,
        project_id: formData.project_id || null,
        catatan: formData.catatan || null,
        items: details.map((d) => ({
          barang_id: Number(d.barang_id),
          jumlah: d.jumlah,
          harga_satuan: d.harga_satuan ? Number(d.harga_satuan) : null,
          catatan: d.catatan || null,
        })),
      };
      await ApiService.post('/barang-masuk', payload);
      setModalOpen(false);
      fetchDocs();
    } catch (e) {
      setFormError((e as { message?: string }).message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Barang Masuk</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Rekam penerimaan barang dari supplier ke gudang.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span>Rekam Barang Masuk</span>
        </Button>
      </div>
      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
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
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
              />
            </div>
            <button
              onClick={fetchDocs}
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
                    No. Dokumen
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Tanggal
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Supplier
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Project
                  </th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Loading size="sm" />
                    </td>
                  </tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <ArrowDownToLine className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500 text-sm">Belum ada transaksi barang masuk.</p>
                    </td>
                  </tr>
                ) : (
                  docs.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-[#F97316] bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded-lg">
                          {d.nomor_dokumen}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {d.tanggal_masuk}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                        {d.supplier?.nama_supplier || '-'}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                        {d.project?.nama_project || '-'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setViewDoc(d)}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#F97316] transition-colors"
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
          {!loading && docs.length > 0 && (
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

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 mb-10">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Rekam Barang Masuk</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No. Dokumen *
                  </label>
                  <input
                    required
                    value={formData.nomor_dokumen}
                    onChange={(e) => setFormData({ ...formData, nomor_dokumen: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                    placeholder="BM-2026-001"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tanggal Masuk *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_masuk}
                    onChange={(e) => setFormData({ ...formData, tanggal_masuk: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Supplier *
                  </label>
                  <Select2
                    required
                    value={formData.supplier_id}
                    onChange={(val) => setFormData({ ...formData, supplier_id: val })}
                    options={suppliers.map((s) => ({ value: s.id, label: s.nama_supplier }))}
                    placeholder="-- Pilih Supplier --"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Project
                  </label>
                  <Select2
                    value={formData.project_id}
                    onChange={(val) => setFormData({ ...formData, project_id: val })}
                    options={projects.map((p) => ({ value: p.id, label: p.nama_project }))}
                    placeholder="-- Tanpa Project --"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan
                </label>
                <textarea
                  rows={2}
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 resize-none"
                  placeholder="Catatan tambahan..."
                />
              </div>

              {/* Detail Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Detail Item Barang
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/20 text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-950/40 transition-colors"
                    >
                      <ScanBarcode className="h-3 w-3" /> Scan Barcode
                    </button>
                    <button
                      type="button"
                      onClick={addDetail}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 dark:bg-orange-950/20 text-[#F97316] hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Tambah Item
                    </button>
                  </div>
                </div>
                {details.map((det, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Item {i + 1}</span>
                      {details.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDetail(i)}
                          className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs text-slate-600 dark:text-slate-400">
                          Barang *
                        </label>
                        <Select2
                          required
                          value={det.barang_id}
                          onChange={(val) => updateDetail(i, 'barang_id', val)}
                          options={barangAll.map((b) => ({ value: b.id, label: `${b.sku} - ${b.nama_barang}` }))}
                          placeholder="-- Pilih Barang --"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-600 dark:text-slate-400">
                          Jumlah *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={det.jumlah}
                          onChange={(e) => updateDetail(i, 'jumlah', Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-600 dark:text-slate-400">
                          Harga Satuan
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={det.harga_satuan}
                          onChange={(e) => updateDetail(i, 'harga_satuan', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-600 dark:text-slate-400">
                          Catatan Item
                        </label>
                        <input
                          value={det.catatan}
                          onChange={(e) => updateDetail(i, 'catatan', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                          placeholder="Catatan..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}Simpan & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Detail Dokumen</h3>
              <button
                onClick={() => setViewDoc(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Dokumen</span>
                <span className="font-mono font-semibold text-[#F97316]">
                  {viewDoc.nomor_dokumen}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {viewDoc.tanggal_masuk}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Supplier</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {viewDoc.supplier?.nama_supplier || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Project</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {viewDoc.project?.nama_project || '-'}
                </span>
              </div>
              {viewDoc.catatan && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 block mb-1">Catatan:</span>
                  <p className="text-slate-700 dark:text-slate-300">{viewDoc.catatan}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setViewDoc(null)}
              className="w-full py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {scannerOpen && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
