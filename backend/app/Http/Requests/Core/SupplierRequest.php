<?php

namespace App\Http\Requests\Core;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class SupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $supplierId = $this->route('supplier'); // Get supplier ID if updating

        return [
            'kode_supplier' => ['required', 'string', 'unique:suppliers,kode_supplier,' . $supplierId],
            'nama_supplier' => ['required', 'string', 'max:255'],
            'kontak_person' => ['nullable', 'string', 'max:255'],
            'telepon' => ['required', 'string'],
            'email' => ['nullable', 'email', 'max:255'],
            'alamat' => ['required', 'string'],
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
