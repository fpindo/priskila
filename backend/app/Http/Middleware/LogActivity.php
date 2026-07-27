<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class LogActivity
{
    /**
     * Handle an incoming request and log mutating actions.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log mutating actions (POST, PUT, PATCH, DELETE) by authenticated users
        $method = $request->method();
        if (Auth::check() && in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            // Build user-friendly activity description
            $path = $request->path();
            $activity = $this->buildActivityDescription($method, $path, $request);

            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => $activity,
                'url' => $request->fullUrl(),
                'method' => $method,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return $response;
    }

    private function buildActivityDescription(string $method, string $path, Request $request): string
    {
        // Simple human-readable parser
        if (str_contains($path, 'auth/logout')) return 'Melakukan logout dari sistem';
        if (str_contains($path, 'auth/login')) return 'Melakukan login ke sistem';
        if (str_contains($path, 'auth/2fa/confirm')) return 'Mengonfirmasi dan mengaktifkan 2FA';
        if (str_contains($path, 'auth/2fa/disable')) return 'Menonaktifkan 2FA';

        $action = match ($method) {
            'POST' => 'Menambahkan',
            'PUT', 'PATCH' => 'Mengubah',
            'DELETE' => 'Menghapus',
            default => 'Mengakses',
        };

        $entity = 'data';
        if (str_contains($path, 'projects')) $entity = 'master project';
        elseif (str_contains($path, 'barang-masuk')) $entity = 'transaksi barang masuk';
        elseif (str_contains($path, 'pemakaian-barang')) {
            if (str_contains($path, 'approve')) return 'Menyetujui permintaan pemakaian barang';
            if (str_contains($path, 'reject')) return 'Menolak permintaan pemakaian barang';
            $entity = 'permintaan pemakaian barang';
        }
        elseif (str_contains($path, 'barang')) $entity = 'master barang';
        elseif (str_contains($path, 'suppliers')) $entity = 'master supplier';
        elseif (str_contains($path, 'settings')) $entity = 'pengaturan format kode';

        return "{$action} {$entity}";
    }
}
