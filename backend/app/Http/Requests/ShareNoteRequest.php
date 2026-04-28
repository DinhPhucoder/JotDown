<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ShareNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // We will handle authorization in the Controller using Policies
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'exists:users,email'],
            'permission' => ['required', 'string', 'in:read,edit'],
        ];
    }
}
