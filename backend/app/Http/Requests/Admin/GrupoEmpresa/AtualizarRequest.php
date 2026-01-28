<?php

namespace App\Http\Requests\Admin\GrupoEmpresa;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class AtualizarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => [
                'required',
                'string',
                'max:255',
                Rule::unique('grupo_empresas', 'nome')->ignore($this->route('id')),
            ]
        ];
    }

    public function messages(): array {
        return [
            'nome.required' => 'O (nome) é obrigatório',
            'nome.string'   => 'O (nome) deve ser um texto',
            'nome.unique'   => 'O (nome) já está cadastrado para outro grupo',
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
