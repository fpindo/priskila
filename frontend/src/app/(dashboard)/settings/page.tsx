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
  Settings,
  Loader2,
  Save,
  RefreshCw,
  Zap,
  Briefcase,
  Package,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  Send,
  Home,
  ArrowLeftRight,
  ClipboardCheck,
  Sliders,
  FileText,
  Building,
  Image,
  MapPin,
  Globe,
  Activity,
  Award,
  Shield,
  Star,
  Heart,
  Boxes,
  Database,
  Users,
  Pencil,
  Trash2,
  Plus,
  X,
} from 'lucide-react';

interface CodeConfig {
  prefix: string;
  separator: string;
  padding: number;
  use_year: boolean;
  use_month: boolean;
}

interface Setting {
  id: number;
  key: string;
  label: string;
  description: string | null;
  value: any;
}

const LogoIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Package,
  Briefcase,
  Truck,
  Home,
  Globe,
  Activity,
  Award,
  Shield,
  Star,
  Heart,
  Boxes,
  Database,
};

const typeIcons: Record<string, React.ReactNode> = {
  sku: <Package className="h-5 w-5" />,
  kode_project: <Briefcase className="h-5 w-5" />,
  kode_supplier: <Truck className="h-5 w-5" />,
  kode_gudang: <Home className="h-5 w-5" />,
  nomor_barang_masuk: <ArrowDownToLine className="h-5 w-5" />,
  nomor_pemakaian: <ArrowUpFromLine className="h-5 w-5" />,
  nomor_delivery: <Send className="h-5 w-5" />,
  nomor_transfer: <ArrowLeftRight className="h-5 w-5" />,
  nomor_opname: <ClipboardCheck className="h-5 w-5" />,
  nomor_adjustment: <Sliders className="h-5 w-5" />,
  format_tanggal: <Calendar className="h-5 w-5" />,
  nama_perusahaan: <Building className="h-5 w-5" />,
  logo_perusahaan: <Image className="h-5 w-5" />,
  min_stock_global: <Boxes className="h-5 w-5" />,
  location_max_depth: <MapPin className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
  sku: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600',
  kode_project: 'bg-orange-50 dark:bg-orange-950/20 text-[#F97316]',
  kode_supplier: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600',
  kode_gudang: 'bg-sky-50 dark:bg-sky-950/20 text-sky-600',
  nomor_barang_masuk: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600',
  nomor_pemakaian: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600',
  nomor_delivery: 'bg-pink-50 dark:bg-pink-950/20 text-pink-600',
  nomor_transfer: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600',
  nomor_opname: 'bg-teal-50 dark:bg-teal-950/20 text-teal-600',
  nomor_adjustment: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600',
  format_tanggal: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600',
  nama_perusahaan: 'bg-orange-50 dark:bg-orange-950/20 text-[#F97316]',
  logo_perusahaan: 'bg-violet-50 dark:bg-violet-950/20 text-violet-600',
  min_stock_global: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600',
  location_max_depth: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600',
};

function buildPreview(config: CodeConfig): string {
  const parts: string[] = [config.prefix];

  if (config.use_year && config.use_month) {
    parts.push(new Date().toISOString().slice(0, 7).replace('-', ''));
  } else if (config.use_year) {
    parts.push(new Date().getFullYear().toString());
  }

  parts.push('1'.padStart(config.padding, '0'));
  return parts.join(config.separator || '-');
}

