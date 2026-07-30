<?php

namespace App\Http\Requests\Core;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class ProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $projectId = $this->route('project'); // Get project ID if updating

        return [
            'kode_project'    => ['required', 'string', 'unique:projects,kode_project,' . $projectId],
            'nama_project'    => ['required', 'string', 'max:255'],
            'deskripsi'       => ['nullable', 'string'],
            'nominal_project' => ['nullable', 'integer', 'min:0'],
            'tanggal_mulai'   => ['required', 'date'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
            'status'          => ['required', 'in:PLANNING,ACTIVE,COMPLETED,ON_HOLD,CANCELLED'],
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation error',
            'errors' => $validator->errors(),
        ], 422));
    }
}
