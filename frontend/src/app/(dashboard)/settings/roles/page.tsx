'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@priskila/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Alert,
  Button,
} from '@priskila/ui';
import {
  Shield,
  Pencil,
  Trash2,
  Plus,
  X,
  Loader2,
} from 'lucide-react';

interface RoleData {
  id: number;
  name: string;
  permissions: string[];
}

interface PermissionData {
  id: number;
  name: string;
}

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [permissions, setPermissions] = useState<PermissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: null as number | null,
    name: '',
    permissions: [] as string[],
  });

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.get<{ roles: RoleData[]; permissions: PermissionData[] }>('/roles');
      if (res.success && res.data) {
        setRoles(res.data.roles);
        setPermissions(res.data.permissions);
      }
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data role dan permission.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setForm({
      id: null,
      name: '',
      permissions: [],
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (role: RoleData) => {
    setForm({
      id: role.id,
      name: role.name,
      permissions: role.permissions,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const saveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.toLowerCase().trim(),
        permissions: form.permissions,
      };

      if (form.id) {
        await ApiService.put(`/roles/${form.id}`, payload);
      } else {
        await ApiService.post('/roles', payload);
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan role.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await ApiService.delete(`/roles/${deleteId}`);
      if (res.success) {
        setDeleteId(null);
        fetchData();
      } else {
        setError(res.message || 'Gagal menghapus role.');
        setDeleteId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus role.');
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const isSystemRole = (name: string) => ['admin', 'manager', 'staff'].includes(name.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#F97316]" />
            Manajemen Role & Permission
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Buat peran sistem (role) baru dan atur paket hak akses (permission) untuk masing-masing peran.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          Tambah Role Baru
        </Button>
      </div>

      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const sysRole = isSystemRole(role.name);
            return (
              <Card key={role.id} className="flex flex-col h-full">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base capitalize text-slate-800 dark:text-slate-200">
                      {role.name}
                    </CardTitle>
                    <CardDescription className="text-[10px] mt-0.5">
                      {sysRole ? 'Role Bawaan Sistem' : 'Role Kustom'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => openEdit(role)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#F97316]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {!sysRole && (
                      <button
                        onClick={() => setDeleteId(role.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 space-y-3">
                  <div className="text-xs font-semibold text-slate-500">Hak Akses Aktif:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">Belum ada hak akses.</span>
                    ) : (
                      role.permissions.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30"
                        >
                          {p}
                        </span>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Role Edit/Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                {form.id ? 'Edit Hak Akses Role' : 'Tambah Role Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={saveRole} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <Alert variant="danger" title="Error">
                  {formError}
                </Alert>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Nama Role *
                </label>
                <input
                  required
                  disabled={!!form.id && isSystemRole(form.name)}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 capitalize"
                  placeholder="Nama Role (misal: supervisor)"
                />
                {!!form.id && isSystemRole(form.name) && (
                  <p className="text-[10px] text-slate-400">Nama role bawaan sistem tidak dapat diubah.</p>
                )}
              </div>

              {/* Direct Permissions list */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block">
                  Paket Hak Akses (Permissions)
                </label>
                <p className="text-[10px] text-slate-400 font-normal">
                  Pilih hak akses yang akan dimiliki oleh pengguna dengan role ini.
                </p>
                <div className="grid grid-cols-2 gap-2 border border-slate-200 dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  {permissions.map((p) => {
                    const isChecked = form.permissions.includes(p.name);
                    return (
                      <label key={p.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const nextPerms = e.target.checked
                              ? [...form.permissions, p.name]
                              : form.permissions.filter((item) => item !== p.name);
                            setForm({ ...form, permissions: nextPerms });
                          }}
                          className="mt-0.5 rounded border-slate-300 text-[#F97316] focus:ring-[#F97316]/40"
                        />
                        <div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">{p.name}</span>
                          <span className="text-[9px] text-slate-400 leading-none block">
                            {p.name === 'manage-projects'
                              ? 'Kelola data proyek'
                              : p.name === 'manage-barang'
                                ? 'Kelola master barang'
                                : p.name === 'manage-suppliers'
                                  ? 'Kelola master supplier'
                                  : p.name === 'manage-transactions'
                                    ? 'Input/baca transaksi logistik'
                                    : p.name === 'approve-pemakaian'
                                      ? 'Approval pemakaian barang'
                                      : p.name === 'view-reports'
                                        ? 'Melihat laporan & kartu stok'
                                        : p.name === 'manage-settings'
                                          ? 'Mengubah pengaturan sistem'
                                          : p.name === 'manage-users'
                                            ? 'Mengelola pengguna & hak akses'
                                            : 'Penyesuaian stok (Adjustment & Opname)'}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
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
                  {form.id ? 'Simpan Perubahan' : 'Tambah Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 mx-auto">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Hapus Role?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Tindakan ini akan menghapus role secara permanen. Pengguna yang memiliki role ini harus ditugaskan ke role lain.
              </p>
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
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
