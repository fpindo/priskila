'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ApiService } from '@priskila/api';
import { Card, CardContent, Alert, Button } from '@priskila/ui';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface Warehouse { id: number; kode_gudang: string; nama_gudang: string; }
interface Zone { id: number; warehouse_id: number; code: string; name: string; }
interface Rack { id: number; zone_id: number; code: string; name: string; }
interface Shelf { id: number; rack_id: number; code: string; name: string; }
interface Bin { id: number; shelf_id: number; code: string; name: string; }

type LocationLevel = 'zone' | 'rack' | 'shelf' | 'bin';

const levelLabel: Record<LocationLevel, string> = { zone: 'Zone', rack: 'Rack', shelf: 'Shelf', bin: 'Bin' };

export default function LocationsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded state
  const [expW, setExpW] = useState<Record<number, boolean>>({});
  const [expZ, setExpZ] = useState<Record<number, boolean>>({});
  const [expR, setExpR] = useState<Record<number, boolean>>({});
  const [expS, setExpS] = useState<Record<number, boolean>>({});

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState<LocationLevel>('zone');
  const [editId, setEditId] = useState<number | null>(null);
  const [editParentId, setEditParentId] = useState<number>(0);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ level: LocationLevel; id: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiService.get<Warehouse[]>('/locations/warehouses');
      if (res.success) setWarehouses(res.data);
    } catch (e) {
      setError((e as any).message || 'Gagal memuat gudang.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  const fetchZones = async (wid: number) => {
    try {
      const res = await ApiService.get<Zone[]>(`/locations/${wid}/zones`);
      if (res.success) setZones(prev => [...prev.filter(z => z.warehouse_id !== wid), ...res.data]);
    } catch {}
  };
  const fetchRacks = async (zid: number) => {
    try {
      const res = await ApiService.get<Rack[]>(`/locations/${zid}/racks`);
      if (res.success) setRacks(prev => [...prev.filter(r => r.zone_id !== zid), ...res.data]);
    } catch {}
  };
  const fetchShelves = async (rid: number) => {
    try {
      const res = await ApiService.get<Shelf[]>(`/locations/${rid}/shelves`);
      if (res.success) setShelves(prev => [...prev.filter(s => s.rack_id !== rid), ...res.data]);
    } catch {}
  };
  const fetchBins = async (sid: number) => {
    try {
      const res = await ApiService.get<Bin[]>(`/locations/${sid}/bins`);
      if (res.success) setBins(prev => [...prev.filter(b => b.shelf_id !== sid), ...res.data]);
    } catch {}
  };

  const toggle = (setter: React.Dispatch<React.SetStateAction<Record<number, boolean>>>, id: number, fetchFn?: () => void) => {
    setter(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id] && fetchFn) fetchFn();
      return next;
    });
  };

  const openCreate = (level: LocationLevel, parentId: number) => {
    setEditLevel(level);
    setEditId(null);
    setEditParentId(parentId);
    setFormCode('');
    setFormName('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (level: LocationLevel, item: { id: number; code: string; name: string }, parentId: number) => {
    setEditLevel(level);
    setEditId(item.id);
    setEditParentId(parentId);
    setFormCode(item.code);
    setFormName(item.name);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const parentKey = { zone: 'warehouse_id', rack: 'zone_id', shelf: 'rack_id', bin: 'shelf_id' }[editLevel];
    const endpoint = `/${editLevel}s`;

    try {
      if (editId) {
        await ApiService.put(`${endpoint}/${editId}`, { code: formCode, name: formName });
      } else {
        await ApiService.post(endpoint, { [parentKey]: editParentId, code: formCode, name: formName });
      }
      setModalOpen(false);
      // Refresh parent
      if (editLevel === 'zone') fetchZones(editParentId);
      else if (editLevel === 'rack') fetchRacks(editParentId);
      else if (editLevel === 'shelf') fetchShelves(editParentId);
      else if (editLevel === 'bin') fetchBins(editParentId);
    } catch (e) {
      setFormError((e as any).message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ApiService.delete(`/${deleteTarget.level}s/${deleteTarget.id}`);
      // Remove from local state
      if (deleteTarget.level === 'zone') setZones(prev => prev.filter(z => z.id !== deleteTarget.id));
      else if (deleteTarget.level === 'rack') setRacks(prev => prev.filter(r => r.id !== deleteTarget.id));
      else if (deleteTarget.level === 'shelf') setShelves(prev => prev.filter(s => s.id !== deleteTarget.id));
      else if (deleteTarget.level === 'bin') setBins(prev => prev.filter(b => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setError((e as any).message || 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  const iconColor: Record<LocationLevel, string> = {
    zone: 'text-sky-500',
    rack: 'text-green-500',
    shelf: 'text-purple-500',
    bin: 'text-teal-500',
  };

  const ActionBtns = ({ level, item, parentId }: { level: LocationLevel; item: any; parentId: number }) => (
    <div className="flex items-center gap-1">
      <button onClick={() => openEdit(level, item, parentId)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
        <Pencil className="h-3 w-3" />
      </button>
      <button onClick={() => setDeleteTarget({ level, id: item.id })} className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );

  const childLevels: Record<LocationLevel, LocationLevel | null> = { zone: 'rack', rack: 'shelf', shelf: 'bin', bin: null };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#F97316]" /> Manajemen Lokasi Inventori
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola hierarki lokasi gudang: Warehouse → Zone → Rack → Shelf → Bin
          </p>
        </div>
      </div>

      {error && <Alert variant="danger" title="Error">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
        </div>
      ) : warehouses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-sm mb-4">Belum ada gudang. Tambahkan gudang terlebih dahulu.</p>
            <Link href="/warehouses">
              <Button variant="primary"><Plus className="h-4 w-4 mr-2" /> Tambah Gudang</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {warehouses.map(w => (
            <div key={w.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {/* Warehouse */}
              <div className="flex items-center p-4 gap-2">
                <button onClick={() => toggle(setExpW, w.id, () => fetchZones(w.id))} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                  {expW[w.id] ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                </button>
                <WarehouseIcon className="h-5 w-5 text-[#F97316]" />
                <span className="font-bold text-slate-800 dark:text-slate-200">{w.nama_gudang}</span>
                <span className="text-xs text-slate-400 ml-1">({w.kode_gudang})</span>
                <div className="ml-auto">
                  <Button onClick={() => openCreate('zone', w.id)} size="sm" variant="secondary">
                    <Plus className="h-3.5 w-3.5" /> <span className="ml-1 text-xs">Zone</span>
                  </Button>
                </div>
              </div>

              {/* Zones */}
              {expW[w.id] && (
                <div className="ml-6 mr-3 mb-3 space-y-2">
                  {zones.filter(z => z.warehouse_id === w.id).length === 0 ? (
                    <p className="text-xs text-slate-400 pl-6 py-2">Belum ada zone.</p>
                  ) : zones.filter(z => z.warehouse_id === w.id).map(zone => (
                    <div key={zone.id} className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="flex items-center p-3 gap-2">
                        <button onClick={() => toggle(setExpZ, zone.id, () => fetchRacks(zone.id))} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                          {expZ[zone.id] ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
                        </button>
                        <MapPin className={`h-4 w-4 ${iconColor.zone}`} />
                        <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Zone {zone.name}</span>
                        <span className="text-xs text-slate-400">({zone.code})</span>
                        <div className="ml-auto flex items-center gap-1">
                          <ActionBtns level="zone" item={zone} parentId={w.id} />
                          <Button onClick={() => openCreate('rack', zone.id)} size="xs" variant="secondary">
                            <Plus className="h-3 w-3" /> <span className="ml-0.5 text-[10px]">Rack</span>
                          </Button>
                        </div>
                      </div>

                      {/* Racks */}
                      {expZ[zone.id] && (
                        <div className="ml-5 mr-2 mb-2 space-y-1.5">
                          {racks.filter(r => r.zone_id === zone.id).length === 0 ? (
                            <p className="text-xs text-slate-400 pl-6 py-1">Belum ada rack.</p>
                          ) : racks.filter(r => r.zone_id === zone.id).map(rack => (
                            <div key={rack.id} className="rounded-md border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                              <div className="flex items-center p-2 gap-2">
                                <button onClick={() => toggle(setExpR, rack.id, () => fetchShelves(rack.id))} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                  {expR[rack.id] ? <ChevronDown className="h-3 w-3 text-slate-500" /> : <ChevronRight className="h-3 w-3 text-slate-500" />}
                                </button>
                                <MapPin className={`h-3.5 w-3.5 ${iconColor.rack}`} />
                                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Rack {rack.name}</span>
                                <span className="text-xs text-slate-400">({rack.code})</span>
                                <div className="ml-auto flex items-center gap-1">
                                  <ActionBtns level="rack" item={rack} parentId={zone.id} />
                                  <Button onClick={() => openCreate('shelf', rack.id)} size="xs" variant="secondary">
                                    <Plus className="h-3 w-3" /> <span className="ml-0.5 text-[10px]">Shelf</span>
                                  </Button>
                                </div>
                              </div>

                              {/* Shelves */}
                              {expR[rack.id] && (
                                <div className="ml-4 mr-2 mb-2 space-y-1">
                                  {shelves.filter(s => s.rack_id === rack.id).length === 0 ? (
                                    <p className="text-xs text-slate-400 pl-6 py-1">Belum ada shelf.</p>
                                  ) : shelves.filter(s => s.rack_id === rack.id).map(shelf => (
                                    <div key={shelf.id} className="rounded border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                      <div className="flex items-center p-2 gap-2">
                                        <button onClick={() => toggle(setExpS, shelf.id, () => fetchBins(shelf.id))} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                          {expS[shelf.id] ? <ChevronDown className="h-3 w-3 text-slate-500" /> : <ChevronRight className="h-3 w-3 text-slate-500" />}
                                        </button>
                                        <MapPin className={`h-3.5 w-3.5 ${iconColor.shelf}`} />
                                        <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Shelf {shelf.name}</span>
                                        <span className="text-xs text-slate-400">({shelf.code})</span>
                                        <div className="ml-auto flex items-center gap-1">
                                          <ActionBtns level="shelf" item={shelf} parentId={rack.id} />
                                          <Button onClick={() => openCreate('bin', shelf.id)} size="xs" variant="secondary">
                                            <Plus className="h-3 w-3" /> <span className="ml-0.5 text-[10px]">Bin</span>
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Bins */}
                                      {expS[shelf.id] && (
                                        <div className="ml-3 mr-2 mb-2 space-y-0.5">
                                          {bins.filter(b => b.shelf_id === shelf.id).length === 0 ? (
                                            <p className="text-xs text-slate-400 pl-6 py-1">Belum ada bin.</p>
                                          ) : bins.filter(b => b.shelf_id === shelf.id).map(bin => (
                                            <div key={bin.id} className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                              <div className="flex items-center gap-2">
                                                <MapPin className={`h-3 w-3 ${iconColor.bin}`} />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">Bin {bin.name}</span>
                                                <span className="text-xs text-slate-400">({bin.code})</span>
                                              </div>
                                              <ActionBtns level="bin" item={bin} parentId={shelf.id} />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-50">
                {editId ? `Edit ${levelLabel[editLevel]}` : `Tambah ${levelLabel[editLevel]} Baru`}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && <Alert variant="danger" title="Error">{formError}</Alert>}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kode *</label>
                <input required value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                  placeholder="Kode unik" maxLength={10} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama *</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316]"
                  placeholder={`Nama ${levelLabel[editLevel]}`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[#F97316] hover:bg-orange-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <Trash2 className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Hapus {levelLabel[deleteTarget.level]}?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Semua data anak di bawahnya juga akan terhapus.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1">Batal</Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting} className="flex-1">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
