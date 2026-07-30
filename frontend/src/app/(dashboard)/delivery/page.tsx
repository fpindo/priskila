'use client';

import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ApiService } from '@priskila/api';
import { Alert, Badge, Button, Card, CardContent, Loading, Select2 } from '@priskila/ui';
import { DeliveryOrder } from '@priskila/types';
import { Eye, PackageCheck, Plus, RefreshCw, Search, Send, Truck, X, Loader2, Zap, Package } from 'lucide-react';

interface Barang {
  id: number;
  nama_barang: string;
  sku: string;
  satuan: string;
}
interface Project {
  id: number;
  nama_project: string;
}
interface PageData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}
type DetailInput = { barang_id: string; jumlah: number };
const newDetail = (): DetailInput => ({ barang_id: '', jumlah: 1 });
const statusConfig = {
  DRAFT: { label: 'Draft', variant: 'secondary' as const },
  IN_TRANSIT: { label: 'Dalam Pengiriman', variant: 'warning' as const },
  DELIVERED: { label: 'Terkirim', variant: 'success' as const },
};

export default function DeliveryPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [barang, setBarang] = useState<Barang[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nomor_dokumen: '',
    tanggal_delivery: '',
    project_id: '',
    nama_penerima: '',
    alamat_tujuan: '',
    catatan: '',
  });
  const [details, setDetails] = useState<DetailInput[]>([newDetail()]);
  const [selected, setSelected] = useState<DeliveryOrder | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shipping, setShipping] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'info' | 'items'>('info');

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await ApiService.get<{ code: string }>('/settings/generate-code/nomor_delivery');
      if (res.success && res.data) {
        setForm((f) => ({ ...f, nomor_dokumen: res.data.code }));
      }
    } catch {
      /* ignore */
    } finally {
      setGenerating(false);
    }
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.get<{ data: DeliveryOrder[] }>('/delivery-orders', {
        limit: 100,
        search,
      });
      if (res.success) setOrders(res.data.data);
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal memuat delivery order.');
    } finally {
      setLoading(false);
    }
  }, [search]);
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  useEffect(() => {
    Promise.all([
      ApiService.get<{ data: Barang[] }>('/barang', { limit: 100 }),
      ApiService.get<{ data: Project[] }>('/projects', { limit: 100 }),
    ])
      .then(([a, b]) => {
        if (a.success) setBarang(a.data.data);
        if (b.success) setProjects(b.data.data);
      })
      .catch(() => undefined);
  }, []);
  const openCreate = () => {
    setForm({
      nomor_dokumen: '',
      tanggal_delivery: new Date().toISOString().slice(0, 10),
      project_id: '',
      nama_penerima: '',
      alamat_tujuan: '',
      catatan: '',
    });
    setDetails([newDetail()]);
    setFormError(null);
    setActiveFormTab('info');
    setCreateOpen(true);
    generateCode();
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await ApiService.post('/delivery-orders', {
        ...form,
        project_id: form.project_id ? Number(form.project_id) : null,
        details: details.map((item) => ({
          barang_id: Number(item.barang_id),
          jumlah: Number(item.jumlah),
        })),
      });
      setCreateOpen(false);
      fetchOrders();
    } catch (e) {
      setFormError((e as { message?: string }).message || 'Gagal membuat Delivery Order.');
    } finally {
      setSaving(false);
    }
  };
  const view = async (id: number) => {
    try {
      const res = await ApiService.get<DeliveryOrder>(`/delivery-orders/${id}`);
      if (!res.success) return;
      setSelected(res.data);
      setQrDataUrl(
        await QRCode.toDataURL(
          `${window.location.origin}/delivery/verify/${res.data.verification_token}`,
          { width: 220, margin: 1 }
        )
      );
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal memuat detail dokumen.');
    }
  };
  const ship = async () => {
    if (!selected) return;
    setShipping(true);
    try {
      const res = await ApiService.post<DeliveryOrder>(`/delivery-orders/${selected.id}/ship`);
      if (res.success) {
        setSelected({ ...selected, status: 'IN_TRANSIT' });
        fetchOrders();
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Gagal mengirim delivery order.');
    } finally {
      setShipping(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-50">
            <Truck className="h-5 w-5 text-[#F97316]" />
            Delivery Order
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Kelola surat jalan dan bukti penerimaan barang.
          </p>
        </div>
        <Button id="create-delivery-order" variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Buat Delivery Order
        </Button>
      </div>
      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="delivery-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor dokumen atau penerima..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3">No. Surat Jalan</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Penerima</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center">
                      <Loading size="sm" />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      <PackageCheck className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                      Belum ada Delivery Order.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-orange-50 px-2 py-1 font-mono text-xs font-bold text-[#F97316]">
                          {order.nomor_dokumen}
                        </span>
                      </td>
                      <td className="px-4 py-3">{order.tanggal_delivery}</td>
                      <td className="px-4 py-3 font-semibold">{order.nama_penerima}</td>
                      <td className="px-4 py-3">{order.project?.nama_project || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={statusConfig[order.status].variant}>
                          {statusConfig[order.status].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => view(order.id)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
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
        </CardContent>
      </Card>
      {createOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 pt-8 flex items-center justify-center">
          <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5 shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Buat Delivery Order</h3>
              <button onClick={() => setCreateOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-1 pb-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setActiveFormTab('info')}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none -mb-px shrink-0 ${
                    activeFormTab === 'info'
                      ? 'border-[#F97316] text-[#F97316]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  Informasi Pengiriman
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('items')}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none -mb-px shrink-0 ${
                    activeFormTab === 'items'
                      ? 'border-[#F97316] text-[#F97316]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  Item Barang ({details.filter(d => d.barang_id).length})
                </button>
              </div>
            </div>

            <form onSubmit={save} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
              {formError && (
                <Alert variant="danger" title="Error">
                  {formError}
                </Alert>
              )}

              {/* TAB 1: Informasi Pengiriman */}
              {activeFormTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        No. Dokumen *
                      </label>
                      <div className="flex gap-2">
                        <input
                          required
                          value={form.nomor_dokumen}
                          onChange={(e) => setForm({ ...form, nomor_dokumen: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#F97316]/40 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={generating}
                          onClick={generateCode}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-950/10 flex items-center justify-center gap-1 disabled:opacity-50 text-xs font-semibold shrink-0"
                        >
                          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                          Auto
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Tanggal Kirim *
                      </label>
                      <input
                        required
                        type="date"
                        value={form.tanggal_delivery}
                        onChange={(e) => setForm({ ...form, tanggal_delivery: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-955 focus:ring-2 focus:ring-[#F97316]/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Project
                      </label>
                      <Select2
                        value={form.project_id}
                        onChange={(val) => setForm({ ...form, project_id: val })}
                        options={projects.map((project) => ({ value: project.id, label: project.nama_project }))}
                        placeholder="-- Tanpa Project --"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Nama Penerima *
                      </label>
                      <input
                        required
                        value={form.nama_penerima}
                        onChange={(e) => setForm({ ...form, nama_penerima: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#F97316]/40 focus:outline-none"
                        placeholder="Nama PIC Penerima di Lapangan"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Alamat Tujuan *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={form.alamat_tujuan}
                      onChange={(e) => setForm({ ...form, alamat_tujuan: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#F97316]/40 focus:outline-none"
                      placeholder="Alamat pengiriman barang..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Catatan
                    </label>
                    <textarea
                      rows={2}
                      value={form.catatan}
                      onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-955 focus:ring-2 focus:ring-[#F97316]/40 focus:outline-none"
                      placeholder="Catatan tambahan..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Item Barang */}
              {activeFormTab === 'items' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
                      Daftar Barang yang Dikirim
                    </h4>
                    <button
                      type="button"
                      onClick={() => setDetails([...details, newDetail()])}
                      className="text-xs font-bold text-[#F97316] hover:text-orange-600 transition-colors"
                    >
                      + Tambah Baris Barang
                    </button>
                  </div>

                  <div className="space-y-3">
                    {details.map((detail, index) => (
                      <div key={index} className="flex gap-3 items-start bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex-1 min-w-0">
                          <Select2
                            required
                            value={detail.barang_id}
                            onChange={(val) =>
                              setDetails(
                                details.map((row, i) =>
                                  i === index ? { ...row, barang_id: val } : row
                                )
                              )
                            }
                            options={barang.map((item) => ({ value: item.id, label: `${item.nama_barang} (${item.sku})` }))}
                            placeholder="-- Pilih Barang --"
                          />
                        </div>
                        <div className="w-28">
                          <input
                            required
                            type="number"
                            min="1"
                            value={detail.jumlah}
                            onChange={(e) =>
                              setDetails(
                                details.map((row, i) =>
                                  i === index ? { ...row, jumlah: Number(e.target.value) } : row
                                )
                              )
                            }
                            placeholder="Qty"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-950 focus:ring-2 focus:ring-[#F97316]/40 focus:outline-none"
                          />
                        </div>
                        {details.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDetails(details.filter((_, i) => i !== index))}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl shrink-0 transition-colors mt-0.5"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>

            {/* Action Bar */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 rounded-b-2xl">
              {activeFormTab === 'info' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Basic validation before shifting tabs
                      if (!form.nomor_dokumen || !form.tanggal_delivery || !form.nama_penerima || !form.alamat_tujuan) {
                        setFormError("Mohon lengkapi semua field bertanda bintang (*)");
                        return;
                      }
                      setFormError(null);
                      setActiveFormTab('items');
                    }}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#F97316] hover:bg-orange-600 text-white transition-colors"
                  >
                    Lanjut ke Barang
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setActiveFormTab('info');
                    }}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const incomplete = details.some(d => !d.barang_id || !d.jumlah);
                      if (incomplete) {
                        setFormError("Mohon lengkapi pilihan barang dan jumlahnya.");
                        return;
                      }
                      (document.getElementById('barang-form') as HTMLFormElement | null)?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      // Trigger normal submit trigger since the button is not type submit
                      save(new Event('submit') as any);
                    }}
                    disabled={saving}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#F97316] hover:bg-orange-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Simpan Delivery Order
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 pt-8">
          <div className="mx-auto mb-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h3 className="font-bold">Surat Jalan {selected.nomor_dokumen}</h3>
                <Badge variant={statusConfig[selected.status].variant}>
                  {statusConfig[selected.status].label}
                </Badge>
              </div>
              <button onClick={() => setSelected(null)} className="p-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_220px]">
              <div>
                <p className="text-xs font-semibold text-slate-400">PENERIMA</p>
                <p className="font-bold">{selected.nama_penerima}</p>
                <p className="mb-4 text-sm text-slate-500">{selected.alamat_tujuan}</p>
                <p className="text-xs font-semibold text-slate-400">BARANG DIKIRIM</p>
                {selected.details?.map((detail) => (
                  <div key={detail.id} className="flex justify-between border-b py-2 text-sm">
                    <span>{detail.barang?.nama_barang}</span>
                    <b>
                      {detail.jumlah} {detail.barang?.satuan}
                    </b>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <p className="mb-2 text-xs font-semibold text-slate-400">QR VERIFICATION</p>
                {qrDataUrl && (
                  <img className="mx-auto rounded-xl border" src={qrDataUrl} alt="QR verifikasi" />
                )}
                <p className="mt-2 text-[10px] text-slate-400">Scan untuk konfirmasi penerimaan</p>
              </div>
            </div>
            {selected.status === 'DRAFT' && (
              <div className="flex justify-end border-t p-5">
                <Button variant="primary" disabled={shipping} onClick={ship}>
                  <Send className="h-4 w-4" />
                  {shipping ? 'Memproses...' : 'Kirim Barang'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
