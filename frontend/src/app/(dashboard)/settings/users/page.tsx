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
  Select2,
  Badge,
} from '@priskila/ui';
import {
  Users,
  Pencil,
  Trash2,
  Plus,
  X,
  Loader2,
  Truck,
  Package,
} from 'lucide-react';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userDeleteId, setUserDeleteId] = useState<number | null>(null);
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    id: null as number | null,
    name: '',
    email: '',
    password: '',
    role: 'staff',
    permissions: [] as string[],
  });

  const fetchUsersData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.get<any>('/users');
      if (res.success && res.data) {
        setUsers(res.data.users);
        setRoles(res.data.roles);
        setPermissions(res.data.permissions);
      }
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data pengguna.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#F97316]" />
            Manajemen Hak Akses & Pengguna
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola data pengguna, peranan (role), dan hak akses langsung (permission) mereka.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setUserForm({
              id: null,
              name: '',
              email: '',
              password: '',
              role: 'staff',
              permissions: [],
            });
            setUserError(null);
            setUserModalOpen(true);
          }}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
          Tambah Pengguna
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Daftar Pengguna & Hak Akses</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Grup peran default dan hak akses tambahan per pengguna.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                      Nama Pengguna
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                      Email
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                      Role / Peran
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400">
                      Hak Akses Tambahan
                    </th>
                    <th className="px-5 py-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        Belum ada data pengguna.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                          {u.name}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-semibold text-[#F97316] bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-lg uppercase">
                            {u.roles.join(', ') || 'no role'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {u.permissions.length === 0 ? (
                              <span className="text-xs text-slate-400">Mengikuti default role</span>
                            ) : (
                              u.permissions.map((p: string) => (
                                <Badge key={p} variant="success">
                                  {p}
                                </Badge>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setUserForm({
                                  id: u.id,
                                  name: u.name,
                                  email: u.email,
                                  password: '',
                                  role: u.roles[0] || 'staff',
                                  permissions: u.permissions,
                                });
                                setUserError(null);
                                setUserModalOpen(true);
                              }}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#F97316] transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setUserDeleteId(u.id)}
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
      )}

      {/* User Edit/Create Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                {userForm.id ? 'Edit Pengguna & Hak Akses' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                onClick={() => setUserModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setUserSaving(true);
                setUserError(null);
                try {
                  const payload = {
                    name: userForm.name,
                    email: userForm.email,
                    role: userForm.role,
                    permissions: userForm.permissions,
                    password: userForm.password || undefined,
                  };

                  if (userForm.id) {
                    await ApiService.put(`/users/${userForm.id}`, payload);
                  } else {
                    await ApiService.post('/users', payload);
                  }
                  
                  setUserModalOpen(false);
                  fetchUsersData();
                } catch (err: any) {
                  setUserError(err.message || 'Gagal menyimpan data pengguna.');
                } finally {
                  setUserSaving(false);
                }
              }}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              {userError && (
                <Alert variant="danger" title="Error">
                  {userError}
                </Alert>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                  Nama Pengguna *
                </label>
                <input
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                  placeholder="Nama Lengkap"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                  placeholder="nama@email.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355 flex justify-between">
                  <span>Kata Sandi {userForm.id ? '' : '*'}</span>
                  {userForm.id && <span className="text-[10px] text-slate-400 font-normal">Biarkan kosong jika tidak diubah</span>}
                </label>
                <input
                  required={!userForm.id}
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                  placeholder="******"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                  Role / Peran *
                </label>
                <Select2
                  value={userForm.role}
                  onChange={(val) => setUserForm({ ...userForm, role: val })}
                  options={roles.map((r) => ({
                    value: r,
                    label: r === 'admin' ? 'Administrator (Semua Akses)' : r === 'manager' ? 'Manager (Akses Persetujuan & Laporan)' : 'Staff (Input Transaksi)',
                  }))}
                />
              </div>

              {/* Direct Permissions list */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355 block">
                  Hak Akses Khusus (Direct Permission)
                </label>
                <p className="text-[10px] text-slate-400">
                  Gunakan ini untuk memberikan hak akses tertentu secara langsung di luar role default mereka.
                </p>
                <div className="grid grid-cols-2 gap-2 border border-slate-200 dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  {permissions.map((p) => {
                    const isChecked = userForm.permissions.includes(p);
                    return (
                      <label key={p} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const nextPerms = e.target.checked
                              ? [...userForm.permissions, p]
                              : userForm.permissions.filter((item) => item !== p);
                            setUserForm({ ...userForm, permissions: nextPerms });
                          }}
                          className="mt-0.5 rounded border-slate-300 text-[#F97316] focus:ring-[#F97316]/40"
                        />
                        <div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">{p}</span>
                          <span className="text-[9px] text-slate-400 leading-none block">
                            {p === 'manage-projects'
                              ? 'Kelola data proyek'
                              : p === 'manage-barang'
                                ? 'Kelola master barang'
                                : p === 'manage-suppliers'
                                  ? 'Kelola master supplier'
                                  : p === 'manage-transactions'
                                    ? 'Input/baca transaksi logistik'
                                    : p === 'approve-pemakaian'
                                      ? 'Approval pemakaian barang'
                                      : p === 'view-reports'
                                        ? 'Melihat laporan & kartu stok'
                                        : p === 'manage-settings'
                                          ? 'Mengubah pengaturan sistem'
                                          : p === 'manage-users'
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
                  onClick={() => setUserModalOpen(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={userSaving}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#F97316] hover:bg-orange-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {userSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {userForm.id ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Delete Confirmation Modal */}
      {userDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 mx-auto">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Hapus Pengguna?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Tindakan ini akan menghapus akses pengguna dari sistem secara permanen.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setUserDeleteId(null)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  try {
                    await ApiService.delete(`/users/${userDeleteId}`);
                    setUserDeleteId(null);
                    fetchUsersData();
                  } catch (err: any) {
                    setError(err.message || 'Gagal menghapus pengguna.');
                    setUserDeleteId(null);
                  }
                }}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
