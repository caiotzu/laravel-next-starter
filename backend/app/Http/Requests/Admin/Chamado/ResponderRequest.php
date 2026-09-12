<?php

namespace App\Http\Requests\Admin\Chamado;

use Illuminate\Foundation\Http\FormRequest;

class ResponderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maximoAnexos = config('api.chamados.anexos_maximo_por_mensagem');

        return [
            'mensagem' => ['required', 'string'],
            'anexos' => ['nullable', 'array', "max:{$maximoAnexos}"],
            'anexos.*.nome' => ['required_with:anexos', 'string', 'max:255'],
            'anexos.*.conteudo' => ['required_with:anexos', 'string'],
        ];
    }

    public function messages(): array
    {
        $maximoAnexos = config('api.chamados.anexos_maximo_por_mensagem');

        return [
            'mensagem.required' => 'A mensagem é obrigatória',
            'mensagem.string'   => 'A mensagem deve ser um texto',

            'anexos.array' => 'Os anexos devem ser enviados corretamente',
            'anexos.max'   => "É permitido no máximo {$maximoAnexos} anexos por mensagem",

            'anexos.*.nome.required_with' => 'O nome do anexo é obrigatório',
            'anexos.*.nome.string' => 'O nome do anexo deve ser um texto',
            'anexos.*.nome.max' => 'O nome do anexo deve ter no máximo 255 caracteres',

            'anexos.*.conteudo.required_with' => 'O conteúdo do anexo é obrigatório',
            'anexos.*.conteudo.string' => 'O conteúdo do anexo deve ser um texto',
        ];
    }

    /**
     * Mesma validação do Private (ver
     * Http\Requests\Private\Chamado\AbrirRequest::withValidator) —
     * duplicada aqui seguindo o mesmo nível de duplicação que o próprio
     * projeto já tolera entre Private/Admin para o avatar base64
     * (AtualizarAvatarBase64Request existe uma vez em cada namespace).
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $anexos = $this->input('anexos', []);

            if (! is_array($anexos)) {
                return;
            }

            $mimesPermitidos = [
                'pdf' => 'application/pdf',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
            ];
            $maximoBytes = config('api.chamados.anexo_tamanho_maximo_kb') * 1024;

            foreach ($anexos as $index => $anexo) {
                $conteudo = $anexo['conteudo'] ?? null;

                if (! $conteudo || base64_decode($conteudo, true) === false) {
                    $validator->errors()->add("anexos.{$index}.conteudo", 'Anexo inválido.');
                    continue;
                }

                $decodificado = base64_decode($conteudo);
                $mime = finfo_buffer(finfo_open(FILEINFO_MIME_TYPE), $decodificado);

                if (! in_array($mime, $mimesPermitidos, true)) {
                    $validator->errors()->add("anexos.{$index}.conteudo", 'Anexo deve ser PDF, JPG, JPEG ou PNG.');
                    continue;
                }

                if (strlen($decodificado) > $maximoBytes) {
                    $validator->errors()->add("anexos.{$index}.conteudo", 'Anexo excede o tamanho máximo permitido.');
                }
            }
        });
    }
}
