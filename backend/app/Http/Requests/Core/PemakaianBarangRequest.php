<?php

namespace App\Http\Requests\Core;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class PemakaianBarangRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nomor_dokumen' => ['required', 'string', 'unique:pemakaian_barang,nomor_dokumen'],
            'tanggal_pemakaian' => ['required', 'date'],
            'project_id' => ['required', 'exists:projects,id'],
            'keterangan' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.barang_id' => ['required', 'exists:barang,id'],
            'items.*.jumlah' => ['required', 'integer', 'min:1'],
            'items.*.catatan' => ['nullable', 'string'],
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
