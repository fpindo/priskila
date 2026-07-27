'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ApiService } from '@priskila/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Avatar,
  Alert,
  Button,
} from '@priskila/ui';
import {
  Shield,
  Mail,
  UserCheck,
  Calendar,
  Key,
  Laptop,
  History,
  Loader2,
  RefreshCw,
  Smartphone,
  LogOut,
  Check,
  X,
} from 'lucide-react';

interface Device {
  id: number;
  name: string;
  ip_address: string;
  user_agent: string;
  os: string;
  browser: string;
  last_active_at: string;
  is_current: boolean;
}

interface LoginRecord {
  id: number;
  email: string;
  ip_address: string;
  user_agent: string;
  status: 'SUCCESS' | 'FAILED' | '2FA_PENDING';
  created_at: string;
}

interface AuditRecord {
  id: number;
  event: 'created' | 'updated' | 'deleted';
  auditable_type: string;
  auditable_id: number;
  old_values: Record<string, string | number | null> | null;
  new_values: Record<string, string | number | null> | null;
  ip_address: string;
  created_at: string;
  user?: { name: string };
}

interface ActivityRecord {
  id: number;
  activity: string;
  url: string;
  method: string;
  ip_address: string;
  created_at: string;
  user?: { name: string };
}

export default function ProfilePage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'profile' | '2fa' | 'devices' | 'login_history' | 'audit_logs'
  >('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setup2fa, setSetup2fa] = useState<{ secret: string; qr_url: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [confirming2fa, setConfirming2fa] = useState(false);
  const [disabling2fa, setDisabling2fa] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  // Devices & Logs states
  const [devices, setDevices] = useState<Device[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityRecord[]>([]);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (activeTab === 'profile') return;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === '2fa') {
        const profileRes = await ApiService.get<{ user: { two_factor_confirmed_at?: string } }>(
          '/auth/me'
        );
        if (profileRes.success) {
          setTwoFactorEnabled(!!profileRes.data.user.two_factor_confirmed_at);
        }
      } else if (activeTab === 'devices') {
        const res = await ApiService.get<Device[]>('/security/devices');
        if (res.success) setDevices(res.data);
      } else if (activeTab === 'login_history') {
        const res = await ApiService.get<{ data: LoginRecord[] }>('/security/logs/login-history');
        if (res.success) setLoginHistory(res.data.data);
      } else if (activeTab === 'audit_logs') {
        const [auditRes, actRes] = await Promise.all([
          ApiService.get<{ data: AuditRecord[] }>('/security/logs/audit'),
          ApiService.get<{ data: ActivityRecord[] }>('/security/logs/activity'),
        ]);
        if (auditRes.success) setAuditLogs(auditRes.data.data);
        if (actRes.success) setActivityLogs(actRes.data.data);
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal memuat data keamanan.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load initial profile data on mount to see if 2FA is active
  useEffect(() => {
    const check2fa = async () => {
      try {
        const profileRes = await ApiService.get<{ user: { two_factor_confirmed_at?: string } }>(
          '/auth/me'
        );
        if (profileRes.success) {
          setTwoFactorEnabled(!!profileRes.data.user.two_factor_confirmed_at);
        }
      } catch {
        /* ignore */
      }
    };
    check2fa();
  }, []);

  // 2FA action handlers
  const handleStart2faSetup = async () => {
    setError(null);
    try {
      const res = await ApiService.post<{ secret: string; qr_url: string }>('/auth/2fa/enable');
      if (res.success) {
        setSetup2fa(res.data);
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal menyiapkan 2FA.');
    }
  };

  const handleConfirm2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirming2fa(true);
    setError(null);
    try {
      const res = await ApiService.post<{ recovery_codes: string[] }>('/auth/2fa/confirm', {
        code: totpCode,
      });
      if (res.success) {
        setTwoFactorEnabled(true);
        setSetup2fa(null);
        setTotpCode('');
        setRecoveryCodes(res.data.recovery_codes);
        setSuccess('Two-Factor Authentication berhasil aktif!');
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Kode OTP tidak cocok.');
    } finally {
      setConfirming2fa(false);
    }
  };

  const handleDisable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisabling2fa(true);
    setError(null);
    try {
      const res = await ApiService.post('/auth/2fa/disable', { password: confirmPassword });
      if (res.success) {
        setTwoFactorEnabled(false);
        setConfirmPassword('');
        setSuccess('Two-Factor Authentication berhasil dinonaktifkan.');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Password salah.');
    } finally {
      setDisabling2fa(false);
    }
  };

  const handleRevokeDevice = async (id: number) => {
    setRevokingId(id);
    setError(null);
    try {
      const res = await ApiService.delete(`/security/devices/${id}`);
      if (res.success) {
        setDevices((d) => d.filter((item) => item.id !== id));
        setSuccess('Sesi perangkat berhasil diputuskan.');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal memutuskan sesi.');
    } finally {
      setRevokingId(null);
    }
  };

  const getCleanModelName = (str: string) => {
    return str.split('\\').pop() || str;
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Overview Card */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-650" />
        <CardContent className="p-6 relative">
          <div className="absolute -top-16 left-6">
            <div className="rounded-full ring-4 ring-white dark:ring-slate-900 overflow-hidden shadow-md">
              <Avatar name={user.name} size="lg" className="h-24 w-24 text-2xl" />
            </div>
          </div>

          <div className="pt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{user.name}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {user.email}
                </span>
                <span className="text-slate-350 dark:text-slate-650">•</span>
                <Badge variant="primary" className="capitalize px-3 py-1">
                  {user.roles?.[0] || 'Staff'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto scrollbar-thin">
        {[
          { id: 'profile', label: 'Ringkasan Akun', icon: <UserCheck className="h-4 w-4" /> },
          { id: '2fa', label: 'Keamanan 2FA', icon: <Key className="h-4 w-4" /> },
          { id: 'devices', label: 'Sesi Aktif', icon: <Laptop className="h-4 w-4" /> },
          { id: 'login_history', label: 'Riwayat Login', icon: <History className="h-4 w-4" /> },
          { id: 'audit_logs', label: 'Audit & Aktivitas', icon: <Shield className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#F97316] text-[#F97316]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
          </div>
        ) : (
          <>
            {/* TAB: Ringkasan Akun */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 h-fit">
                  <CardHeader>
                    <CardTitle className="text-base">Informasi Akun</CardTitle>
                    <CardDescription>Detail keanggotaan pengguna.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4.5 w-4.5 text-slate-450 dark:text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-450 uppercase font-semibold">Email</p>
                        <p className="truncate text-slate-900 dark:text-slate-100">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-4.5 w-4.5 text-slate-450 dark:text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-450 uppercase font-semibold">
                          Role Utama
                        </p>
                        <p className="truncate text-slate-900 dark:text-slate-100 capitalize">
                          {user.roles?.[0] || 'Staff'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4.5 w-4.5 text-slate-450 dark:text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-450 uppercase font-semibold">
                          Keamanan 2FA
                        </p>
                        <p className="truncate text-slate-900 dark:text-slate-100">
                          {twoFactorEnabled ? 'Aktif' : 'Nonaktif'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base">Hak Akses & Otorisasi</CardTitle>
                      <CardDescription>
                        Daftar izin (permissions) yang dimiliki oleh role Anda.
                      </CardDescription>
                    </div>
                    <Shield className="h-5 w-5 text-slate-450" />
                  </CardHeader>
                  <CardContent>
                    {user.permissions && user.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {user.permissions.map((permission, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="px-3.5 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 border-slate-100 dark:border-slate-800"
                          >
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-450 dark:text-slate-550 italic">
                        Tidak ada permission spesifik.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB: Keamanan 2FA */}
            {activeTab === '2fa' && (
              <Card>
                <CardHeader>
                  <CardTitle>Autentikasi Dua Faktor (2FA)</CardTitle>
                  <CardDescription>
                    Minta kode verifikasi dari aplikasi authenticator di ponsel Anda setiap kali
                    login ke dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div
                      className={`p-3 rounded-full ${twoFactorEnabled ? 'bg-green-100 text-green-600 dark:bg-green-950/20' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/20'}`}
                    >
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Status 2FA: {twoFactorEnabled ? 'Aktif' : 'Nonaktif'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {twoFactorEnabled
                          ? 'Akun Anda dilindungi oleh verifikasi dua langkah.'
                          : 'Akun Anda saat ini hanya dilindungi oleh kata sandi biasa.'}
                      </p>
                    </div>
                  </div>

                  {twoFactorEnabled && !disabling2fa && (
                    <Button variant="danger" onClick={() => setDisabling2fa(true)}>
                      Nonaktifkan 2FA
                    </Button>
                  )}

                  {recoveryCodes.length > 0 && (
                    <div className="p-4 border border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900/50 rounded-2xl space-y-3">
                      <h4 className="text-sm font-bold text-green-800 dark:text-green-300">
                        Kode Pemulihan Cadangan
                      </h4>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        Simpan kode ini dengan aman. Setiap kode hanya bisa digunakan sekali.
                      </p>
                      <div className="grid grid-cols-2 gap-2 font-mono text-xs p-3 bg-white dark:bg-slate-950 rounded-xl border border-green-100 dark:border-green-950">
                        {recoveryCodes.map((code, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" />
                            <span>{code}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!twoFactorEnabled && !setup2fa && (
                    <Button variant="primary" onClick={handleStart2faSetup}>
                      Aktifkan Autentikasi Dua Faktor
                    </Button>
                  )}

                  {setup2fa && (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 bg-slate-50/40 dark:bg-slate-950/20">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Langkah Pengaktifan 2FA
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#F97316] text-white text-xs font-bold shrink-0">
                              1
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Scan kode QR ini di aplikasi Authenticator ponsel Anda:
                            </p>
                          </div>
                          <div className="flex items-center justify-center p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 w-48 h-48 mx-auto">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(setup2fa.qr_url)}`}
                              alt="QR Code 2FA"
                              className="h-36 w-36"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#F97316] text-white text-xs font-bold shrink-0">
                              2
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Atau masukkan kode rahasia secara manual:
                            </p>
                          </div>
                          <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 font-mono text-center text-sm font-bold tracking-widest text-[#F97316]">
                            {setup2fa.secret}
                          </div>

                          <form
                            onSubmit={handleConfirm2fa}
                            className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800"
                          >
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Masukkan kode 6-digit verifikasi:
                            </label>
                            <div className="flex gap-2">
                              <input
                                required
                                value={totpCode}
                                onChange={(e) =>
                                  setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                                }
                                placeholder="000000"
                                className="flex-1 px-4 py-2 text-center text-lg font-bold tracking-widest border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                              />
                              <Button
                                type="submit"
                                disabled={totpCode.length !== 6 || confirming2fa}
                              >
                                {confirming2fa ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Verifikasi'
                                )}
                              </Button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                  {disabling2fa && (
                    <form
                      onSubmit={handleDisable2fa}
                      className="border border-red-200 dark:border-red-950/40 p-4 rounded-xl space-y-4 bg-red-50/20 max-w-md"
                    >
                      <h4 className="text-sm font-bold text-red-600 dark:text-red-400">
                        Konfirmasi Penonaktifan
                      </h4>
                      <p className="text-xs text-slate-500">
                        Ketik password akun Anda untuk mengonfirmasi penonaktifan 2FA.
                      </p>
                      <input
                        required
                        type="password"
                        placeholder="Masukkan password Anda"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDisabling2fa(false)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={disabling2fa}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          {disabling2fa ? 'Menonaktifkan...' : 'Ya, Nonaktifkan'}
                        </button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TAB: Sesi Perangkat Aktif */}
            {activeTab === 'devices' && (
              <Card>
                <CardHeader>
                  <CardTitle>Sesi Perangkat yang Aktif</CardTitle>
                  <CardDescription>
                    Daftar perangkat yang saat ini masuk ke akun Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {devices.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-sm">
                      Tidak ada sesi aktif.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {devices.map((device) => (
                        <div
                          key={device.id}
                          className="flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                        >
                          <div className="flex gap-4">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                              <Laptop className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                  {device.browser} ({device.os})
                                </span>
                                {device.is_current && (
                                  <Badge variant="success">Perangkat Ini</Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                IP: {device.ip_address} • Aktif:{' '}
                                {new Date(device.last_active_at).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                          {!device.is_current && (
                            <button
                              disabled={revokingId === device.id}
                              onClick={() => handleRevokeDevice(device.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 transition-colors"
                            >
                              {revokingId === device.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <LogOut className="h-3 w-3" />
                              )}
                              Putuskan
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TAB: Riwayat Login */}
            {activeTab === 'login_history' && (
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Login Terakhir</CardTitle>
                  <CardDescription>
                    Catatan upaya login akun Anda dalam 30 hari terakhir.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                          <th className="px-5 py-3 text-left font-semibold text-slate-500">
                            Waktu
                          </th>
                          <th className="px-5 py-3 text-left font-semibold text-slate-500">
                            Email
                          </th>
                          <th className="px-5 py-3 text-left font-semibold text-slate-500">
                            IP Address
                          </th>
                          <th className="px-5 py-3 text-left font-semibold text-slate-500">
                            Browser / OS
                          </th>
                          <th className="px-5 py-3 text-right font-semibold text-slate-500">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loginHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-500">
                              Belum ada riwayat login.
                            </td>
                          </tr>
                        ) : (
                          loginHistory.map((rec) => (
                            <tr
                              key={rec.id}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                            >
                              <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-xs">
                                {new Date(rec.created_at).toLocaleString('id-ID')}
                              </td>
                              <td className="px-5 py-4 font-medium text-slate-850 dark:text-slate-200">
                                {rec.email}
                              </td>
                              <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                {rec.ip_address}
                              </td>
                              <td
                                className="px-5 py-4 text-xs text-slate-500 truncate max-w-[200px]"
                                title={rec.user_agent}
                              >
                                {rec.user_agent}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <Badge
                                  variant={
                                    rec.status === 'SUCCESS'
                                      ? 'success'
                                      : rec.status === '2FA_PENDING'
                                        ? 'warning'
                                        : 'danger'
                                  }
                                >
                                  {rec.status === 'SUCCESS'
                                    ? 'Sukses'
                                    : rec.status === '2FA_PENDING'
                                      ? '2FA Pending'
                                      : 'Gagal'}
                                </Badge>
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

            {/* TAB: Audit Logs */}
            {activeTab === 'audit_logs' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Log Perubahan Data</CardTitle>
                    <CardDescription>Log perubahan sistem pada data master.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                            <th className="px-5 py-3 text-left font-semibold text-slate-500">
                              Waktu
                            </th>
                            <th className="px-5 py-3 text-left font-semibold text-slate-500">
                              Pengguna
                            </th>
                            <th className="px-5 py-3 text-left font-semibold text-slate-500">
                              Modul
                            </th>
                            <th className="px-5 py-3 text-left font-semibold text-slate-500">
                              Aksi
                            </th>
                            <th className="px-5 py-3 text-left font-semibold text-slate-500">
                              Perubahan
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {auditLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-500">
                                Belum ada log audit terekam.
                              </td>
                            </tr>
                          ) : (
                            auditLogs.map((log) => (
                              <tr
                                key={log.id}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                              >
                                <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-xs">
                                  {new Date(log.created_at).toLocaleString('id-ID')}
                                </td>
                                <td className="px-5 py-4 font-medium text-slate-850 dark:text-slate-200">
                                  {log.user?.name || 'System'}
                                </td>
                                <td className="px-5 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                  {getCleanModelName(log.auditable_type)} (ID: {log.auditable_id})
                                </td>
                                <td className="px-5 py-4">
                                  <Badge
                                    variant={
                                      log.event === 'created'
                                        ? 'success'
                                        : log.event === 'deleted'
                                          ? 'danger'
                                          : 'warning'
                                    }
                                  >
                                    {log.event.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="px-5 py-4 text-xs max-w-sm">
                                  {log.event === 'updated' && log.old_values && log.new_values && (
                                    <div className="space-y-1 font-mono text-[10px]">
                                      {Object.keys(log.new_values).map((key) => (
                                        <div
                                          key={key}
                                          className="text-slate-600 dark:text-slate-450"
                                        >
                                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {key}
                                          </span>
                                          : {JSON.stringify(log.old_values?.[key])} &rarr;{' '}
                                          <span className="text-[#F97316] font-bold">
                                            {JSON.stringify(log.new_values?.[key])}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {log.event === 'created' && log.new_values && (
                                    <div className="text-slate-500 italic">Data awal dibuat.</div>
                                  )}
                                  {log.event === 'deleted' && (
                                    <div className="text-red-500 italic">Data dihapus.</div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Log Aktivitas Umum</CardTitle>
                    <CardDescription>
                      Log tindakan mutasi HTTP request oleh pengguna aktif.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                            <th className="px-5 py-3 text-left font-semibold text-slate-500">
                              Waktu
                            </th>
                            <th className="px-5 py-3 text-left font-semibold text-slate-500">
                              Pengguna
                            </th>
                            <th className="px-5 py-3 text-left font-semibold text-slate-500">
                              Aktivitas
                            </th>
                            <th className="px-5 py-3 text-left font-semibold text-slate-500">
                              URL / Method
                            </th>
                            <th className="px-5 py-3 text-right font-semibold text-slate-500">
                              IP Address
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {activityLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-500">
                                Belum ada log aktivitas terekam.
                              </td>
                            </tr>
                          ) : (
                            activityLogs.map((act) => (
                              <tr
                                key={act.id}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                              >
                                <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-xs">
                                  {new Date(act.created_at).toLocaleString('id-ID')}
                                </td>
                                <td className="px-5 py-4 font-medium text-slate-850 dark:text-slate-200">
                                  {act.user?.name || 'System'}
                                </td>
                                <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-semibold">
                                  {act.activity}
                                </td>
                                <td className="px-5 py-4 text-xs whitespace-nowrap">
                                  <span className="font-bold text-slate-500 mr-2 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    {act.method}
                                  </span>
                                  <span className="font-mono text-slate-400">
                                    {act.url?.split('/api/').pop() || act.url}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right font-mono text-xs text-slate-500">
                                  {act.ip_address}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
