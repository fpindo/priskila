'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService, apiClient } from '@priskila/api';
import { Card, CardContent, Alert, Badge, Button, Loading, Select2 } from '@priskila/ui';
import { Search, Plus, Pencil, Trash2, Loader2, Package, RefreshCw, X, Zap, Copy, Upload, LayoutGrid, List } from 'lucide-react';
import { XlsxWriter, parseXlsx } from '@/lib/xlsx-writer';

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
  bin_id?: number | null;
  bin_location: string | null;
  conversions?: { id: number; from_unit: string; to_unit: string; factor: number }[];
  image_url?: string;
}

interface LocationBin {
  id: number;
  code: string;
  name: string;
  full_path?: string;
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
  bin_id: '',
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [pageSize, setPageSize] = useState<8 | 16 | 24>(8);

  // New features state
  const [itemsLookup, setItemsLookup] = useState<Barang[]>([]);
  const [availableKategoris, setAvailableKategoris] = useState<any[]>([]);
  const [availableSatuans, setAvailableSatuans] = useState<any[]>([]);
  const [availableBins, setAvailableBins] = useState<LocationBin[]>([]);
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
      const params: Record<string, string | number> = { limit: pageSize, page };
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
  }, [search, filterKategori, page, pageSize]);

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

  const fetchBins = async () => {
    try {
      const res = await ApiService.get<LocationBin[]>('/locations/bins');
      if (res.success && res.data) {
        setAvailableBins(res.data);
      }
    } catch {
      /* ignore */
    }
  };

  const syncBinLocation = (binId: string) => {
    const selectedBin = availableBins.find((bin) => bin.id === Number(binId));

    return {
      bin_id: binId,
      bin_location: selectedBin?.full_path || selectedBin?.name || '',
    };
  };

  const renderPagination = () => {
    if (loading || meta.last_page <= 1) return null;
    return (
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
    );
  };

  useEffect(() => {
    fetchItems();
    fetchLookupItems();
    fetchKategoris();
    fetchSatuans();
    fetchBins();
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
      bin_id: b.bin_id ? String(b.bin_id) : '',
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
      bin_id: b.bin_id ? String(b.bin_id) : '',
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
      data.append('bin_id', formData.bin_id);
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

  // Client-side Excel XLSX Parser (zero-dependency)
  const parseExcel = async (file: File): Promise<any[]> => {
    const rows = await parseXlsx(file);

    if (rows.length <= 1) return [];

    const rawHeaders = rows[0].map((h) => String(h || '').trim().toLowerCase());

    const skuIdx = rawHeaders.findIndex((h) => h.includes('sku') || h.includes('kode'));
    const namaIdx = rawHeaders.findIndex((h) => h.includes('nama') || h.includes('name') || h.includes('barang'));
    const katIdx = rawHeaders.findIndex((h) => h.includes('kategori') || h.includes('category'));
    const satIdx = rawHeaders.findIndex((h) => h.includes('satuan') || h.includes('unit'));
    const minIdx = rawHeaders.findIndex((h) => h.includes('min') || h.includes('limit') || h.includes('minimum'));
    const deskIdx = rawHeaders.findIndex((h) => h.includes('deskripsi') || h.includes('description') || h.includes('ket'));

    const parsedItems = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const hasValue = row.some((val) => val !== null && val !== undefined && val !== '');
      if (!hasValue) continue;

      const sku = skuIdx !== -1 ? String(row[skuIdx] || '').trim() : '';
      const nama_barang = namaIdx !== -1 ? String(row[namaIdx] || '').trim() : '';
      const kategori = katIdx !== -1 ? String(row[katIdx] || '').trim() : '';
      const satuan = satIdx !== -1 ? String(row[satIdx] || 'PCS').trim() : 'PCS';
      const min_stock = minIdx !== -1 ? parseInt(String(row[minIdx] || '0').trim(), 10) || 0 : 0;
      const deskripsi = deskIdx !== -1 ? String(row[deskIdx] || '').trim() : '';

      if (sku || nama_barang) {
        parsedItems.push({ sku, nama_barang, kategori, satuan, min_stock, deskripsi });
      }
    }

    return parsedItems;
  };

  const appendReferenceRows = (): [string, string, string, string][] => {
    const maxLen = Math.max(availableKategoris.length, availableSatuans.length);
    const rows: [string, string, string, string][] = [['Daftar Kategori', '', 'Kode Satuan', 'Nama Satuan']];
    for (let i = 0; i < maxLen; i++) {
      rows.push([
        availableKategoris[i]?.name || '',
        '',
        availableSatuans[i]?.code || '',
        availableSatuans[i]?.name || '',
      ]);
    }
    return rows;
  };

  const triggerDownload = async (wb: XlsxWriter, filename: string) => {
    const blob = await wb.toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = async () => {
    const wb = new XlsxWriter();
    wb.addSheet('Template', [
      ['SKU', 'Nama Barang', 'Kategori', 'Satuan', 'Min Stock', 'Deskripsi'],
      ['BRG-SAMPLE-001', 'Pipa PVC 2 Inch', 'Material', 'METER', 5, 'Pipa PVC merk Rucika'],
      ['BRG-SAMPLE-002', 'Semen Tiga Roda', 'Material', 'SAK', 10, 'Semen Portland 40kg'],
      ['BRG-SAMPLE-003', 'Helm Safety Orange', 'APD', 'PCS', 2, 'Helm keselamatan proyek'],
    ]);
    wb.addSheet('Referensi Kategori & Satuan', appendReferenceRows());
    await triggerDownload(wb, 'template_import_barang.xlsx');
  };

  const downloadExistingData = async () => {
    if (itemsLookup.length === 0) {
      alert('Tidak ada data barang untuk diunduh.');
      return;
    }
    const wb = new XlsxWriter();
    wb.addSheet('Data Barang Aktif', [
      ['SKU', 'Nama Barang', 'Kategori', 'Satuan', 'Min Stock', 'Deskripsi'],
      ...itemsLookup.map((b) => [b.sku, b.nama_barang, b.kategori, b.satuan, b.min_stock, b.bin_location || '']),
    ]);
    wb.addSheet('Referensi Kategori & Satuan', appendReferenceRows());
    await triggerDownload(wb, 'data_barang_saat_ini.xlsx');
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
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Page Size Selector */}
            <div className="w-24">
              <Select2
                value={String(pageSize)}
                onChange={(val) => {
                  setPageSize(Number(val) as 8 | 16 | 24);
                  setPage(1);
                }}
                options={[
                  { value: '8', label: '8' },
                  { value: '16', label: '16' },
                  { value: '24', label: '24' },
                ]}
                placeholder="Tampil"
              />
            </div>

            {/* List / Grid Toggle */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Tampilan List"
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Tampilan Grid"
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'list' ? (
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

          {renderPagination()}
        </CardContent>
      </Card>
      ) : (
        <Card>
          <CardContent className="p-5">
            {loading ? (
              <div className="py-16 flex justify-center">
                <Loading size="sm" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center">
                <Package className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">Belum ada data barang.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((b) => (
                  <div
                    key={b.id}
                    className="group relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg hover:border-[#F97316]/40 transition-all"
                  >
                    {/* Image */}
                    <div className="relative h-36 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                      {b.image_url ? (
                        <img
                          src={b.image_url}
                          alt={b.nama_barang}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <Package className="h-10 w-10 text-slate-300" />
                      )}
                      <span className="absolute top-2 left-2 font-mono text-[10px] font-bold text-[#F97316] bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-0.5 rounded-md border border-orange-100 dark:border-orange-950/40">
                        {b.sku}
                      </span>
                      {/* Actions overlay */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openClone(b)}
                          title="Salin"
                          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-500 hover:text-emerald-600 shadow-sm"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(b)}
                          title="Edit"
                          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-500 hover:text-[#F97316] shadow-sm"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(b.id)}
                          title="Hapus"
                          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-500 hover:text-red-500 shadow-sm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-3.5 space-y-2 flex-1 flex flex-col">
                      <div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 min-h-[2.5rem]">
                          {b.nama_barang}
                        </p>
                        {b.brand && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{b.brand}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {b.kategori}
                        </span>
                        <span className="text-slate-500 font-medium">{b.satuan}</span>
                      </div>

                      {b.bin_location && (
                        <p
                          className="text-[10px] text-slate-400 truncate"
                          title={b.bin_location}
                        >
                          📍 {b.bin_location}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100 dark:border-slate-800">
                        <Badge variant={stockVariant(b)}>{b.current_stock}</Badge>
                        <span className="text-[10px] text-slate-400">
                          min {b.effective_min_stock ?? b.min_stock}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {renderPagination()}
        </Card>
      )}

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
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
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
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {formError && (
                <Alert variant="danger" title="Error">
                  {formError}
                </Alert>
              )}

              {/* Copy from existing data selector (Only for new item creation) */}
              {!editId && itemsLookup.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-950/30">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                          bin_id: selectedItem.bin_id ? String(selectedItem.bin_id) : '',
                          bin_location: selectedItem.bin_location || '',
                        }));
                      }
                    }}
                    options={[
                      { value: '', label: '-- Pilih Barang Untuk Disalin --' },
                      ...itemsLookup.slice(0, 10).map((b) => ({
                        value: b.id.toString(),
                        label: `${b.nama_barang} (${b.sku})`,
                      })),
                    ]}
                    placeholder="Pilih barang untuk disalin datanya..."
                  />
                </div>
              )}

              {/* 2-Column Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: Identitas Barang */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 border-b border-slate-100 dark:border-slate-800 pb-1">
                    Identitas Barang
                  </h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      SKU *
                    </label>
                    <div className="flex gap-2">
                      <input
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Brand / Merk
                    </label>
                    <input
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                      placeholder="Schneider, Philips, dll..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                          placeholder="Kategori"
                        />
                      ) : (
                        <input
                          required
                          value={formData.kategori}
                          onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                          placeholder="Kategori..."
                        />
                      )}
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
                        placeholder="Satuan"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Lokasi, Stok & Finansial */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 border-b border-slate-100 dark:border-slate-800 pb-1">
                    Lokasi, Stok & Detail Lainnya
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Lokasi Rak (Bin Location)
                    </label>
                    <Select2
                      value={formData.bin_id}
                      onChange={(val) => setFormData({ ...formData, ...syncBinLocation(val) })}
                      options={[
                        { value: '', label: '-- Pilih Lokasi Bin --' },
                        ...availableBins.map((bin) => ({
                          value: bin.id.toString(),
                          label: bin.full_path || `${bin.code} - ${bin.name}`,
                        })),
                      ]}
                      placeholder="Pilih lokasi bin..."
                    />
                    {!availableBins.length && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        Belum ada Bin. Tambahkan lokasi di menu Manajemen Lokasi Inventori.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate block">
                        Stok Awal
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
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate block">
                        Stok Minimum
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
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate block">
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

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Foto Barang (Opsional)
                    </label>
                    <div className="flex items-center gap-3">
                      {formData.image_url ? (
                        <div className="h-16 w-16 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-950 flex items-center justify-center shrink-0">
                          <img
                            src={formData.image_url}
                            alt="Preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 shrink-0 text-xs">
                          No Photo
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
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
                            className="text-xs text-red-500 hover:underline inline-block mt-0.5"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">Pilih berkas gambar (JPG, PNG, atau WEBP, maks. 2MB)</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
