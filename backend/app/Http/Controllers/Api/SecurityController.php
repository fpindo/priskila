<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AuditLog;
use App\Models\LoginHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SecurityController extends Controller
{
    /**
     * Get active logged-in devices / sessions.
     */
    public function activeDevices(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()->id;

        $tokens = DB::table('personal_access_tokens')
            ->where('tokenable_id', $user->id)
            ->where('tokenable_type', get_class($user))
            ->orderBy('last_used_at', 'desc')
            ->get();

        $devices = $tokens->map(function ($token) use ($currentTokenId) {
            $userAgent = $token->user_agent ?? '';
            return [
                'id' => $token->id,
                'name' => $token->name,
                'ip_address' => $token->ip_address ?? '0.0.0.0',
                'user_agent' => $userAgent,
                'os' => $this->parseOS($userAgent),
                'browser' => $this->parseBrowser($userAgent),
                'last_active_at' => $token->last_active_at ?? $token->last_used_at ?? $token->created_at,
                'is_current' => $token->id === $currentTokenId,
            ];
        });

        return $this->successResponse($devices, 'Active devices retrieved successfully');
    }

    /**
     * Revoke / disconnect a specific device session.
     */
    public function revokeDevice(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $token = $user->tokens()->find($id);

        if (!$token) {
            return $this->errorResponse('Session / perangkat tidak ditemukan.', 404);
        }

        $token->delete();

        return $this->successResponse(null, 'Koneksi perangkat berhasil diputuskan.');
    }

    /**
     * Get paginated audit logs.
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::with('user');

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('auditable_type', 'like', "%{$search}%")
                  ->orWhere('event', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $logs = $query->latest()->paginate($request->get('limit', 15));

        return $this->successResponse($logs, 'Audit logs retrieved successfully');
    }

    /**
     * Get paginated general user activity logs.
     */
    public function activityLogs(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user');

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('activity', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $logs = $query->latest()->paginate($request->get('limit', 15));

        return $this->successResponse($logs, 'Activity logs retrieved successfully');
    }

    /**
     * Get paginated login history.
     */
    public function loginHistories(Request $request): JsonResponse
    {
        $query = LoginHistory::with('user');

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $logs = $query->latest()->paginate($request->get('limit', 15));

        return $this->successResponse($logs, 'Login histories retrieved successfully');
    }

    // Helper to parse OS from User Agent
    private function parseOS(string $userAgent): string
    {
        if (preg_match('/windows|win32/i', $userAgent)) return 'Windows';
        if (preg_match('/macintosh|mac os x/i', $userAgent)) return 'macOS';
        if (preg_match('/linux/i', $userAgent)) return 'Linux';
        if (preg_match('/android/i', $userAgent)) return 'Android';
        if (preg_match('/iphone|ipad/i', $userAgent)) return 'iOS';
        return 'Unknown OS';
    }

    // Helper to parse Browser from User Agent
    private function parseBrowser(string $userAgent): string
    {
        if (preg_match('/chrome/i', $userAgent) && !preg_match('/edge|edg/i', $userAgent)) return 'Chrome';
        if (preg_match('/firefox/i', $userAgent)) return 'Firefox';
        if (preg_match('/safari/i', $userAgent) && !preg_match('/chrome/i', $userAgent)) return 'Safari';
        if (preg_match('/edge|edg/i', $userAgent)) return 'Edge';
        if (preg_match('/opera|opr/i', $userAgent)) return 'Opera';
        return 'Browser';
    }
}
