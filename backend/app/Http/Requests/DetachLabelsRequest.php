<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DetachLabelsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label_ids' => 'required|array|min:1',
            'label_ids.*' => 'required|integer|exists:labels,id',
        ];
    }

    public function messages(): array
    {
        return [
            'label_ids.required' => 'Phải chọn ít nhất một nhãn',
            'label_ids.array' => 'label_ids phải là mảng',
            'label_ids.min' => 'Phải chọn ít nhất một nhãn',
            'label_ids.*.exists' => 'Một hoặc nhiều nhãn không tồn tại',
        ];
    }
}
