<?php

namespace App\Http\Requests\Admin\Perfil;

use Illuminate\Foundation\Http\FormRequest;

use App\Support\LimiteBase64;

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
                // Teto do TEXTO antes de decodificar (2 MB de arquivo em base64); o limite do
                // arquivo decodificado continua conferido abaixo.
                'max:'.LimiteBase64::maxCaracteres(2 * 1024 * 1024),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.required' => 'A foto de perfil é obrigatória.',
            'avatar.string' => 'A foto de perfil deve ser enviada em um formato válido.',
            'avatar.max' => 'A foto de perfil deve ter no máximo 2MB.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Já reprovado pelas regras (ex.: texto grande demais): não decodifica.
            if ($validator->errors()->has('avatar')) {
                return;
            }

            $base64 = $this->input('avatar');

            if (! $this->isValidBase64($base64)) {
                $validator->errors()->add('avatar', 'Avatar inválido.');
                return;
            }

            // Limite de 2MB no conteúdo decodificado (o avatar é exibido em tamanho pequeno).
            if (strlen((string) base64_decode($base64)) > 2 * 1024 * 1024) {
                $validator->errors()->add('avatar', 'A foto de perfil deve ter no máximo 2MB.');
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
