<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file_url' => ['required', 'url', 'max:2048'],
            'file_size' => ['required', 'integer', 'min:1', 'max:15728640'],
            'file_type' => ['required', 'string', 'in:image/jpeg,image/png,jpg,jpeg,png'],
            'original_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
