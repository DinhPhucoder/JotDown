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
            'version' => 'required|integer|min:1',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string|max:10000',
            'color' => 'nullable|regex:/^#[0-9A-F]{6}$/i',
            'is_pinned' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'version.required' => 'Version is required when updating a note',
            'version.integer' => 'Version must be an integer',
            'version.min' => 'Version is invalid',
            'title.max' => 'Title may not be greater than 255 characters',
            'content.max' => 'Content may not be greater than 10000 characters',
            'color.regex' => 'Color must be a valid hex value (example: #000000)',
            'is_pinned.boolean' => 'Pinned value must be true or false',
        ];
    }
}
