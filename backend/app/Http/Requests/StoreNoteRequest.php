<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'content' => 'required|string|max:10000',
            'color' => 'nullable|regex:/^#[0-9A-F]{6}$/i',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Tiêu đề không được để trống',
            'title.max' => 'Tiêu đề không được vượt quá 255 ký tự',
            'content.required' => 'Nội dung không được để trống',
            'content.max' => 'Nội dung không được vượt quá 10000 ký tự',
            'color.regex' => 'Màu sắc phải là mã hex hợp lệ (VD: #000000)',
        ];
    }
}
