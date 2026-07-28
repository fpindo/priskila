<?php

namespace Tests\Feature;

class StockOpnameTest extends ApiTestCase
{
    public function test_stock_opname_routes_require_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/inventory/opnames');
        $this->assertApiRouteRequiresAuth('POST', '/api/inventory/opnames');
        $this->assertApiRouteRequiresAuth('PUT', '/api/inventory/opnames/1');
        $this->assertApiRouteRequiresAuth('POST', '/api/inventory/opnames/1/finalize');
    }
}
