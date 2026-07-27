<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Core\ProjectRequest;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * Display a listing of projects.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Project::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('kode_project', 'like', "%{$search}%")
                  ->orWhere('nama_project', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $projects = $query->latest()->paginate($request->get('limit', 10));

        return $this->successResponse($projects, 'Projects retrieved successfully');
    }

    /**
     * Store a newly created project.
     */
    public function store(ProjectRequest $request): JsonResponse
    {
        $project = Project::create($request->validated());

        return $this->successResponse($project, 'Project created successfully', 201);
    }

    /**
     * Display the specified project.
     */
    public function show(string $id): JsonResponse
    {
        $project = Project::find($id);

        if (!$project) {
            return $this->errorResponse('Project not found', 404);
        }

        return $this->successResponse($project, 'Project retrieved successfully');
    }

    /**
     * Update the specified project.
     */
    public function update(ProjectRequest $request, string $id): JsonResponse
    {
        $project = Project::find($id);

        if (!$project) {
            return $this->errorResponse('Project not found', 404);
        }

        $project->update($request->validated());

        return $this->successResponse($project, 'Project updated successfully');
    }

    /**
     * Remove the specified project.
     */
    public function destroy(string $id): JsonResponse
    {
        $project = Project::find($id);

        if (!$project) {
            return $this->errorResponse('Project not found', 404);
        }

        $project->delete();

        return $this->successResponse(null, 'Project deleted successfully');
    }
}
