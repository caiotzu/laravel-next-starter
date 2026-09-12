<?php

namespace App\Http\Requests\Private\Chamado;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\ChamadoTipo;

class AbrirRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maximoAnexos = config('api.chamados.anexos_maximo_por_mensagem');

        return [
            'tipo' => [
                'required',
                Rule::enum(ChamadoTipo::class),
            ],
            'assunto' => [
                'required',
                'string',
                'max:150',
            ],
            'mensagem' => [
                'required',
                'string',
            ],
            'anexos' => [
                'nullable',
                'array',
                "max:{$maximoAnexos}",
            ],
            'anexos.*.nome' => [
                'required_with:anexos',
                'string',
                'max:255',
            ],
            'anexos.*.conteudo' => [
                'required_with:anexos',
                'string',
            ],
        ];
    }

    public function messages(): array
    {
        $maximoAnexos = config('api.chamados.anexos_maximo_por_mensagem');

        return [
            'tipo.required' => 'O tipo do chamado é obrigatório',
            'tipo.enum'     => 'O tipo informado é inválido',

            'assunto.required' => 'O assunto é obrigatório',
            'assunto.string'   => 'O assunto deve ser um texto',
            'assunto.max'      => 'O assunto deve ter no máximo 150 caracteres',

            'mensagem.required' => 'A descrição é obrigatória',
            'mensagem.string'   => 'A descrição deve ser um texto',

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
     * Mesmo padrão de validação usado para avatar (ver
     * Http\Requests\Private\Perfil\AtualizarAvatarBase64Request): decodifica
     * o base64 e valida o mime type real do conteúdo (nunca confiando na
     * extensão do nome do arquivo) e o tamanho decodificado — o limite e a
     * lista de mimes permitidos vêm de config('api.chamados'), fonte única
     * também usada pelo frontend só para feedback imediato.
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
