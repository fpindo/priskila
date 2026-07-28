<?php

namespace Tests\Feature;

class StockAdjustmentTest extends ApiTestCase
{
    public function test_stock_adjustment_routes_require_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/inventory/adjustments');
        $this->assertApiRouteRequiresAuth('POST', '/api/inventory/adjustments');
    }
}
