<?php

namespace Tests\Feature;

class SupplierTest extends ApiTestCase
{
    public function test_suppliers_index_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/suppliers');
    }

    public function test_supplier_store_validates_payload(): void
    {
        $this->actingAsApiUser();

        $this->postJson('/api/suppliers', [])->assertUnprocessable();
    }
}
