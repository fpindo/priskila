'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Badge, Button, Loading, Select2 } from '@priskila/ui';
import { Search, Plus, Pencil, Trash2, Loader2, Briefcase, RefreshCw, X, Zap } from 'lucide-react';

interface Project {
  id: number;
  kode_project: string;
  nama_project: string;
  deskripsi: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  status: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'primary'> = {
  ACTIVE: 'success',
  COMPLETED: 'primary',
  ON_HOLD: 'warning',
  CANCELLED: 'danger',
};
const statusLabel: Record<string, string> = {
  ACTIVE: 'Aktif',
  COMPLETED: 'Selesai',
  ON_HOLD: 'Ditunda',
  CANCELLED: 'Dibatalkan',
};
const emptyForm = {
  kode_project: '',
  nama_project: '',
  deskripsi: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
  status: 'ACTIVE',
};

const formatDate = (dateStr: string | null, formatPattern: string = 'DD-MM-YYYY') => {
  if (!dateStr) return '';
  try {
    const onlyDate = dateStr.split('T')[0];
    const [year, month, day] = onlyDate.split('-');
    if (!year || !month || !day) return onlyDate;

    if (formatPattern === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    if (formatPattern === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
    if (formatPattern === 'DD MMMM YYYY') {
      const monthNamesIndo = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const mIdx = parseInt(month, 10) - 1;
      return `${day} ${monthNamesIndo[mIdx] || month} ${year}`;
    }
    return `${day}-${month}-${year}`; // Default DD-MM-YYYY
  } catch {
    return dateStr || '';
  }
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dateFormat, setDateFormat] = useState('DD-MM-YYYY');

  const fetchDateFormat = useCallback(async () => {
    try {
      const res = await ApiService.get<any[]>('/settings');
      if (res.success && res.data) {
        const dateSetting = res.data.find((s) => s.key === 'format_tanggal');
        if (dateSetting && dateSetting.value && dateSetting.value.format) {
          setDateFormat(dateSetting.value.format);
        }
      }
    } catch {
      /* ignore, fallback to default */
    }
  }, []);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await ApiService.get<{ code: string }>('/settings/generate-code/kode_project');
      if (res.success && res.data) setFormData((f) => ({ ...f, kode_project: res.data.code }));
    } catch {
      /* ignore */
    } finally {
      setGenerating(false);
    }
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: 10, page };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await ApiService.get<PaginatedResponse<Project>>('/projects', params);
      if (res.success && res.data) {
        setProjects(res.data.data);
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
    fetchProjects();
    fetchDateFormat();
  }, [fetchProjects, fetchDateFormat]);

  const openCreate = () => {
    setEditId(null);
    setFormData({ ...emptyForm });
    setFormError(null);
    setModalOpen(true);
    generateCode();
  };
  const openEdit = (p: Project) => {
    setEditId(p.id);
    setFormData({
      kode_project: p.kode_project,
      nama_project: p.nama_project,
      deskripsi: p.deskripsi || '',
      tanggal_mulai: p.tanggal_mulai ? p.tanggal_mulai.split('T')[0] : '',
      tanggal_selesai: p.tanggal_selesai ? p.tanggal_selesai.split('T')[0] : '',
      status: p.status,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...formData,
        tanggal_selesai: formData.tanggal_selesai || null,
        deskripsi: formData.deskripsi || null,
      };
      if (editId) await ApiService.put(`/projects/${editId}`, payload);
      else await ApiService.post('/projects', payload);
      setModalOpen(false);
      fetchProjects();
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
      await ApiService.delete(`/projects/${deleteId}`);
      setDeleteId(null);
      fetchProjects();
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Master Project</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola semua data proyek konstruksi & elektrikal.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span>Tambah Project</span>
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
                placeholder="Cari kode atau nama project..."
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
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'COMPLETED', label: 'Selesai' },
                { value: 'ON_HOLD', label: 'Ditunda' },
                { value: 'CANCELLED', label: 'Dibatalkan' },
              ]}
              placeholder="Status"
              className="sm:w-48"
            />
            <button
              onClick={fetchProjects}
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
                    Kode Project
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Nama Project
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                    Periode
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
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Briefcase className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500 text-sm">Belum ada data project.</p>
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-[#F97316] bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded-lg">
                          {p.kode_project}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {p.nama_project}
                        </p>
                        {p.deskripsi && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                            {p.deskripsi}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="text-xs font-semibold">{formatDate(p.tanggal_mulai, dateFormat)}</div>
                        <div className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">
                          s/d {formatDate(p.tanggal_selesai, dateFormat) || 'Sekarang'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={statusVariant[p.status] || 'secondary'}>
                          {statusLabel[p.status] || p.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#F97316] transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
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
          {!loading && projects.length > 0 && (
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                {editId ? 'Edit Project' : 'Tambah Project Baru'}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kode Project *
                  </label>
                  <input
                    required
                    value={formData.kode_project}
                    onChange={(e) => setFormData({ ...formData, kode_project: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                    placeholder="PRJ-2026-001"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status *
                  </label>
                  <Select2
                    required
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={[
                      { value: 'ACTIVE', label: 'Aktif' },
                      { value: 'COMPLETED', label: 'Selesai' },
                      { value: 'ON_HOLD', label: 'Ditunda' },
                      { value: 'CANCELLED', label: 'Dibatalkan' },
                    ]}
                    placeholder="Pilih Status"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Project *
                </label>
                <input
                  required
                  value={formData.nama_project}
                  onChange={(e) => setFormData({ ...formData, nama_project: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                  placeholder="Nama proyek..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Deskripsi
                </label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 resize-none"
                  placeholder="Deskripsi singkat project..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_mulai}
                    onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_selesai}
                    onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                  />
                </div>
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
                  {editId ? 'Simpan Perubahan' : 'Buat Project'}
                </button>
              </div>
            </form>
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
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Hapus Project?</h3>
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
