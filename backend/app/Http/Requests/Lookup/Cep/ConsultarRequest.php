<?php

namespace App\Http\Requests\Lookup\Cep;

use Illuminate\Foundation\Http\FormRequest;

class ConsultarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'cep' => preg_replace('/\D/', '', $this->route('cep')),
        ]);
    }

    public function rules(): array
    {
        return [
            'cep' => [
                'required',
                'digits:8'
            ],
        ];
    }

    public function messages(): array {
        return [
            'cep.required' => 'O CEP é obrigatório.',
            'cep.digits' => 'O CEP deve conter exatamente 8 números.',
        ];
    }
}
