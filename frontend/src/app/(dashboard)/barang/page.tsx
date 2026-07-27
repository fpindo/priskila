'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService, apiClient } from '@priskila/api';
import { Card, CardContent, Alert, Badge, Button, Loading, Select2 } from '@priskila/ui';
import { Search, Plus, Pencil, Trash2, Loader2, Package, RefreshCw, X, Zap, Copy, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Barang {
  id: number;
  sku: string;
  nama_barang: string;
  kategori: string;
  satuan: string;
  current_stock: number;
  min_stock: number;
  effective_min_stock?: number;
  harga_satuan: number | null;
  brand: string | null;
  bin_location: string | null;
  conversions?: { id: number; from_unit: string; to_unit: string; factor: number }[];
  image_url?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

const emptyForm = {
  sku: '',
  nama_barang: '',
  kategori: '',
  satuan: 'PCS',
  current_stock: 0,
  min_stock: 0,
  harga_satuan: '',
  brand: '',
  bin_location: '',
  image: null as File | null,
  image_url: '',
};

export default function BarangPage() {
  const [items, setItems] = useState<Barang[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);

  // New features state
  const [itemsLookup, setItemsLookup] = useState<Barang[]>([]);
  const [availableKategoris, setAvailableKategoris] = useState<any[]>([]);
  const [availableSatuans, setAvailableSatuans] = useState<any[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importItems, setImportItems] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await ApiService.get<{ code: string }>('/settings/generate-code/sku');
      if (res.success && res.data) setFormData((f) => ({ ...f, sku: res.data.code }));
    } catch {
      /* ignore */
    } finally {
      setGenerating(false);
    }
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: 10, page };
      if (search) params.search = search;
      if (filterKategori) params.kategori = filterKategori;
      const res = await ApiService.get<PaginatedResponse<Barang>>('/barang', params);
      if (res.success && res.data) {
        setItems(res.data.data);
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
  }, [search, filterKategori, page]);

  const fetchLookupItems = async () => {
    try {
      const res = await ApiService.get<{ data: Barang[] }>('/barang', { limit: 1000 });
      if (res.success && res.data) {
        setItemsLookup(res.data.data);
      }
    } catch {
      /* ignore */
    }
  };

  const fetchKategoris = async () => {
    try {
      const res = await ApiService.get<any[]>('/kategoris');
      if (res.success && res.data) {
        setAvailableKategoris(res.data);
      }
    } catch {
      /* ignore */
    }
  };

  const fetchSatuans = async () => {
    try {
      const res = await ApiService.get<any[]>('/satuans');
      if (res.success && res.data) {
        setAvailableSatuans(res.data);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchItems();
    fetchLookupItems();
    fetchKategoris();
    fetchSatuans();
  }, [fetchItems]);

  const openCreate = () => {
    setEditId(null);
    setFormData({
      ...emptyForm,
      kategori: availableKategoris[0]?.name || '',
      satuan: availableSatuans[0]?.code || 'PCS',
    });
    setFormError(null);
    setModalOpen(true);
    generateCode();
  };

  const openClone = (b: Barang) => {
    setEditId(null);
    setFormData({
      sku: '',
      nama_barang: `${b.nama_barang} (Copy)`,
      kategori: b.kategori,
      satuan: b.satuan,
      current_stock: 0,
      min_stock: b.min_stock,
      harga_satuan: b.harga_satuan !== null ? String(b.harga_satuan) : '',
      brand: b.brand || '',
      bin_location: b.bin_location || '',
      image_url: b.image_url || '',
      image: null,
    });
    setFormError(null);
    setModalOpen(true);
    generateCode();
  };

  const openEdit = (b: Barang) => {
    setEditId(b.id);
    setFormData({
      sku: b.sku,
      nama_barang: b.nama_barang,
      kategori: b.kategori,
      satuan: b.satuan,
      current_stock: b.current_stock,
      min_stock: b.min_stock,
      harga_satuan: b.harga_satuan !== null ? String(b.harga_satuan) : '',
      brand: b.brand || '',
      bin_location: b.bin_location || '',
      image_url: b.image_url || '',
      image: null,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const data = new FormData();
      data.append('sku', formData.sku);
      data.append('nama_barang', formData.nama_barang);
      data.append('kategori', formData.kategori);
      data.append('satuan', formData.satuan);
      data.append('current_stock', String(formData.current_stock));
      data.append('min_stock', String(formData.min_stock));
      data.append('harga_satuan', formData.harga_satuan !== '' ? String(formData.harga_satuan) : '');
      data.append('brand', formData.brand);
      data.append('bin_location', formData.bin_location);
      if (formData.image) {
        data.append('image', formData.image);
      }

      if (editId) {
        data.append('_method', 'PUT');
        await apiClient.post(`/barang/${editId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await apiClient.post('/barang', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setModalOpen(false);
      fetchItems();
      fetchLookupItems();
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
      await ApiService.delete(`/barang/${deleteId}`);
      setDeleteId(null);
      fetchItems();
      fetchLookupItems();
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal menghapus.');
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const stockVariant = (b: Barang) => {
    const current = b.current_stock ?? 0;
    const min = b.effective_min_stock ?? b.min_stock;
    return current <= min
      ? 'danger'
      : current <= min * 1.5
        ? 'warning'
        : 'success';
  };

  // Client-side Excel XLSX Parser
  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (jsonData.length <= 1) {
            resolve([]);
            return;
          }

          const rawHeaders = jsonData[0].map((h: any) =>
            String(h || '').trim().toLowerCase()
          );

          const skuIdx = rawHeaders.findIndex(h => h.includes('sku') || h.includes('kode'));
          const namaIdx = rawHeaders.findIndex(h => h.includes('nama') || h.includes('name') || h.includes('barang'));
          const katIdx = rawHeaders.findIndex(h => h.includes('kategori') || h.includes('category'));
          const satIdx = rawHeaders.findIndex(h => h.includes('satuan') || h.includes('unit'));
          const minIdx = rawHeaders.findIndex(h => h.includes('min') || h.includes('limit') || h.includes('minimum'));
          const deskIdx = rawHeaders.findIndex(h => h.includes('deskripsi') || h.includes('description') || h.includes('ket'));

          const parsedItems = [];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            const hasValue = row.some(val => val !== null && val !== undefined && val !== '');
            if (!hasValue) continue;

            const sku = skuIdx !== -1 ? String(row[skuIdx] || '').trim() : '';
            const nama_barang = namaIdx !== -1 ? String(row[namaIdx] || '').trim() : '';
            const kategori = katIdx !== -1 ? String(row[katIdx] || '').trim() : '';
            const satuan = satIdx !== -1 ? String(row[satIdx] || 'PCS').trim() : 'PCS';
            const min_stock = minIdx !== -1 ? parseInt(String(row[minIdx] || '0').trim(), 10) || 0 : 0;
            const deskripsi = deskIdx !== -1 ? String(row[deskIdx] || '').trim() : '';

            if (sku || nama_barang) {
              parsedItems.push({
                sku,
                nama_barang,
                kategori,
                satuan,
                min_stock,
                deskripsi,
              });
            }
          }

          resolve(parsedItems);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const appendReferenceSheet = (wb: any) => {
    const refHeaders = ["Daftar Kategori", "", "Kode Satuan", "Nama Satuan"];
    const refRows = [];
    const maxLen = Math.max(availableKategoris.length, availableSatuans.length);
    for (let i = 0; i < maxLen; i++) {
      refRows.push([
        availableKategoris[i]?.name || "",
        "",
        availableSatuans[i]?.code || "",
        availableSatuans[i]?.name || "",
      ]);
    }
    const wsRef = XLSX.utils.aoa_to_sheet([refHeaders, ...refRows]);
    XLSX.utils.book_append_sheet(wb, wsRef, "Referensi Kategori & Satuan");
  };

  const downloadTemplate = () => {
    const headers = ["SKU", "Nama Barang", "Kategori", "Satuan", "Min Stock", "Deskripsi"];
    const rows = [
      ["BRG-SAMPLE-001", "Pipa PVC 2 Inch", "Material", "METER", 5, "Pipa PVC merk Rucika"],
      ["BRG-SAMPLE-002", "Semen Tiga Roda", "Material", "SAK", 10, "Semen Portland 40kg"],
      ["BRG-SAMPLE-003", "Helm Safety Orange", "APD", "PCS", 2, "Helm keselamatan proyek"]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    appendReferenceSheet(wb);
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_barang.xlsx");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExistingData = () => {
    if (itemsLookup.length === 0) {
      alert("Tidak ada data barang untuk diunduh.");
      return;
    }
    
    const headers = ["SKU", "Nama Barang", "Kategori", "Satuan", "Min Stock", "Deskripsi"];
    const rows = itemsLookup.map((b) => [
      b.sku,
      b.nama_barang,
      b.kategori,
      b.satuan,
      b.min_stock,
      b.bin_location || '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Barang Aktif");
    appendReferenceSheet(wb);

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "data_barang_saat_ini.xlsx");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Master Barang</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola master data barang dan item inventori.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4 text-emerald-600" />
            <span>Import Excel (XLSX)</span>
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span>Tambah Barang</span>
          </Button>
        </div>
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
                placeholder="Cari SKU atau nama barang..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
              />
            </div>
            
            {availableKategoris.length > 0 ? (
              <div className="w-44">
                <Select2
                  value={filterKategori}
                  onChange={(val) => {
                    setFilterKategori(val);
                    setPage(1);
                  }}
                  options={[
                    { value: '', label: 'Semua Kategori' },
                    ...availableKategoris.map((c) => ({
                      value: c.name,
                      label: c.name,
                    })),
                  ]}
                  placeholder="Semua Kategori"
                />
              </div>
            ) : (
              <input
                type="text"
                placeholder="Filter kategori..."
                value={filterKategori}
                onChange={(e) => {
                  setFilterKategori(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 w-44"
              />
            )}

            <button
              onClick={fetchItems}
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
                    Foto
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    SKU
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Nama Barang
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Kategori
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Satuan
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Stock
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
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500 text-sm">Belum ada data barang.</p>
                    </td>
                  </tr>
                ) : (
                  items.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        {b.image_url ? (
                          <div className="h-10 w-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white p-0.5 flex items-center justify-center shrink-0">
                            <img src={b.image_url} alt={b.nama_barang} className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-[#F97316] bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded-lg">
                          {b.sku}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                        <div>
                          <span className="block">{b.nama_barang}</span>
                          {b.conversions && b.conversions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {b.conversions.map((conv) => (
                                <span
                                  key={conv.id}
                                  className="text-[9px] px-1.5 py-0.5 font-mono font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-950/30"
                                >
                                  1 {conv.from_unit} = {conv.factor} {conv.to_unit}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{b.kategori}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{b.satuan}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={stockVariant(b)}>{b.current_stock}</Badge>
                           <span className="text-xs text-slate-400">/ min {b.effective_min_stock ?? b.min_stock}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openClone(b)}
                            title="Salin barang"
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(b)}
                            title="Edit barang"
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#F97316] transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(b.id)}
                            title="Hapus barang"
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

          {/* Pagination */}
          {!loading && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <span className="text-xs text-slate-500">
                Menampilkan halaman {meta.current_page} dari {meta.last_page} ({meta.total} barang)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 disabled:opacity-50 text-slate-700 dark:text-slate-300"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={page >= meta.last_page}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 disabled:opacity-50 text-slate-700 dark:text-slate-300"
                >
                  Selanjutnya &rarr;
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Upload className="h-5 w-5 text-emerald-600" />
                Import Data Barang dari Excel (XLSX)
              </h3>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setImportItems([]);
                  setImportError(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {importError && (
                <div className="whitespace-pre-line">
                  <Alert variant="danger" title="Error Pengimporan">
                    {importError}
                  </Alert>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-355 leading-relaxed">
                  Unggah file Excel Anda dalam format <strong>.xlsx atau .xls</strong> dengan kolom headers berikut:
                  <code className="block mt-2 p-2 rounded bg-white dark:bg-slate-955 font-mono text-[10px] text-[#F97316]">
                    SKU | Nama Barang | Kategori | Satuan | Min Stock | Deskripsi
                  </code>
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="text-xs text-[#F97316] font-semibold hover:underline flex items-center gap-1"
                  >
                    &darr; Unduh Contoh Template Excel (XLSX)
                  </button>
                  <button
                    type="button"
                    onClick={downloadExistingData}
                    className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    &darr; Unduh Data Barang Saat Ini (XLSX)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pilih File Excel (.xlsx, .xls) *
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImportError(null);
                      try {
                        const parsed = await parseExcel(file);
                        if (parsed.length === 0) {
                          setImportError("Tidak ada data yang dapat dibaca. Pastikan format kolom sesuai template.");
                        } else {
                          setImportItems(parsed);
                        }
                      } catch {
                        setImportError("Gagal membaca file Excel. Pastikan file tidak rusak.");
                      }
                    }
                  }}
                  className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-950/20 file:text-emerald-600 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              {importItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Preview Data ({importItems.length} baris siap diimpor):
                    </p>
                    <button
                      type="button"
                      onClick={() => setImportItems([])}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Batal
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-355 sticky top-0">
                        <tr>
                          <th className="px-4 py-2">SKU</th>
                          <th className="px-4 py-2">Nama Barang</th>
                          <th className="px-4 py-2">Kategori</th>
                          <th className="px-4 py-2">Satuan</th>
                          <th className="px-4 py-2 text-right">Min Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {importItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-400">{item.sku}</td>
                            <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{item.nama_barang}</td>
                            <td className="px-4 py-2">{item.kategori}</td>
                            <td className="px-4 py-2">{item.satuan}</td>
                            <td className="px-4 py-2 text-right">{item.min_stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportItems([]);
                  setImportError(null);
                }}
                disabled={importing}
              >
                Kembali
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (importItems.length === 0) return;
                  setImporting(true);
                  setImportError(null);
                  try {
                    const res = await ApiService.post<any>('/barang/import', { items: importItems });
                    if (res.success) {
                      setImportModalOpen(false);
                      setImportItems([]);
                      fetchItems();
                      fetchLookupItems();
                    } else {
                      setImportError(res.message || "Gagal mengimpor data.");
                    }
                  } catch (e: any) {
                    if (e.errors && Array.isArray(e.errors)) {
                      setImportError(e.errors.join("\n"));
                    } else {
                      setImportError(e.message || "Gagal mengimpor data.");
                    }
                  } finally {
                    setImporting(false);
                  }
                }}
                disabled={importItems.length === 0 || importing}
              >
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan & Impor
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                {editId ? 'Edit Barang' : 'Tambah Barang Baru'}
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

              {/* Copy from existing data selector (Only for new item creation) */}
              {!editId && itemsLookup.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-950/30">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                    Salin dari Barang Lain (Opsional)
                  </label>
                  <Select2
                    value=""
                    onChange={(val) => {
                      if (!val) return;
                      const selectedItem = itemsLookup.find((b) => b.id === Number(val));
                      if (selectedItem) {
                        setFormData((prev) => ({
                          ...prev,
                          nama_barang: `${selectedItem.nama_barang} (Salinan)`,
                          kategori: selectedItem.kategori,
                          satuan: selectedItem.satuan,
                          min_stock: selectedItem.min_stock,
                          harga_satuan: selectedItem.harga_satuan ? selectedItem.harga_satuan.toString() : '',
                          brand: selectedItem.brand || '',
                          bin_location: selectedItem.bin_location || '',
                        }));
                      }
                    }}
                    options={[
                      { value: '', label: '-- Pilih Barang Untuk Disalin --' },
                      ...itemsLookup.map((b) => ({
                        value: b.id.toString(),
                        label: `${b.nama_barang} (${b.sku})`,
                      })),
                    ]}
                    placeholder="Pilih barang untuk disalin datanya..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                    SKU *
                  </label>
                  <div className="flex gap-2">
                    <input
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                      placeholder="BRG-001"
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Satuan *
                  </label>
                  <Select2
                    required
                    value={formData.satuan}
                    onChange={(val) => setFormData({ ...formData, satuan: val })}
                    options={availableSatuans.length > 0 ? availableSatuans.map(s => ({
                      value: s.code,
                      label: `${s.code} - ${s.name}`,
                    })) : [
                      { value: 'PCS', label: 'PCS' },
                      { value: 'SET', label: 'SET' },
                      { value: 'BOX', label: 'BOX' },
                      { value: 'ROLL', label: 'ROLL' },
                      { value: 'METER', label: 'METER' },
                      { value: 'KG', label: 'KG' },
                      { value: 'LITER', label: 'LITER' },
                      { value: 'UNIT', label: 'UNIT' },
                    ]}
                    placeholder="Pilih Satuan"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Barang *
                </label>
                <input
                  required
                  value={formData.nama_barang}
                  onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                  placeholder="Pipa PVC 2 Inch, Kabel, Semen..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                    Kategori *
                  </label>
                  {availableKategoris.length > 0 ? (
                    <Select2
                      required
                      value={formData.kategori}
                      onChange={(val) => setFormData({ ...formData, kategori: val })}
                      options={availableKategoris.map((c) => ({
                        value: c.name,
                        label: c.name,
                      }))}
                      placeholder="Pilih Kategori"
                    />
                  ) : (
                    <input
                      required
                      value={formData.kategori}
                      onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                      placeholder="Elektrikal, Mekanikal, dll..."
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                    Brand / Merk
                  </label>
                  <input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                    placeholder="Schneider, Philips, dll..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Lokasi Rak (Bin Location)
                </label>
                <input
                  value={formData.bin_location}
                  onChange={(e) => setFormData({ ...formData, bin_location: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                  placeholder="RAK-01-A, LOK-B3, dll..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Stock Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!!editId}
                    value={formData.current_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, current_stock: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                    Stock Minimum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, min_stock: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                    Harga Satuan
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.harga_satuan}
                    onChange={(e) => setFormData({ ...formData, harga_satuan: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Foto Barang (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  {formData.image_url && (
                    <div className="h-12 w-12 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white flex items-center justify-center shrink-0">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData((f) => ({
                          ...f,
                          image: file,
                          image_url: URL.createObjectURL(file),
                        }));
                      }
                    }}
                    className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#F97316]/10 file:text-[#F97316] hover:file:bg-[#F97316]/20 cursor-pointer"
                  />
                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, image: null, image_url: '' }))}
                      className="text-xs text-red-500 hover:underline shrink-0"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Pilih berkas gambar (JPG, PNG, atau WEBP, maks. 2MB)</p>
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
                  {editId ? 'Simpan Perubahan' : 'Tambah Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 mx-auto">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Hapus Barang?</h3>
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
