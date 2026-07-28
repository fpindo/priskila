<?php

namespace Tests\Feature;

class ReportTest extends ApiTestCase
{
    public function test_report_routes_require_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/reports/stock');
        $this->assertApiRouteRequiresAuth('GET', '/api/reports/stock-card/1');
        $this->assertApiRouteRequiresAuth('GET', '/api/reports/turnover');
    }
}
