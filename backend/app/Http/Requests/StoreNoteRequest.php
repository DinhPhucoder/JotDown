<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreNoteRequest extends FormRequest
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
            'attachments' => 'nullable|array|min:1',
            'attachments.*.file_url' => 'required|string',
            'attachments.*.file_size' => 'required|integer|min:1',
            'attachments.*.file_type' => 'required|string',
            'attachments.*.original_name' => 'nullable|string|max:255',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $title = trim((string) $this->input('title', ''));
            $content = trim((string) $this->input('content', ''));
            $attachments = $this->input('attachments');
            $hasAttachments = is_array($attachments) && count($attachments) > 0;

            if ($title === '' && $content === '' && !$hasAttachments) {
                $validator->errors()->add(
                    'note',
                    'Ghi chú phải có tiêu đề, nội dung hoặc ít nhất một tệp đính kèm.',
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'title.max' => 'Tiêu đề không được vượt quá 255 ký tự',
            'content.max' => 'Nội dung không được vượt quá 10000 ký tự',
            'color.regex' => 'Màu sắc phải là mã hex hợp lệ (VD: #000000)',
            'attachments.array' => 'Danh sách tệp đính kèm không hợp lệ.',
            'attachments.min' => 'Danh sách tệp đính kèm không hợp lệ.',
            'attachments.*.file_url.required' => 'Thiếu URL tệp đính kèm.',
            'attachments.*.file_size.required' => 'Thiếu dung lượng tệp đính kèm.',
            'attachments.*.file_size.integer' => 'Dung lượng tệp đính kèm không hợp lệ.',
            'attachments.*.file_size.min' => 'Dung lượng tệp đính kèm không hợp lệ.',
            'attachments.*.file_type.required' => 'Thiếu định dạng tệp đính kèm.',
            'attachments.*.original_name.max' => 'Tên tệp đính kèm không được vượt quá 255 ký tự.',
        ];
    }
}
