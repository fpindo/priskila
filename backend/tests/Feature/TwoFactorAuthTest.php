<?php

namespace Tests\Feature;

class TwoFactorAuthTest extends ApiTestCase
{
    public function test_two_factor_verify_validates_payload(): void
    {
        $this->postJson('/api/auth/2fa/verify', [])->assertUnprocessable();
    }

    public function test_two_factor_management_routes_require_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('POST', '/api/auth/2fa/enable');
        $this->assertApiRouteRequiresAuth('POST', '/api/auth/2fa/confirm');
        $this->assertApiRouteRequiresAuth('POST', '/api/auth/2fa/disable');
    }
}