function buildDatePreview(format: string): string {
  const monthNamesIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const day = '27';
  const month = '07';
  const year = '2026';
  
  if (format === 'DD-MM-YYYY') return `${day}-${month}-${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
  if (format === 'DD MMMM YYYY') return `${day} ${monthNamesIndo[6]} ${year}`;
  return `${day}-${month}-${year}`;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [localSettings, setLocalSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'master' | 'document' | 'general' | 'users'>('master');

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
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

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.get<Setting[]>('/settings');
      if (res.success && res.data) {
        setSettings(res.data);
        setLocalSettings(JSON.parse(JSON.stringify(res.data)));
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal memuat pengaturan.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsersData = async () => {
    try {
      const res = await ApiService.get<any>('/users');
      if (res.success && res.data) {
        setUsers(res.data.users);
        setRoles(res.data.roles);
        setPermissions(res.data.permissions);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchUsersData();
  }, [fetchSettings]);

  // Rebuild previews whenever local settings change
  useEffect(() => {
    const p: Record<string, string> = {};
    localSettings.forEach((s) => {
      if (s.key === 'format_tanggal') {
        p[s.key] = buildDatePreview(s.value.format);
      } else if (s.key === 'nama_perusahaan') {
        p[s.key] = s.value.name;
      } else if (s.key === 'logo_perusahaan') {
        p[s.key] = s.value.type === 'icon' ? `Ikon: ${s.value.icon_name}` : 'Gambar Logo Kustom';
      } else if (s.key === 'min_stock_global') {
        p[s.key] = `${s.value.min_stock} unit`;
      } else if (s.key === 'location_max_depth') {
        const labels: Record<number, string> = { 1: 'Warehouse', 2: 'Warehouse → Zone', 3: 'Warehouse → Zone → Rack', 4: 'Warehouse → Zone → Rack → Shelf', 5: 'Warehouse → Zone → Rack → Shelf → Bin' };
        p[s.key] = labels[s.value.depth] || `${s.value.depth} level`;
      } else {
        p[s.key] = buildPreview(s.value);
      }
    });
    setPreviews(p);
  }, [localSettings]);

  const updateConfig = (idx: number, field: string, val: any) => {
    setLocalSettings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], value: { ...next[idx].value, [field]: val } };
      // use_year must be true if use_month is true
      if (field === 'use_month' && val === true) {
        next[idx].value.use_year = true;
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await ApiService.put('/settings', {
        settings: localSettings.map((s) => ({
          key: s.key,
          label: s.label,
          description: s.description,
          value: s.value,
        })),
      });
      setSuccess('Pengaturan berhasil disimpan!');
      setSettings(JSON.parse(JSON.stringify(localSettings)));

      // Dispatch company name update event live
      const companySetting = localSettings.find((s) => s.key === 'nama_perusahaan');
      if (companySetting && companySetting.value && companySetting.value.name) {
        window.dispatchEvent(new CustomEvent('company-name-updated', { detail: companySetting.value.name }));
      }

      // Dispatch company logo update event live
      const logoSetting = localSettings.find((s) => s.key === 'logo_perusahaan');
      if (logoSetting && logoSetting.value) {
        window.dispatchEvent(new CustomEvent('company-logo-updated', { detail: logoSetting.value }));
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(JSON.parse(JSON.stringify(settings)));
    setError(null);
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#F97316]" />
            Pengaturan Sistem
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Konfigurasi format penomoran otomatis, opsi penanggalan, dan hak akses pengguna.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
          )}
          <Button variant="primary" onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" title="Berhasil">
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('master')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none -mb-px shrink-0 ${
            activeTab === 'master'
              ? 'border-[#F97316] text-[#F97316]'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Format Kode Master
        </button>
        <button
          onClick={() => setActiveTab('document')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none -mb-px shrink-0 ${
            activeTab === 'document'
              ? 'border-[#F97316] text-[#F97316]'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
          }`}
        >
          <FileText className="h-4 w-4" />
          Format No. Dokumen
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none -mb-px shrink-0 ${
            activeTab === 'general'
              ? 'border-[#F97316] text-[#F97316]'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Format Umum & Tanggal
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none -mb-px shrink-0 ${
            activeTab === 'users'
              ? 'border-[#F97316] text-[#F97316]'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
          }`}
        >
          <Users className="h-4 w-4" />
          Hak Akses & Pengguna
        </button>
      </div>

      {/* Settings Cards / User Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
        </div>
      ) : activeTab === 'users' ? (
        /* User management list */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Daftar Pengguna & Hak Akses</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Kelola data pengguna, peranan (role), dan hak akses langsung (permission) mereka.
              </CardDescription>
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
              className="text-xs py-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Tambah Pengguna
            </Button>
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
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {localSettings
            .map((setting, idx) => ({ setting, idx }))
            .filter(({ setting }) => {
              if (activeTab === 'general') {
                return setting.key === 'format_tanggal' || setting.key === 'nama_perusahaan' || setting.key === 'logo_perusahaan' || setting.key === 'min_stock_global' || setting.key === 'location_max_depth';
              }
              if (activeTab === 'document') {
                return setting.key.startsWith('nomor_');
              }
              // activeTab === 'master'
              return !setting.key.startsWith('nomor_') && setting.key !== 'format_tanggal' && setting.key !== 'nama_perusahaan' && setting.key !== 'logo_perusahaan' && setting.key !== 'min_stock_global' && setting.key !== 'location_max_depth';
            })
            .map(({ setting, idx }) => (
              <Card key={setting.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${typeColors[setting.key] || 'bg-slate-100 text-slate-500'}`}
                    >
                      {typeIcons[setting.key] || <Settings className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-base">{setting.label}</CardTitle>
                      {setting.description && (
                        <CardDescription className="text-xs mt-0.5">
                          {setting.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">Preview Hasil</p>
                    {setting.key === 'logo_perusahaan' && setting.value.type === 'image' && setting.value.image_url ? (
                      <div className="h-10 w-10 p-1 bg-white border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center">
                        <img src={setting.value.image_url} alt="Logo" className="h-full w-full object-contain" />
                      </div>
                    ) : setting.key === 'logo_perusahaan' && setting.value.type === 'icon' ? (
                      <div className="h-10 w-10 rounded-xl bg-[#F97316] text-white flex items-center justify-center shadow-sm">
                        {(() => {
                          const IconComp = LogoIconMap[setting.value.icon_name || 'Zap'];
                          return IconComp ? <IconComp className="h-5 w-5" /> : 'P';
                        })()}
                      </div>
                    ) : (
                      <p className="font-mono text-lg font-bold text-[#F97316]">
                        {previews[setting.key] || '...'}
                      </p>
                    )}
                  </div>

                  {setting.key === 'format_tanggal' ? (
                    /* Date format field */
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Format Tanggal *
                      </label>
                      <Select2
                        value={setting.value.format}
                        onChange={(val) => updateConfig(idx, 'format', val)}
                        options={[
                          { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (Contoh: 27-07-2026)' },
                          { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (Contoh: 2026-07-27)' },
                          { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Contoh: 27/07/2026)' },
                          { value: 'DD MMMM YYYY', label: 'DD MMMM YYYY (Contoh: 27 Juli 2026)' },
                        ]}
                      />
                      <p className="text-[10px] text-slate-400">Pilih format penanggalan yang digunakan sistem</p>
                    </div>
                  ) : setting.key === 'min_stock_global' ? (
                    /* Global Min Stock field */
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Minimal Stock Global *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={setting.value.min_stock}
                        onChange={(e) => updateConfig(idx, 'min_stock', Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                        placeholder="5"
                      />
                      <p className="text-[10px] text-slate-400">Batas minimum stock global yang berlaku jika barang tidak diatur secara khusus.</p>
                    </div>
                  ) : setting.key === 'location_max_depth' ? (
                    /* Location Hierarchy Depth field */
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Kedalaman Hierarki Lokasi *
                      </label>
                      <Select2
                        value={String(setting.value.depth)}
                        onChange={(val) => updateConfig(idx, 'depth', Number(val))}
                        options={[
                          { value: '1', label: '1 — Warehouse saja' },
                          { value: '2', label: '2 — Warehouse → Zone' },
                          { value: '3', label: '3 — Warehouse → Zone → Rack' },
                          { value: '4', label: '4 — Warehouse → Zone → Rack → Shelf' },
                          { value: '5', label: '5 — Warehouse → Zone → Rack → Shelf → Bin (Penuh)' },
                        ]}
                      />
                      <p className="text-[10px] text-slate-400">Mengatur seberapa dalam hierarki lokasi gudang yang digunakan. Level yang lebih dalam dari nilai ini disembunyikan dari menu Lokasi.</p>
                    </div>
                  ) : setting.key === 'nama_perusahaan' ? (
                    /* Company Name field */
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Nama Perusahaan *
                      </label>
                      <input
                        value={setting.value.name}
                        onChange={(e) => updateConfig(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                        placeholder="PT. PRISKILA LOGISTIK"
                      />
                      <p className="text-[10px] text-slate-400">Nama perusahaan/instansi yang akan ditampilkan di seluruh sistem</p>
                    </div>
                  ) : setting.key === 'logo_perusahaan' ? (
                    /* Logo Perusahaan field */
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                          Tipe Logo *
                        </label>
                        <Select2
                          value={setting.value.type}
                          onChange={(val) => updateConfig(idx, 'type', val)}
                          options={[
                            { value: 'icon', label: 'Ikon Sistem (Lucide Icons)' },
                            { value: 'image', label: 'Gambar Logo Kustom (Upload)' },
                          ]}
                        />
                      </div>

                      {setting.value.type === 'icon' ? (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                            Pilih Ikon Logo
                          </label>
                          <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900">
                            {[
                              { name: 'Zap', label: 'Petir' },
                              { name: 'Package', label: 'Paket' },
                              { name: 'Briefcase', label: 'Tas' },
                              { name: 'Truck', label: 'Truk' },
                              { name: 'Home', label: 'Rumah' },
                              { name: 'Globe', label: 'Dunia' },
                              { name: 'Activity', label: 'Detak' },
                              { name: 'Award', label: 'Medali' },
                              { name: 'Shield', label: 'Perisai' },
                              { name: 'Star', label: 'Bintang' },
                              { name: 'Heart', label: 'Hati' },
                              { name: 'Boxes', label: 'Kotak' },
                              { name: 'Database', label: 'Data' },
                            ].map((ico) => {
                              const IcoComp = LogoIconMap[ico.name];
                              const isSelected = setting.value.icon_name === ico.name;
                              return (
                                <button
                                  key={ico.name}
                                  type="button"
                                  onClick={() => updateConfig(idx, 'icon_name', ico.name)}
                                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                                    isSelected
                                      ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                  title={ico.label}
                                >
                                  {IcoComp && <IcoComp className="h-5 w-5" />}
                                  <span className="text-[9px] mt-1 truncate max-w-full">{ico.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                            Unggah Gambar Logo
                          </label>
                          <div className="flex items-center gap-3">
                            {setting.value.image_url && (
                              <div className="h-12 w-12 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white flex items-center justify-center shrink-0">
                                <img
                                  src={setting.value.image_url}
                                  alt="Logo Preview"
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
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    updateConfig(idx, 'image_url', reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#F97316]/10 file:text-[#F97316] hover:file:bg-[#F97316]/20 cursor-pointer"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400">Direkomendasikan format persegi (1:1) berlatar belakang transparan</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Original Code Config Fields */
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Prefix *
                          </label>
                          <input
                            value={setting.value.prefix}
                            onChange={(e) => updateConfig(idx, 'prefix', e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] uppercase"
                            placeholder="BRG"
                            maxLength={10}
                          />
                          <p className="text-[10px] text-slate-400">Awalan kode (huruf kapital)</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Separator *
                          </label>
                          <Select2
                            value={setting.value.separator}
                            onChange={(val) => updateConfig(idx, 'separator', val)}
                            options={[
                              { value: '-', label: 'Tanda Hubung (-)' },
                              { value: '/', label: '/' },
                              { value: '.', label: 'Titik (.)' },
                              { value: '_', label: 'Garis Bawah (_)' },
                            ]}
                          />
                          <p className="text-[10px] text-slate-400">Pemisah antar bagian kode</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Padding Angka
                          </label>
                          <Select2
                            value={setting.value.padding}
                            onChange={(val) => updateConfig(idx, 'padding', Number(val))}
                            options={[
                              { value: 2, label: '2 digit (01)' },
                              { value: 3, label: '3 digit (001)' },
                              { value: 4, label: '4 digit (0001)' },
                              { value: 5, label: '5 digit (00001)' },
                            ]}
                          />
                          <p className="text-[10px] text-slate-400">Jumlah digit nomor urut</p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                Include Tahun
                              </label>
                              <p className="text-[10px] text-slate-400">Tambahkan tahun (2026)</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateConfig(idx, 'use_year', !setting.value.use_year)}
                              className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${setting.value.use_year ? 'bg-[#F97316]' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${setting.value.use_year ? 'translate-x-5' : 'translate-x-0'}`}
                              />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                Include Bulan
                              </label>
                              <p className="text-[10px] text-slate-400">Tambahkan bulan (07)</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateConfig(idx, 'use_month', !setting.value.use_month)}
                              className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${setting.value.use_month ? 'bg-[#F97316]' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${setting.value.use_month ? 'translate-x-5' : 'translate-x-0'}`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Format description */}
                      <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg px-3 py-2">
                        Format:{' '}
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {setting.value.prefix}
                          {setting.value.use_year ? `${setting.value.separator}YYYY` : ''}
                          {setting.value.use_month ? `${setting.value.separator}MM` : ''}
                          {setting.value.separator}
                          {'N'.repeat(setting.value.padding)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 flex justify-between">
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block">
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
                                      : 'Melihat laporan & kartu stok'}
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
