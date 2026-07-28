<?php

namespace Tests\Feature;

class SecurityTest extends ApiTestCase
{
    public function test_security_routes_require_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/security/devices');
        $this->assertApiRouteRequiresAuth('DELETE', '/api/security/devices/1');
        $this->assertApiRouteRequiresAuth('GET', '/api/security/logs/audit');
        $this->assertApiRouteRequiresAuth('GET', '/api/security/logs/activity');
        $this->assertApiRouteRequiresAuth('GET', '/api/security/logs/login-history');
    }
}
