<?php

namespace Tests\Feature;

class DashboardTest extends ApiTestCase
{
    public function test_dashboard_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/dashboard');
    }
}
