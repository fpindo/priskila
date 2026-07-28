<?php

namespace Tests\Feature;

class BarangTest extends ApiTestCase
{
    public function test_barang_index_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/barang');
    }

    public function test_barang_store_validates_payload(): void
    {
        $this->actingAsApiUser();

        $this->postJson('/api/barang', [])->assertUnprocessable();
    }
}
