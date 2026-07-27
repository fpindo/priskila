'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@priskila/api';
import {
  CheckCircle2,
  FileImage,
  Loader2,
  PackageCheck,
  PenLine,
  Truck,
  XCircle,
} from 'lucide-react';

type PublicOrder = {
  nomor_dokumen: string;
  tanggal_delivery: string;
  nama_penerima: string;
  alamat_tujuan: string;
  project?: { nama_project: string } | null;
  status: 'DRAFT' | 'IN_TRANSIT' | 'DELIVERED';
  delivered_at?: string;
  details: { barang?: { nama_barang: string; sku: string; satuan: string }; jumlah: number }[];
};

export default function DeliveryVerificationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState('');
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasSignature = useRef(false);
  useEffect(() => {
    params.then(({ token: value }) => setToken(value));
  }, [params]);
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/delivery-orders/verify/${token}`);
      if (!data.success) throw new Error(data.message);
      setOrder(data.data);
      setDone(data.data.status === 'DELIVERED');
    } catch (e) {
      setError((e as { message?: string }).message || 'Dokumen tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    load();
  }, [load]);
  const position = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width),
      y: (event.clientY - rect.top) * (event.currentTarget.height / rect.height),
    };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const point = position(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const point = position(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    hasSignature.current = true;
  };
  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature.current = false;
  };
  const confirm = async () => {
    if (!canvasRef.current || !hasSignature.current) {
      setError('Tanda tangan penerima wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('signature', canvasRef.current.toDataURL('image/png'));
      photos.forEach((photo) => data.append('photos[]', photo));
      const response = await apiClient.post(`/delivery-orders/verify/${token}/confirm`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!response.data.success) throw new Error(response.data.message);
      setDone(true);
    } catch (e) {
      setError((e as { message?: string }).message || 'Konfirmasi gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
      </main>
    );
  if (error && !order)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-xl font-bold">Verifikasi tidak tersedia</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </main>
    );
  if (!order) return null;
  if (done)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600" />
          <h1 className="text-2xl font-bold text-slate-900">Penerimaan Terkonfirmasi</h1>
          <p className="mt-2 text-slate-500">
            Surat Jalan <b>{order.nomor_dokumen}</b> telah dikonfirmasi diterima.
          </p>
        </div>
      </main>
    );
  if (order.status === 'DRAFT')
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <Truck className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h1 className="text-xl font-bold">Barang Belum Dikirim</h1>
          <p className="mt-2 text-sm text-slate-500">
            Dokumen ini belum berstatus dalam pengiriman.
          </p>
        </div>
      </main>
    );
  return (
    <main className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl px-4">
        <header className="mb-6 rounded-3xl bg-[#0f172a] p-6 text-white shadow-xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F97316]">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-400">
                PRISKILA DELIVERY
              </p>
              <h1 className="text-xl font-bold">Konfirmasi Penerimaan</h1>
            </div>
          </div>
          <p className="font-mono text-sm text-orange-300">{order.nomor_dokumen}</p>
        </header>
        {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <PackageCheck className="h-5 w-5 text-[#F97316]" />
            Ringkasan Pengiriman
          </h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-slate-400">PENERIMA</dt>
              <dd className="font-semibold">{order.nama_penerima}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-400">TANGGAL KIRIM</dt>
              <dd className="font-semibold">{order.tanggal_delivery}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-slate-400">ALAMAT</dt>
              <dd>{order.alamat_tujuan}</dd>
            </div>
          </dl>
          <div className="mt-5 border-t pt-4">
            <p className="mb-2 text-xs font-semibold text-slate-400">BARANG DITERIMA</p>
            {order.details.map((item, index) => (
              <div key={index} className="flex justify-between border-b py-2 text-sm">
                <span>{item.barang?.nama_barang}</span>
                <b>
                  {item.jumlah} {item.barang?.satuan}
                </b>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 font-bold">
            <PenLine className="h-5 w-5 text-[#F97316]" />
            Tanda Tangan Penerima
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Tanda tangan di area berikut sebagai bukti penerimaan.
          </p>
          <canvas
            ref={canvasRef}
            width={640}
            height={220}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={() => {
              drawing.current = false;
            }}
            onPointerLeave={() => {
              drawing.current = false;
            }}
            className="w-full touch-none rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50"
          />
          <button onClick={clear} className="mt-2 text-xs font-semibold text-[#F97316]">
            Hapus tanda tangan
          </button>
        </section>
        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 font-bold">
            <FileImage className="h-5 w-5 text-[#F97316]" />
            Photo Evidence
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Opsional. Maksimum 3 foto, masing-masing 5MB.
          </p>
          <input
            id="delivery-photos"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setPhotos(Array.from(event.target.files || []).slice(0, 3))}
            className="block w-full text-sm"
          />
          {photos.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">{photos.length} foto siap diunggah.</p>
          )}
        </section>
        <button
          id="confirm-delivery"
          disabled={saving}
          onClick={confirm}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-5 py-4 font-bold text-white shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          {saving ? 'Menyimpan...' : 'Konfirmasi Barang Diterima'}
        </button>
      </div>
    </main>
  );
}
