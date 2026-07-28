<?php

namespace App\Http\Requests\Core;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class BarangRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $barangId = $this->route('barang'); // Get barang ID if updating

        return [
            'sku' => ['required', 'string', 'unique:barang,sku,' . $barangId],
            'barcode' => ['nullable', 'string', 'unique:barang,barcode,' . $barangId],
            'nama_barang' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'kategori' => ['required', 'string', 'exists:kategoris,name'],
            'satuan' => ['required', 'string', 'exists:satuans,code'],
            'min_stock' => ['required', 'integer', 'min:0'],
            'harga_satuan' => ['nullable', 'numeric', 'min:0'],
            'brand' => ['nullable', 'string', 'max:255'],
            'bin_location' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'bin_id' => ['nullable', 'integer', 'exists:bins,id'],
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
