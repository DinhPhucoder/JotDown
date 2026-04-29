<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLabelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $label = $this->route('label');
        $labelId = is_object($label) ? $label->getKey() : $label;

        return [
            'name' => ['nullable', 'string', 'max:100', Rule::unique('labels', 'name')->ignore($labelId)],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'Tên nhãn không được vượt quá 100 ký tự',
            'name.unique' => 'Nhãn này đã tồn tại',
        ];
    }
}
