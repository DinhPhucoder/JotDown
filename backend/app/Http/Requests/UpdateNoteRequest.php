<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string|max:10000',
            'color' => 'nullable|regex:/^#[0-9A-F]{6}$/i',
            'is_pinned' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'title.max' => 'Tiêu đề không được vượt quá 255 ký tự',
            'content.max' => 'Nội dung không được vượt quá 10000 ký tự',
            'color.regex' => 'Màu sắc phải là mã hex hợp lệ (VD: #000000)',
            'is_pinned.boolean' => 'Ghim phải là true hoặc false',
        ];
    }
}
