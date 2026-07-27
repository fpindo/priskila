<?php

namespace App\Http\Requests\Core;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class BarangMasukRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nomor_dokumen' => ['required', 'string', 'unique:barang_masuk,nomor_dokumen'],
            'tanggal_masuk' => ['required', 'date'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'catatan' => ['nullable', 'string'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.barang_id' => ['required', 'exists:barang,id'],
            'items.*.jumlah' => ['required', 'integer', 'min:1'],
            'items.*.harga_satuan' => ['nullable', 'numeric', 'min:0'],
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
