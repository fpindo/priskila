'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Button, Badge, Loading, Select2 } from '@priskila/ui';
import {
  Search,
  Plus,
  Eye,
  Loader2,
  ArrowUpFromLine,
  RefreshCw,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Project {
  id: number;
  nama_project: string;
}
interface Barang {
  id: number;
  nama_barang: string;
  sku: string;
  satuan: string;
  current_stock: number;
}

interface PemakaianDoc {
  id: number;
  nomor_dokumen: string;
  tanggal_pemakaian: string;
  project: { nama_project: string } | null;
  status_approval: 'PENDING' | 'APPROVED' | 'REJECTED';
  keterangan: string | null;
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
  catatan: string;
}

const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: 'Menunggu', variant: 'warning' },
  APPROVED: { label: 'Disetujui', variant: 'success' },
  REJECTED: { label: 'Ditolak', variant: 'danger' },
};

const emptyDetail = (): DetailItem => ({ barang_id: '', jumlah: 1, catatan: '' });

export default function PemakaianBarangPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin');

  const [docs, setDocs] = useState<PemakaianDoc[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [barangAll, setBarangAll] = useState<Barang[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nomor_dokumen: '',
    tanggal_pemakaian: '',
    project_id: '',
    keterangan: '',
  });
  const [details, setDetails] = useState<DetailItem[]>([emptyDetail()]);

  const [viewDoc, setViewDoc] = useState<PemakaianDoc | null>(null);
  const [approving, setApproving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await ApiService.get<{ code: string }>('/settings/generate-code/nomor_pemakaian');
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
      if (filterStatus) params.status_approval = filterStatus;
      const res = await ApiService.get<PaginatedResponse<PemakaianDoc>>(
        '/pemakaian-barang',
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
  }, [search, filterStatus, page]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const openCreate = async () => {
    setFormData({
      nomor_dokumen: '',
      tanggal_pemakaian: new Date().toISOString().split('T')[0],
      project_id: '',
      keterangan: '',
    });
    setDetails([emptyDetail()]);
    setFormError(null);
    setModalOpen(true);
    generateCode();
    try {
      const [projRes, brgRes] = await Promise.all([
        ApiService.get<PaginatedResponse<Project>>('/projects', { limit: 100, status: 'ACTIVE' }),
        ApiService.get<PaginatedResponse<Barang>>('/barang', { limit: 500 }),
      ]);
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
    if (details.some((d) => !d.barang_id || d.jumlah < 1)) {
      setFormError('Lengkapi semua item barang.');
      setSaving(false);
      return;
    }
    try {
      const payload = {
        ...formData,
        keterangan: formData.keterangan || null,
        items: details.map((d) => ({
          barang_id: Number(d.barang_id),
          jumlah: d.jumlah,
          catatan: d.catatan || null,
        })),
      };
      await ApiService.post('/pemakaian-barang', payload);
      setModalOpen(false);
      fetchDocs();
    } catch (e) {
      setFormError((e as { message?: string }).message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: number) => {
    setApproving(true);
    try {
      await ApiService.post(`/pemakaian-barang/${id}/approve`);
      setViewDoc(null);
      fetchDocs();
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal approve.');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (id: number) => {
    setApproving(true);
    try {
      await ApiService.post(`/pemakaian-barang/${id}/reject`);
      setViewDoc(null);
      fetchDocs();
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal reject.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Pemakaian Barang</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Ajukan permintaan pemakaian barang untuk project.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span>Buat Permintaan</span>
        </Button>
      </div>
      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
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
            <Select2
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'PENDING', label: 'Menunggu' },
                { value: 'APPROVED', label: 'Disetujui' },
                { value: 'REJECTED', label: 'Ditolak' },
              ]}
              placeholder="Status"
              className="sm:w-48"
            />
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
                    Project
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
                    <td colSpan={5} className="py-16 text-center">
                      <Loading size="sm" />
                    </td>
                  </tr>
                ) : docs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <ArrowUpFromLine className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500 text-sm">Belum ada data pemakaian barang.</p>
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
                        {d.tanggal_pemakaian}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                        {d.project?.nama_project || '-'}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={statusConfig[d.status_approval]?.variant || 'secondary'}>
                          {statusConfig[d.status_approval]?.label || d.status_approval}
                        </Badge>
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
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                Buat Permintaan Pemakaian
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
                    placeholder="PKB-2026-001"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tanggal Pemakaian *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_pemakaian}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggal_pemakaian: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project *
                </label>
                <Select2
                  required
                  value={formData.project_id}
                  onChange={(val) => setFormData({ ...formData, project_id: val })}
                  options={projects.map((p) => ({ value: p.id, label: p.nama_project }))}
                  placeholder="-- Pilih Project --"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Keterangan
                </label>
                <textarea
                  rows={2}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 resize-none"
                  placeholder="Keterangan penggunaan..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Item Barang yang Digunakan
                  </h4>
                  <button
                    type="button"
                    onClick={addDetail}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 dark:bg-orange-950/20 text-[#F97316] hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Tambah Item
                  </button>
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
                          options={barangAll.map((b) => ({
                            value: b.id,
                            label: `${b.sku} - ${b.nama_barang} (Stok: ${b.current_stock})`,
                          }))}
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
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600 dark:text-slate-400">Catatan</label>
                      <input
                        value={det.catatan}
                        onChange={(e) => updateDetail(i, 'catatan', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                        placeholder="Catatan..."
                      />
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
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}Ajukan Permintaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View / Approval Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Detail Pemakaian</h3>
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
                  {viewDoc.tanggal_pemakaian}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Project</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {viewDoc.project?.nama_project || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <Badge variant={statusConfig[viewDoc.status_approval]?.variant || 'secondary'}>
                  {statusConfig[viewDoc.status_approval]?.label}
                </Badge>
              </div>
              {viewDoc.keterangan && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 block mb-1">Keterangan:</span>
                  <p className="text-slate-700 dark:text-slate-300">{viewDoc.keterangan}</p>
                </div>
              )}
            </div>
            {isAdmin && viewDoc.status_approval === 'PENDING' && (
              <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleReject(viewDoc.id)}
                  disabled={approving}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {approving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Tolak
                </button>
                <button
                  onClick={() => handleApprove(viewDoc.id)}
                  disabled={approving}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {approving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Setujui
                </button>
              </div>
            )}
            <button
              onClick={() => setViewDoc(null)}
              className="w-full py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
