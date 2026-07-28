<?php

namespace Tests\Feature;

class LocationTest extends ApiTestCase
{
    public function test_location_hierarchy_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/locations/warehouses');
        $this->assertApiRouteRequiresAuth('GET', '/api/locations/1/zones');
        $this->assertApiRouteRequiresAuth('GET', '/api/locations/1/racks');
        $this->assertApiRouteRequiresAuth('GET', '/api/locations/1/shelves');
        $this->assertApiRouteRequiresAuth('GET', '/api/locations/1/bins');
    }

    public function test_location_crud_requires_authentication(): void
    {
        foreach (['zones', 'racks', 'shelves', 'bins'] as $resource) {
            $this->assertApiRouteRequiresAuth('POST', "/api/{$resource}");
            $this->assertApiRouteRequiresAuth('PUT', "/api/{$resource}/1");
            $this->assertApiRouteRequiresAuth('DELETE', "/api/{$resource}/1");
        }
    }
}
