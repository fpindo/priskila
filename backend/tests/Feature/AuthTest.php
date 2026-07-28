<?php

namespace Tests\Feature;

class AuthTest extends ApiTestCase
{
    public function test_login_requires_credentials(): void
    {
        $this->postJson('/api/auth/login', [])->assertUnprocessable();
    }

    public function test_me_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/auth/me');
    }
}
