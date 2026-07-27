<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kategori;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KategoriController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Kategori::query();

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $categories = $query->latest()->get();

        return $this->successResponse($categories, 'Categories retrieved successfully');
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:kategoris,name',
        ]);

        $category = Kategori::create($validated);

        return $this->successResponse($category, 'Category created successfully', 201);
    }

    /**
     * Display the specified category.
     */
    public function show(string $id): JsonResponse
    {
        $category = Kategori::find($id);

        if (!$category) {
            return $this->errorResponse('Category not found', 404);
        }

        return $this->successResponse($category, 'Category retrieved successfully');
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $category = Kategori::find($id);

        if (!$category) {
            return $this->errorResponse('Category not found', 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:kategoris,name,' . $category->id,
        ]);

        $category->update($validated);

        return $this->successResponse($category, 'Category updated successfully');
    }

    /**
     * Remove the specified category.
     */
    public function destroy(string $id): JsonResponse
    {
        $category = Kategori::find($id);

        if (!$category) {
            return $this->errorResponse('Category not found', 404);
        }

        $category->delete();

        return $this->successResponse(null, 'Category deleted successfully');
    }
}
