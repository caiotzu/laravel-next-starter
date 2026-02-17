<?php

namespace App\Http\Requests\Admin\Usuario;

use Illuminate\Foundation\Http\FormRequest;

class AtualizarAvatarBase64Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'avatar' => [
                'required',
                'string',
            ],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $base64 = $this->input('avatar');

            if (! $this->isValidBase64($base64)) {
                $validator->errors()->add('avatar', 'Avatar inválido.');
                return;
            }

            $mime = $this->detectMimeTypeFromBase64($base64);

            if (! in_array($mime, ['image/png', 'image/jpeg'])) {
                $validator->errors()->add('avatar', 'Permitido apenas PNG ou JPG.');
            }
        });
    }

    private function isValidBase64(string $string): bool
    {
        return base64_decode($string, true) !== false;
    }

    private function detectMimeTypeFromBase64(string $base64): ?string
    {
        $decoded = base64_decode($base64);

        return finfo_buffer(
            finfo_open(FILEINFO_MIME_TYPE),
            $decoded
        );
    }

}
