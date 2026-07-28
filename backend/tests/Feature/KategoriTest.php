<?php

namespace Tests\Feature;

class KategoriTest extends ApiTestCase
{
    public function test_kategoris_index_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/kategoris');
    }
}
