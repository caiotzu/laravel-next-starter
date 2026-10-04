<?php

use App\DTO\Banner\BannerCadastroDTO;
use App\DTO\Banner\BannerDirecionamentoDTO;
use App\DTO\Banner\BannerFiltroDTO;
use App\DTO\Chamado\ChamadoFiltroDTO;
use App\DTO\Common\PaginationDTO;
use App\DTO\Empresa\EmpresaAtualizacaoDTO;
use App\Enums\BannerDirecionamentoTipo;
use App\Enums\BannerStatus;
use App\Enums\ChamadoPrioridade;
use App\Enums\ChamadoStatus;
use App\Enums\ChamadoTipo;
use App\Enums\EmpresaStatus;
use App\Enums\EntidadeTipo;

uses(Tests\TestCase::class);

describe('PaginationDTO', function () {
    it('usa o padrão da configuração', function () {
        expect(PaginationDTO::criarParaPaginar([])->por_pagina)->toBe(config('api.pagination.default'));
    });

    it('respeita o valor informado dentro dos limites', function () {
        expect(PaginationDTO::criarParaPaginar(['por_pagina' => '25'])->por_pagina)->toBe(25);
    });

    it('limita ao máximo e ao mínimo', function () {
        expect(PaginationDTO::criarParaPaginar(['por_pagina' => 100000])->por_pagina)->toBe(config('api.pagination.max'));
        expect(PaginationDTO::criarParaPaginar(['por_pagina' => -5])->por_pagina)->toBe(config('api.pagination.min'));
        expect(PaginationDTO::criarParaPaginar(['por_pagina' => 0])->por_pagina)->toBe(config('api.pagination.min'));
    });
});

describe('Filtros', function () {
    it('BannerFiltroDTO converte status e paginação', function () {
        $dto = BannerFiltroDTO::criarParaFiltro(['titulo' => 'x', 'status' => 'ativo', 'por_pagina' => 20]);

        expect($dto->titulo)->toBe('x');
        expect($dto->status)->toBe(BannerStatus::ATIVO);
        expect($dto->paginacao->por_pagina)->toBe(20);
        expect($dto->excluido)->toBeNull();
    });

    it('BannerFiltroDTO sem filtros', function () {
        $dto = BannerFiltroDTO::criarParaFiltro([]);

        expect($dto->titulo)->toBeNull();
        expect($dto->status)->toBeNull();
    });

    it('BannerFiltroDTO rejeita status inválido', function () {
        BannerFiltroDTO::criarParaFiltro(['status' => 'nao-existe']);
    })->throws(ValueError::class);

    it('ChamadoFiltroDTO converte enums', function () {
        $dto = ChamadoFiltroDTO::criarParaFiltro([
            'status' => 'aberto',
            'tipo' => ChamadoTipo::cases()[0]->value,
            'prioridade' => ChamadoPrioridade::cases()[0]->value,
            'ticket' => '123',
        ]);

        expect($dto->status)->toBe(ChamadoStatus::ABERTO);
        expect($dto->tipo)->toBe(ChamadoTipo::cases()[0]);
        expect($dto->prioridade)->toBe(ChamadoPrioridade::cases()[0]);
        expect($dto->ticket)->toBe('123');
        expect($dto->responsavel_id)->toBeNull();
    });
});

describe('Banner', function () {
    it('direcionamento com e sem entidade', function () {
        $todos = BannerDirecionamentoDTO::criarParaCadastro(['tipo' => BannerDirecionamentoTipo::cases()[0]->value]);
        expect($todos->entidade_tipo)->toBeNull();

        $privado = BannerDirecionamentoDTO::criarParaCadastro([
            'tipo' => BannerDirecionamentoTipo::cases()[0]->value,
            'entidade_tipo' => 'private',
        ]);
        expect($privado->entidade_tipo)->toBe(EntidadeTipo::PRIVATE);
    });

    it('cadastro converte datas, imagens e links', function () {
        $dto = BannerCadastroDTO::criarParaCadastro([
            'titulo' => 'Natal',
            'inicio_em' => '2026-12-01 00:00:00',
            'fim_em' => '2026-12-31 23:59:59',
            'direcionamento' => ['tipo' => BannerDirecionamentoTipo::cases()[0]->value],
        ]);

        expect($dto->titulo)->toBe('Natal');
        expect($dto->conteudo)->toBeNull();
        expect($dto->inicio_em)->toBeInstanceOf(DateTimeImmutable::class);
        expect($dto->fim_em->format('Y-m-d'))->toBe('2026-12-31');
        expect($dto->imagens)->toBe([]);
        expect($dto->links)->toBe([]);
    });

    it('cadastro sem fim_em deixa fim nulo', function () {
        $dto = BannerCadastroDTO::criarParaCadastro([
            'titulo' => 'x',
            'inicio_em' => '2026-01-01',
            'direcionamento' => ['tipo' => BannerDirecionamentoTipo::cases()[0]->value],
        ]);

        expect($dto->fim_em)->toBeNull();
    });
});

describe('EmpresaAtualizacaoDTO', function () {
    $dados = [
        'cnpj' => '11111111000101',
        'nome_fantasia' => 'Fantasia',
        'razao_social' => 'Razão',
        'uf' => 'SP',
        'status' => 'ativo',
    ];

    it('irrestrito persiste cnpj e status', function () use ($dados) {
        $dto = EmpresaAtualizacaoDTO::criarParaAtualizacao('id-1', $dados);
        $persistencia = $dto->paraPersistencia(true);

        expect($dto->status)->toBe(EmpresaStatus::ATIVO);
        expect($persistencia)->toHaveKeys(['cnpj', 'status', 'nome_fantasia']);
    });

    it('restrito (suporte) NÃO persiste cnpj nem status', function () use ($dados) {
        $persistencia = EmpresaAtualizacaoDTO::criarParaAtualizacao('id-1', $dados)->paraPersistencia(false);

        expect($persistencia)->not->toHaveKeys(['cnpj', 'status']);
        expect($persistencia)->toHaveKeys(['matriz_id', 'nome_fantasia', 'razao_social', 'inscricao_estadual', 'inscricao_municipal', 'uf']);
    });

    it('status ausente não é enviado para persistência', function () {
        $persistencia = EmpresaAtualizacaoDTO::criarParaAtualizacao('id-1', ['nome_fantasia' => 'x'])->paraPersistencia(true);

        expect($persistencia)->not->toHaveKey('status');
    });
});
