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
}
