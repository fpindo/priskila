<?php

namespace Tests\Feature;

class SettingTest extends ApiTestCase
{
    public function test_setting_routes_require_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/settings');
        $this->assertApiRouteRequiresAuth('PUT', '/api/settings');
        $this->assertApiRouteRequiresAuth('GET', '/api/settings/generate-code/project');
    }
}
