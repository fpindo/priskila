<?php

namespace Tests\Feature;

class TransferGudangTest extends ApiTestCase
{
    public function test_transfer_gudang_routes_require_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/inventory/transfers');
        $this->assertApiRouteRequiresAuth('POST', '/api/inventory/transfers');
        $this->assertApiRouteRequiresAuth('POST', '/api/inventory/transfers/1/approve');
        $this->assertApiRouteRequiresAuth('POST', '/api/inventory/transfers/1/reject');
    }
}
