<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLabelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('labels', 'name')->where(fn ($query) => $query->where('user_id', $userId)),
            ],
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
