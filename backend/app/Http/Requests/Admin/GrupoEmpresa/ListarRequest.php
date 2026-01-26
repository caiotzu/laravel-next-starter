<?php

namespace App\Http\Requests\Admin\GrupoEmpresa;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class ListarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => [
                'nullable',
                'uuid',
                'exists:grupo_empresas,id',
            ],
            'nome' => [
                'nullable',
                'string',
                'max:255',
            ],
            'porPagina' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }

    public function messages(): array {
        return [
            'id.uuid'   => 'O (id) informado não é um UUID válido',
            'id.exists' => 'O (id) informado não foi encontrado',

            'nome.string' => 'O (nome) deve ser um texto',
            'nome.max'    => 'O (nome) deve ter no máximo 255 caracteres',

            'porPagina.integer' => 'O (porPagina) deve ser um número inteiro',
            'porPagina.min'     => 'O (porPagina) deve ser no mínimo 1',
            'porPagina.max'     => 'O (porPagina) deve ser no máximo 100',
        ];
    }

    public function failedValidation(Validator $validator) {
        $errorsValidator = $validator->errors()->toArray();
        $messages = [];

        foreach($errorsValidator as $errors) {
            foreach($errors as $error) {
                array_push($messages, $error);
            }
        }

        throw new HttpResponseException(response()->json([
            'messages' => $messages
        ], 400));
    }
}
