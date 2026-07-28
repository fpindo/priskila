<?php

namespace Tests\Feature;

class PemakaianBarangTest extends ApiTestCase
{
    public function test_pemakaian_barang_index_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/pemakaian-barang');
    }

    public function test_pemakaian_approval_routes_require_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('POST', '/api/pemakaian-barang/1/approve');
        $this->assertApiRouteRequiresAuth('POST', '/api/pemakaian-barang/1/reject');
    }
}
