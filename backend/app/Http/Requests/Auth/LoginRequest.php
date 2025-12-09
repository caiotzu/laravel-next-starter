<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'email',
                'exists:usuarios'
            ],
            'senha' => 'required'
        ];
    }

    public function messages(): array {
        return [
            'email.required' => 'O (email) é obrigatório',
            'email.email' => 'O (email) está com formato inválido',
            'email.exists' => 'O (email) não foi encontrado',

            'senha' => 'O (senha) é obrigatório',
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
