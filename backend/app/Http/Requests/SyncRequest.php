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
            'changes.*.timestamp' => ['required', 'date'],
        ];
    }
}
