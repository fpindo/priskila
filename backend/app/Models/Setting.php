<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'label',
        'description',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    /**
     * Get a setting by key.
     */
    public static function getByKey(string $key): ?self
    {
        return static::where('key', $key)->first();
    }

    private static ?array $configCache = [];

    /**
     * Get config value for a specific key.
     */
    public static function getConfig(string $key): ?array
    {
        if (array_key_exists($key, self::$configCache)) {
            return self::$configCache[$key];
        }
        $setting = static::getByKey($key);
        self::$configCache[$key] = $setting ? $setting->value : null;
        return self::$configCache[$key];
    }

    /**
     * Read an integer field from a setting's array value.
     * Returns the provided default when missing or invalid.
     */
    public static function getConfigInt(string $key, string $field, int $default = 0): int
    {
        $config = static::getConfig($key);
        if (!$config || !array_key_exists($field, $config)) {
            return $default;
        }
        return (int) $config[$field];
    }

    /**
     * Maximum hierarchy depth for locations (1=warehouse only, 5=full warehouse→bin).
     */
    public static function getMaxLocationDepth(): int
    {
        $depth = static::getConfigInt('location_max_depth', 'depth', 5);
        return max(1, min(5, $depth));
    }
}
