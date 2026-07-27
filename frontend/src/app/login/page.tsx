'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Alert,
} from '@priskila/ui';
import { LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, verify2fa } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [challengeUserId, setChallengeUserId] = useState<number | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setIsSubmitting(true);
    setRememberMe(!!data.remember);

    try {
      const response = await login(data.email, data.password, data.remember);

      if (response && response.twoFactorRequired) {
        setChallengeUserId(response.userId ?? null);
        setShow2fa(true);
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Login failed. Please check your credentials.');
      console.error('[Login Error]', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeUserId || totpCode.length !== 6) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await verify2fa(challengeUserId, totpCode, rememberMe);
    } catch (err) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Kode verifikasi 2FA salah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          {/* Logo / Title */}
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[#2563EB] text-white shadow-md mb-4">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            PRISKILA
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Project Inventory Stock & Logistics Application
          </p>
        </div>

        {show2fa ? (
          <Card className="border border-slate-100 dark:border-slate-800 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Verifikasi Dua Langkah</CardTitle>
              <CardDescription>
                Masukkan 6-digit kode verifikasi dari aplikasi Authenticator Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handle2faSubmit} className="space-y-4">
                {error && (
                  <Alert variant="danger" title="Verifikasi Gagal">
                    {error}
                  </Alert>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kode Verifikasi
                  </label>
                  <input
                    required
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 text-center text-2xl font-bold tracking-[0.75em] border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB]"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11"
                  disabled={totpCode.length !== 6 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <span>Verifikasi & Masuk</span>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setShow2fa(false);
                    setTotpCode('');
                    setError(null);
                  }}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-750 dark:hover:text-slate-350 transition-colors"
                >
                  Kembali ke Halaman Login
                </button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-slate-100 dark:border-slate-800 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Masuk ke Akun Anda</CardTitle>
              <CardDescription>
                Masukkan email dan password untuk mengakses sistem inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="danger" title="Login Gagal">
                    {error}
                  </Alert>
                )}

                <Input
                  label="Alamat Email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  error={errors.email?.message}
                  disabled={isSubmitting}
                  {...register('email')}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  disabled={isSubmitting}
                  {...register('password')}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-offset-slate-950"
                      {...register('remember')}
                    />
                    <span>Ingat saya</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Masuk</span>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col justify-center text-center">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Demo Users: admin@priskila.com / staff@priskila.com (pwd: password)
              </span>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
