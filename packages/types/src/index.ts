export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    data: T[];
    meta: PaginationMeta;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: number;
  kode_project: string;
  nama_project: string;
  deskripsi?: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  created_at?: string;
  updated_at?: string;
}

export interface Barang {
  id: number;
  sku: string;
  barcode?: string;
  nama_barang: string;
  deskripsi?: string;
  kategori: string;
  satuan: string;
  min_stock: number;
  effective_min_stock?: number;
  image_url?: string;
  current_stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: number;
  kode_supplier: string;
  nama_supplier: string;
  kontak_person?: string;
  telepon: string;
  email?: string;
  alamat: string;
  created_at?: string;
  updated_at?: string;
}

export interface BarangMasukDetail {
  id: number;
  barang_masuk_id: number;
  barang_id: number;
  barang?: Barang;
  jumlah: number;
  harga_satuan?: number;
  catatan?: string;
}

export interface BarangMasuk {
  id: number;
  nomor_dokumen: string;
  tanggal_masuk: string;
  supplier_id: number;
  supplier?: Supplier;
  project_id?: number;
  project?: Project;
  catatan?: string;
  attachment_path?: string;
  created_by: number;
  creator?: User;
  details?: BarangMasukDetail[];
  created_at?: string;
  updated_at?: string;
}

export interface PemakaianBarangDetail {
  id: number;
  pemakaian_barang_id: number;
  barang_id: number;
  barang?: Barang;
  jumlah: number;
  catatan?: string;
}

export interface PemakaianBarang {
  id: number;
  nomor_dokumen: string;
  tanggal_pemakaian: string;
  project_id: number;
  project?: Project;
  keterangan?: string;
  status_approval: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: number;
  approver?: User;
  created_by: number;
  creator?: User;
  details?: PemakaianBarangDetail[];
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryOrderDetail {
  id: number;
  delivery_order_id: number;
  barang_id: number;
  barang?: Barang;
  jumlah: number;
  catatan?: string;
}

export interface DeliveryPhoto {
  id: number;
  delivery_order_id: number;
  photo_path: string;
  uploaded_at: string;
}

export interface DeliveryOrder {
  id: number;
  nomor_dokumen: string;
  tanggal_delivery: string;
  pemakaian_barang_id?: number;
  pemakaian_barang?: PemakaianBarang;
  project_id?: number;
  project?: Project;
  nama_penerima: string;
  alamat_tujuan: string;
  catatan?: string;
  verification_token: string;
  status: 'DRAFT' | 'IN_TRANSIT' | 'DELIVERED';
  signature_path?: string;
  delivered_at?: string;
  created_by: number;
  creator?: User;
  details?: DeliveryOrderDetail[];
  photos?: DeliveryPhoto[];
  created_at?: string;
  updated_at?: string;
}
