<?php

namespace Tests\Feature;

class BarangMasukTest extends ApiTestCase
{
    public function test_barang_masuk_index_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/barang-masuk');
    }

    public function test_barang_masuk_store_validates_payload(): void
    {
        $this->actingAsApiUser();

        $this->postJson('/api/barang-masuk', [])->assertUnprocessable();
    }
}
