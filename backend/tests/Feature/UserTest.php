<?php

namespace Tests\Feature;

class UserTest extends ApiTestCase
{
    public function test_users_index_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/users');
    }
}
