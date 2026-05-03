<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'changes' => ['required', 'array'],
            'changes.*.action' => ['required', 'string', 'in:CREATE,UPDATE,DELETE,ATTACHMENT_ADD,ATTACHMENT_REMOVE'],
            'changes.*.entity_id' => ['required', 'string'],
            'changes.*.payload' => ['nullable', 'array'],
            'changes.*.payload.version' => ['sometimes', 'integer'],
            'changes.*.payload.title' => ['sometimes', 'nullable', 'string'],
            'changes.*.payload.content' => ['sometimes', 'nullable', 'string'],
            'changes.*.payload.color' => ['sometimes', 'nullable', 'string'],
            'changes.*.payload.is_pinned' => ['sometimes', 'boolean'],
            'changes.*.payload.label_names' => ['sometimes', 'nullable', 'array'],
            'changes.*.payload.label_names.*' => ['sometimes', 'string', 'max:100'],
            'changes.*.payload.attachment_id' => ['sometimes', 'integer'],
            'changes.*.payload.file_url' => ['sometimes', 'string'],
            'changes.*.payload.file_size' => ['sometimes', 'integer'],
            'changes.*.payload.file_type' => ['sometimes', 'string'],
            'changes.*.payload.original_name' => ['sometimes', 'nullable', 'string'],
            'changes.*.timestamp' => ['required', 'date'],
        ];
    }
}
