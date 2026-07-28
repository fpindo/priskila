<?php

namespace Tests\Feature;

class MasterProjectTest extends ApiTestCase
{
    public function test_projects_index_requires_authentication(): void
    {
        $this->assertApiRouteRequiresAuth('GET', '/api/projects');
    }

    public function test_project_store_validates_payload(): void
    {
        $this->actingAsApiUser();

        $this->postJson('/api/projects', [])->assertUnprocessable();
    }
}
