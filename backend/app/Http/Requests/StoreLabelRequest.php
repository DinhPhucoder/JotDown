<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLabelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100|unique:labels,name',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên nhãn không được để trống',
            'name.max' => 'Tên nhãn không được vượt quá 100 ký tự',
            'name.unique' => 'Nhãn này đã tồn tại',
        ];
    }
}
