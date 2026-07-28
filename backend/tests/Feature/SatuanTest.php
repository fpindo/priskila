<?php

namespace Tests\Feature;

class SatuanTest extends ApiTestCase
{
    public function test_satuans_index_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/satuans');
    }
}
