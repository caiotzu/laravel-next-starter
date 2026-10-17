<?php

/**
 * Guardas ESTRUTURAIS contra vazamento de dados entre empresas. Não testam uma consulta:
 * testam que o desenho do código continua tornando difícil esquecer o escopo.
 */

use App\Repositories\GrupoRepository;
use App\Repositories\UsuarioRepository;
use App\Support\EscopoEntidade;

uses(Tests\TestCase::class);

/**
 * Métodos públicos que, por natureza, NÃO recebem EscopoEntidade. Cada entrada é uma decisão
 * consciente e revisada (justificativa no docblock da classe). Para adicionar um método sem
 * escopo, é preciso editar esta lista — e é isso que força a conversa no code review.
 */
const METODOS_SEM_ESCOPO = [
    GrupoRepository::class => [],
    UsuarioRepository::class => [
        'criarNoGrupo',                       // recebe um Grupo já validado no escopo
        'buscarAtivoPorEmail',                // login
        'buscarAtivoPorId',                   // refresh / 2FA
        'buscarAtivoOuConvidadoPorEmail',     // esqueci minha senha
        'buscarClienteDoGrupo',               // ação de Admin sobre usuários de clientes
        'listarAdministradoresComPermissao',  // lookup exclusivo de administradores
        'buscarAdministradorAtivoPorId',      // lookup exclusivo de administradores ativos (Acesso de Suporte)
        'pesquisarEmTodasAsEntidades',        // busca GLOBAL de destinatários de mensagem (só Admin)
    ],
];

function metodosPublicos(string $classe): array
{
    return collect((new ReflectionClass($classe))->getMethods(ReflectionMethod::IS_PUBLIC))
        ->filter(fn (ReflectionMethod $m) => $m->class === $classe && ! $m->isConstructor())
        ->values()
        ->all();
}

dataset('repositorios', [
    'GrupoRepository' => GrupoRepository::class,
    'UsuarioRepository' => UsuarioRepository::class,
]);

it('exige EscopoEntidade como primeiro parâmetro em todo método público (exceto a lista revisada)', function (string $classe) {
    foreach (metodosPublicos($classe) as $metodo) {
        if (in_array($metodo->name, METODOS_SEM_ESCOPO[$classe], true)) {
            continue;
        }

        $primeiro = $metodo->getParameters()[0] ?? null;

        expect($primeiro?->getType()?->getName())
            ->toBe(EscopoEntidade::class, "{$classe}::{$metodo->name}() precisa receber EscopoEntidade (ou entrar em METODOS_SEM_ESCOPO).");
    }
})->with('repositorios');

it('não mantém na lista de exceções métodos que não existem mais', function (string $classe) {
    $existentes = collect(metodosPublicos($classe))->pluck('name')->all();

    expect(array_values(array_diff(METODOS_SEM_ESCOPO[$classe], $existentes)))->toBe([]);
})->with('repositorios');

it('mantém o filtro de escopo em um único método privado por repository', function (string $classe) {
    $privados = collect((new ReflectionClass($classe))->getMethods(ReflectionMethod::IS_PRIVATE))
        ->pluck('name')->all();

    expect($privados)->toContain('noEscopo');
})->with('repositorios');

// ---------------------------------------------------------------------------------------
// Fonte da verdade do contexto
// ---------------------------------------------------------------------------------------

function arquivosPhp(string $pasta): array
{
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($pasta, FilesystemIterator::SKIP_DOTS));
    $arquivos = [];

    foreach ($it as $arquivo) {
        if ($arquivo->getExtension() === 'php') {
            $arquivos[] = $arquivo->getPathname();
        }
    }

    return $arquivos;
}

it('só o EscopoEntidadeService lê entidade_tipo/entidade do AcessoSuporteContexto', function () {
    $permitidos = ['AcessoSuporte/AcessoSuporteContexto.php', 'Services/EscopoEntidadeService.php'];
    $base = dirname(__DIR__, 2) . '/app/';
    $infratores = [];

    foreach (arquivosPhp($base) as $arquivo) {
        $relativo = str_replace($base, '', $arquivo);

        if (in_array($relativo, $permitidos, true) || str_starts_with($relativo, 'OpenApi/')) {
            continue;
        }

        // Código (não comentários): chamadas ->entidadeTipoId( / ->entidadeId( com argumento.
        $codigo = preg_replace('#/\*.*?\*/|//[^\n]*#s', '', file_get_contents($arquivo));

        if (preg_match('/->entidade(TipoId|Id)\(\s*[^)\s]/', $codigo)) {
            $infratores[] = $relativo;
        }
    }

    expect($infratores)->toBe([], 'Use EscopoEntidadeService::atual() em vez de ler o contexto direto.');
});

it('UsuarioService, GrupoService, GrupoEmpresaService, MensagemService e AcessoSuporteService não montam consultas de Usuario/Grupo nem leem o usuário autenticado', function () {
    $base = dirname(__DIR__, 2) . '/app/Services/';

    foreach (['UsuarioService.php', 'GrupoService.php', 'GrupoEmpresaService.php', 'MensagemService.php', 'AcessoSuporteService.php'] as $arquivo) {
        $codigo = preg_replace('#/\*.*?\*/|//[^\n]*#s', '', file_get_contents($base . $arquivo));

        expect($codigo)
            ->not->toMatch('/\b(Usuario|Grupo)::(query|where|with|find|findOrFail|create|onlyTrashed|withTrashed)\b/', "{$arquivo}: consulta de Usuario/Grupo pertence ao Repository.")
            ->not->toContain('Auth::user()')
            ->not->toContain('AcessoSuporteContexto');
    }
});
