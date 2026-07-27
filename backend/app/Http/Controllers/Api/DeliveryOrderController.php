<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryOrder;
use App\Models\DeliveryOrderDetail;
use App\Models\DeliveryPhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DeliveryOrderController extends Controller
{
    /**
     * List paginated delivery orders.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DeliveryOrder::with(['project', 'creator']);

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nomor_dokumen', 'like', "%{$search}%")
                  ->orWhere('nama_penerima', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $orders = $query->latest()->paginate($request->get('limit', 10));

        return $this->successResponse($orders, 'Delivery orders retrieved successfully');
    }

    /**
     * Store a new delivery order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nomor_dokumen' => 'required|string|unique:delivery_orders,nomor_dokumen',
            'tanggal_delivery' => 'required|date',
            'pemakaian_barang_id' => 'nullable|exists:pemakaian_barang,id',
            'project_id' => 'nullable|exists:projects,id',
            'nama_penerima' => 'required|string|max:255',
            'alamat_tujuan' => 'required|string',
            'catatan' => 'nullable|string',
            'details' => 'required|array|min:1',
            'details.*.barang_id' => 'required|exists:barang,id',
            'details.*.jumlah' => 'required|integer|min:1',
            'details.*.catatan' => 'nullable|string',
        ]);

        $order = DB::transaction(function () use ($validated) {
            $order = DeliveryOrder::create([
                'nomor_dokumen' => $validated['nomor_dokumen'],
                'tanggal_delivery' => $validated['tanggal_delivery'],
                'pemakaian_barang_id' => $validated['pemakaian_barang_id'] ?? null,
                'project_id' => $validated['project_id'] ?? null,
                'nama_penerima' => $validated['nama_penerima'],
                'alamat_tujuan' => $validated['alamat_tujuan'],
                'catatan' => $validated['catatan'] ?? null,
                'verification_token' => Str::uuid()->toString(),
                'status' => 'DRAFT',
                'created_by' => Auth::id(),
            ]);

            foreach ($validated['details'] as $det) {
                DeliveryOrderDetail::create([
                    'delivery_order_id' => $order->id,
                    'barang_id' => $det['barang_id'],
                    'jumlah' => $det['jumlah'],
                    'catatan' => $det['catatan'] ?? null,
                ]);
            }

            return $order;
        });

        return $this->successResponse(
            $order->load(['details.barang', 'project']),
            'Delivery order berhasil dibuat.',
            201
        );
    }

    /**
     * Show delivery order detail.
     */
    public function show(string $id): JsonResponse
    {
        $order = DeliveryOrder::with(['details.barang', 'photos', 'project', 'pemakaianBarang', 'creator'])->find($id);

        if (!$order) {
            return $this->errorResponse('Delivery order tidak ditemukan.', 404);
        }

        return $this->successResponse($order, 'Delivery order retrieved successfully');
    }

    /**
     * Mark delivery order as IN_TRANSIT (shipped).
     */
    public function ship(string $id): JsonResponse
    {
        $order = DeliveryOrder::find($id);

        if (!$order) {
            return $this->errorResponse('Delivery order tidak ditemukan.', 404);
        }

        if ($order->status !== 'DRAFT') {
            return $this->errorResponse('Hanya delivery order berstatus DRAFT yang dapat dikirim.', 400);
        }

        $order->update(['status' => 'IN_TRANSIT']);

        return $this->successResponse($order, 'Delivery order berhasil dikirim. Status: IN_TRANSIT.');
    }

    /**
     * Public: Get delivery order info by verification token for QR scan.
     */
    public function verify(string $token): JsonResponse
    {
        $order = DeliveryOrder::with(['details.barang', 'project'])
            ->where('verification_token', $token)
            ->first();

        if (!$order) {
            return $this->errorResponse('Delivery order tidak ditemukan atau token tidak valid.', 404);
        }

        // Return limited info for public verification page
        return $this->successResponse([
            'id' => $order->id,
            'nomor_dokumen' => $order->nomor_dokumen,
            'tanggal_delivery' => $order->tanggal_delivery?->toDateString(),
            'nama_penerima' => $order->nama_penerima,
            'alamat_tujuan' => $order->alamat_tujuan,
            'project' => $order->project ? ['nama_project' => $order->project->nama_project] : null,
            'status' => $order->status,
            'delivered_at' => $order->delivered_at?->toDateTimeString(),
            'details' => $order->details->map(fn ($d) => [
                'barang' => $d->barang ? ['nama_barang' => $d->barang->nama_barang, 'sku' => $d->barang->sku, 'satuan' => $d->barang->satuan] : null,
                'jumlah' => $d->jumlah,
            ]),
        ], 'Delivery order verification data retrieved.');
    }

    /**
     * Public: Confirm delivery with signature and photos.
     */
    public function confirm(Request $request, string $token): JsonResponse
    {
        $order = DeliveryOrder::where('verification_token', $token)->first();

        if (!$order) {
            return $this->errorResponse('Delivery order tidak ditemukan atau token tidak valid.', 404);
        }

        if ($order->status === 'DELIVERED') {
            return $this->errorResponse('Delivery order sudah dikonfirmasi sebelumnya.', 400);
        }

        if ($order->status === 'DRAFT') {
            return $this->errorResponse('Delivery order belum dikirim (masih DRAFT).', 400);
        }

        $request->validate([
            'signature' => 'required|string', // base64 PNG data
            'photos' => 'nullable|array|max:3',
            'photos.*' => 'file|image|max:5120', // max 5MB per photo
        ]);

        DB::transaction(function () use ($request, $order) {
            // Save signature (base64 PNG → file)
            $signatureData = $request->input('signature');
            if (!preg_match('/^data:image\/png;base64,/', $signatureData)) {
                throw new \InvalidArgumentException('Format tanda tangan tidak valid.');
            }

            $base64 = substr($signatureData, strpos($signatureData, ',') + 1);
            $decoded = base64_decode($base64, true);
            if ($decoded === false) {
                throw new \InvalidArgumentException('Data tanda tangan tidak valid.');
            }

            $filename = 'signatures/do_' . $order->id . '_' . time() . '.png';
            $fullPath = storage_path('app/public/' . $filename);

            // Ensure directory exists
            $dir = dirname($fullPath);
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            file_put_contents($fullPath, $decoded);
            $order->signature_path = asset('storage/' . $filename);

            // Save photos
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photo) {
                    $photoPath = $photo->store('delivery_photos', 'public');
                    DeliveryPhoto::create([
                        'delivery_order_id' => $order->id,
                        'photo_path' => asset('storage/' . $photoPath),
                        'uploaded_at' => now(),
                    ]);
                }
            }

            $order->status = 'DELIVERED';
            $order->delivered_at = now();
            $order->save();
        });

        return $this->successResponse(null, 'Delivery order berhasil dikonfirmasi. Terima kasih!');
    }
}
