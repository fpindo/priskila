<?php

namespace Tests\Feature;

class WarehouseTest extends ApiTestCase
{
    public function test_warehouses_index_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/warehouses');
    }
}
