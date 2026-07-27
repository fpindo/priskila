<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Google2FAService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TwoFactorAuthController extends Controller
{
    /**
     * Generate 2FA secret key and return QR code URL.
     */
    public function enable(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->two_factor_confirmed_at) {
            return $this->errorResponse('Two-Factor Authentication sudah aktif.', 400);
        }

        // Generate key if not exists
        $secret = $user->two_factor_secret;
        if (!$secret) {
            $secret = Google2FAService::generateSecretKey();
            $user->update(['two_factor_secret' => $secret]);
        }

        // Get QR Code URL
        $qrUrl = Google2FAService::getQRCodeUrl('PRISKILA', $user->email, $secret);

        return $this->successResponse([
            'secret' => $secret,
            'qr_url' => $qrUrl,
        ], '2FA key generated. Please scan the QR code to confirm.');
    }

    /**
     * Confirm 2FA code to finalize enrollment.
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();
        $secret = $user->two_factor_secret;

        if (!$secret) {
            return $this->errorResponse('2FA belum di-setup. Harap aktifkan terlebih dahulu.', 400);
        }

        if (Google2FAService::verifyKey($secret, $request->code)) {
            $user->update([
                'two_factor_confirmed_at' => now(),
                'two_factor_recovery_codes' => json_encode($this->generateRecoveryCodes()),
            ]);

            return $this->successResponse([
                'recovery_codes' => json_decode($user->two_factor_recovery_codes),
            ], 'Two-Factor Authentication berhasil diaktifkan.');
        }

        return $this->errorResponse('Kode TOTP tidak valid. Harap periksa jam perangkat Anda.', 422, [
            'code' => ['Kode verifikasi salah atau kedaluwarsa.']
        ]);
    }

    /**
     * Disable 2FA.
     */
    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Password konfirmasi salah.', 422, [
                'password' => ['Konfirmasi kata sandi tidak cocok.']
            ]);
        }

        $user->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);

        return $this->successResponse(null, 'Two-Factor Authentication berhasil dinonaktifkan.');
    }

    /**
     * Verify 2FA challenge code during login.
     * This is a public/unauthenticated endpoint but requires a temporary state (like user id).
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|integer',
            'code'    => 'required|string|size:6',
            'device_name' => 'sometimes|string',
        ]);

        $user = User::find($request->user_id);
        if (!$user || !$user->two_factor_confirmed_at) {
            return $this->errorResponse('Proses verifikasi tidak valid.', 400);
        }

        $secret = $user->two_factor_secret;

        if (Google2FAService::verifyKey($secret, $request->code)) {
            // Success! Issue the Sanctum token
            $deviceName = $request->input('device_name', $request->userAgent() ?: 'Unknown Device');
            $tokenResult = $user->createToken('auth_token');
            $token = $tokenResult->plainTextToken;

            // Save IP, User Agent, Last Active to personal_access_tokens
            DB::table('personal_access_tokens')
                ->where('id', $tokenResult->accessToken->id)
                ->update([
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'last_active_at' => now(),
                ]);

            return $this->successResponse([
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ]
            ], 'Login successful with 2FA');
        }

        return $this->errorResponse('Kode TOTP salah.', 422, [
            'code' => ['Kode verifikasi 2FA salah atau kedaluwarsa.']
        ]);
    }

    /**
     * Generate backup recovery codes.
     */
    private function generateRecoveryCodes(): array
    {
        $codes = [];
        for ($i = 0; $i < 8; $i++) {
            $codes[] = bin2hex(random_bytes(5)) . '-' . bin2hex(random_bytes(5));
        }
        return $codes;
    }
}
