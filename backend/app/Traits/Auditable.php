<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->audit('created', null, $model->getAttributes());
        });

        static::updated(function ($model) {
            $old = array_intersect_key($model->getOriginal(), $model->getDirty());
            $new = $model->getDirty();
            
            // Exclude common timestamps
            unset($old['updated_at'], $new['updated_at']);

            if (count($new) > 0) {
                $model->audit('updated', $old, $new);
            }
        });

        static::deleted(function ($model) {
            $model->audit('deleted', $model->getAttributes(), null);
        });
    }

    protected function audit(string $event, ?array $old, ?array $new): void
    {
        // Don't audit AuditLog itself (though it won't be using this trait anyway)
        AuditLog::create([
            'user_id' => Auth::id(),
            'auditable_type' => get_class($this),
            'auditable_id' => $this->id,
            'event' => $event,
            'old_values' => $old,
            'new_values' => $new,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
