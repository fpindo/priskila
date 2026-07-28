<?php

namespace Tests\Feature;

class KonversiSatuanTest extends ApiTestCase
{
    public function test_conversions_index_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/conversions');
    }
}
