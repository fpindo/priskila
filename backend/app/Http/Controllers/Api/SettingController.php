<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\BarangMasuk;
use App\Models\Warehouse;
use App\Models\DeliveryOrder;
use App\Models\PemakaianBarang;
use App\Models\Project;
use App\Models\Setting;
use App\Models\Supplier;
use App\Models\GudangTransfer;
use App\Models\StockOpname;
use App\Models\StockAdjustment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Return all code format settings.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::orderBy('id')->get();
        return $this->successResponse($settings, 'Settings retrieved successfully');
    }

    /**
     * Bulk-update all settings at once.
     * Payload: array of { key, value }
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings'              => 'required|array',
            'settings.*.key'        => 'required|string',
            'settings.*.label'      => 'sometimes|string',
            'settings.*.description'=> 'sometimes|nullable|string',
            'settings.*.value'      => 'required|array',
            'settings.*.value.prefix'    => 'required_unless:settings.*.key,format_tanggal,nama_perusahaan,logo_perusahaan,min_stock_global,location_max_depth|string',
            'settings.*.value.separator' => 'required_unless:settings.*.key,format_tanggal,nama_perusahaan,logo_perusahaan,min_stock_global,location_max_depth|string',
            'settings.*.value.padding'   => 'required_unless:settings.*.key,format_tanggal,nama_perusahaan,logo_perusahaan,min_stock_global,location_max_depth|integer|min:1|max:6',
            'settings.*.value.use_year'  => 'required_unless:settings.*.key,format_tanggal,nama_perusahaan,logo_perusahaan,min_stock_global,location_max_depth|boolean',
            'settings.*.value.use_month' => 'required_unless:settings.*.key,format_tanggal,nama_perusahaan,logo_perusahaan,min_stock_global,location_max_depth|boolean',
            'settings.*.value.format'    => 'required_if:settings.*.key,format_tanggal|string',
            'settings.*.value.name'      => 'required_if:settings.*.key,nama_perusahaan|string',
            'settings.*.value.type'      => 'required_if:settings.*.key,logo_perusahaan|string|in:icon,image',
            'settings.*.value.icon_name' => 'nullable|string',
            'settings.*.value.image_url' => 'nullable|string',
            'settings.*.value.min_stock' => 'required_if:settings.*.key,min_stock_global|integer|min:0',
            'settings.*.value.depth'    => 'required_if:settings.*.key,location_max_depth|integer|min:1|max:5',
        ]);

        foreach ($data['settings'] as $item) {
            Setting::updateOrCreate(
                ['key' => $item['key']],
                [
                    'label'       => $item['label'] ?? $item['key'],
                    'description' => $item['description'] ?? null,
                    'value'       => $item['value'],
                ]
            );
        }

        $settings = Setting::orderBy('id')->get();
        return $this->successResponse($settings, 'Settings updated successfully');
    }

    /**
     * Generate the next code for a given type.
     * GET /settings/generate-code/{type}
     *
     * Supported types: sku, kode_project, kode_supplier,
     *                  nomor_barang_masuk, nomor_pemakaian
     */
    public function generateCode(string $type): JsonResponse
    {
        $config = Setting::getConfig($type);

        if (!$config) {
            return $this->errorResponse("Setting untuk tipe '{$type}' tidak ditemukan.", 404);
        }

        $prefix    = $config['prefix']    ?? 'CODE';
        $separator = $config['separator'] ?? '-';
        $padding   = (int) ($config['padding']   ?? 3);
        $useYear   = (bool) ($config['use_year']  ?? false);
        $useMonth  = (bool) ($config['use_month'] ?? false);

        // Build the date part
        $datePart = '';
        if ($useYear && $useMonth) {
            $datePart = date('Ym');   // e.g. 202607
        } elseif ($useYear) {
            $datePart = date('Y');    // e.g. 2026
        }

        // Build the LIKE pattern to find the highest existing number
        $likePattern = $prefix . $separator;
        if ($datePart) {
            $likePattern .= $datePart . $separator;
        }
        $likePattern .= '%';

        // Query the correct table/column for this type
        $lastCode = $this->getLastCode($type, $likePattern);

        // Extract the trailing numeric part
        $lastNumber = 0;
        if ($lastCode) {
            $parts = explode($separator, $lastCode);
            $lastNumber = (int) end($parts);
        }

        $nextNumber = $lastNumber + 1;
        $nextPart   = str_pad($nextNumber, $padding, '0', STR_PAD_LEFT);

        // Assemble the final code
        $parts = [$prefix];
        if ($datePart) {
            $parts[] = $datePart;
        }
        $parts[] = $nextPart;

        $generatedCode = implode($separator, $parts);

        return $this->successResponse([
            'code'   => $generatedCode,
            'type'   => $type,
            'config' => $config,
        ], 'Code generated successfully');
    }

    /**
     * Retrieve the last (highest) code from the relevant table.
     */
    private function getLastCode(string $type, string $likePattern): ?string
    {
        return match ($type) {
            'sku'               => Barang::where('sku', 'like', $likePattern)
                                      ->orderByRaw('CAST(SUBSTRING_INDEX(sku, "-", -1) AS UNSIGNED) DESC')
                                      ->value('sku'),

            'kode_project'      => Project::where('kode_project', 'like', $likePattern)
                                      ->orderByRaw('CAST(SUBSTRING_INDEX(kode_project, "-", -1) AS UNSIGNED) DESC')
                                      ->value('kode_project'),

            'kode_supplier'     => Supplier::where('kode_supplier', 'like', $likePattern)
                                      ->orderByRaw('CAST(SUBSTRING_INDEX(kode_supplier, "-", -1) AS UNSIGNED) DESC')
                                      ->value('kode_supplier'),

            'nomor_barang_masuk' => BarangMasuk::where('nomor_dokumen', 'like', $likePattern)
                                      ->orderByRaw('CAST(SUBSTRING_INDEX(nomor_dokumen, "-", -1) AS UNSIGNED) DESC')
                                      ->value('nomor_dokumen'),

            'nomor_pemakaian'   => PemakaianBarang::where('nomor_dokumen', 'like', $likePattern)
                                      ->orderByRaw('CAST(SUBSTRING_INDEX(nomor_dokumen, "-", -1) AS UNSIGNED) DESC')
                                      ->value('nomor_dokumen'),

            'nomor_delivery'    => DeliveryOrder::where('nomor_dokumen', 'like', $likePattern)
                                      ->orderByRaw('CAST(SUBSTRING_INDEX(nomor_dokumen, "-", -1) AS UNSIGNED) DESC')
                                      ->value('nomor_dokumen'),

            'kode_gudang'       => Warehouse::where('kode_gudang', 'like', $likePattern)
                                      ->orderByRaw('CAST(SUBSTRING_INDEX(kode_gudang, "-", -1) AS UNSIGNED) DESC')
                                      ->value('kode_gudang'),

            'nomor_transfer'    => GudangTransfer::where('nomor_dokumen', 'like', $likePattern)
                                      ->orderByRaw('CAST(SUBSTRING_INDEX(nomor_dokumen, "-", -1) AS UNSIGNED) DESC')
                                      ->value('nomor_dokumen'),

            'nomor_opname'      => StockOpname::where('nomor_dokumen', 'like', $likePattern)
                                      ->orderByRaw('CAST(SUBSTRING_INDEX(nomor_dokumen, "-", -1) AS UNSIGNED) DESC')
                                      ->value('nomor_dokumen'),

            'nomor_adjustment'  => StockAdjustment::where('nomor_dokumen', 'like', $likePattern)
                                      ->orderByRaw('CAST(SUBSTRING_INDEX(nomor_dokumen, "-", -1) AS UNSIGNED) DESC')
                                      ->value('nomor_dokumen'),

            default             => null,
        };
    }
}
