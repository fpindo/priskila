<?php

namespace App\Services;

class Google2FAService
{
    /**
     * Generate a random Base32 secret key.
     */
    public static function generateSecretKey(int $length = 16): string
    {
        $b32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= $b32chars[random_int(0, 31)];
        }
        return $secret;
    }

    /**
     * Get the QR Code URL for Google Authenticator.
     */
    public static function getQRCodeUrl(string $company, string $holder, string $secret): string
    {
        return 'otpauth://totp/' . rawurlencode($company) . ':' . rawurlencode($holder) 
            . '?secret=' . $secret . '&issuer=' . rawurlencode($company);
    }

    /**
     * Verify a 6-digit TOTP code.
     */
    public static function verifyKey(string $secret, string $code, int $discrepancy = 1): bool
    {
        $currentTimeSlice = floor(time() / 30);

        for ($i = -$discrepancy; $i <= $discrepancy; $i++) {
            $calculatedCode = self::getCode($secret, $currentTimeSlice + $i);
            if ($calculatedCode === $code) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate the code for a specific time slice.
     */
    protected static function getCode(string $secret, int $timeSlice): string
    {
        $secretKey = self::base32Decode($secret);

        // Pack time slice to 64-bit binary
        $time = chr(0) . chr(0) . chr(0) . chr(0) . pack('N', $timeSlice);

        // HMAC-SHA1
        $hmac = hash_hmac('sha1', $time, $secretKey, true);

        // Offset
        $offset = ord($hmac[19]) & 0xf;

        // Extract 4 bytes
        $hashpart = substr($hmac, $offset, 4);

        // Unpack value
        $value = unpack('N', $hashpart);
        $value = $value[1];
        $value = $value & 0x7fffffff;

        // Modulo 10^6
        $modulo = pow(10, 6);
        return str_pad($value % $modulo, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Helper to decode a Base32 string.
     */
    protected static function base32Decode(string $secret): string
    {
        if (empty($secret)) {
            return '';
        }

        $b32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $b32charsFlipped = array_flip(str_split($b32chars));

        $secret = strtoupper($secret);
        $secret = str_replace('=', '', $secret);
        $list = str_split($secret);

        $binaryString = '';
        foreach ($list as $c) {
            if (!isset($b32charsFlipped[$c])) {
                continue;
            }
            $binaryString .= str_pad(decbin($b32charsFlipped[$c]), 5, '0', STR_PAD_LEFT);
        }

        $octets = str_split($binaryString, 8);
        $out = '';
        foreach ($octets as $octet) {
            if (strlen($octet) < 8) {
                continue;
            }
            $out .= chr(bindec($octet));
        }

        return $out;
    }
}
