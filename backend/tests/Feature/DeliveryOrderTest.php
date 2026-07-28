<?php

namespace Tests\Feature;

class DeliveryOrderTest extends ApiTestCase
{
    public function test_delivery_order_routes_require_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/delivery-orders');
        $this->assertApiRouteRequiresAuth('POST', '/api/delivery-orders');
        $this->assertApiRouteRequiresAuth('POST', '/api/delivery-orders/1/ship');
    }

    public function test_public_verify_invalid_token_is_handled(): void
    {
        $this->getJson('/api/delivery-orders/verify/invalid-token')->assertStatus(404);
    }
}
