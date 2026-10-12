<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Events\UsuarioCriado;
use App\Events\UsuarioExcluido;
use App\Events\SenhaUsuarioAlterada;
use App\Events\UsuarioEsqueceuSenha;
use App\Events\UsuarioStatusAlterado;

use App\Models\Usuario;

use App\DTO\Usuario\UsuarioFiltroDTO;
use App\DTO\Usuario\UsuarioCadastroDTO;
use App\DTO\Usuario\UsuarioAtualizacaoDTO;
use App\DTO\Usuario\UsuarioPrimeiroAcessoDTO;
use App\DTO\Usuario\UsuarioRedefinirSenhaDTO;
use App\DTO\Usuario\UsuarioAtualizacaoStatusDTO;

use App\Enums\ErrorCode;
use App\Enums\EntidadeTipo;
use App\Enums\UsuarioStatus;

use App\Exceptions\BusinessException;

use App\Repositories\GrupoRepository;
use App\Repositories\UsuarioRepository;

class UsuarioService {
    public function __construct(
        private TokenResetSenhaService $tokenResetSenhaService,
        private UsuarioRepository $usuarios,
        private GrupoRepository $grupos,
        private EscopoEntidadeService $escopoEntidade,
    ) {}

    public function cadastrar(UsuarioCadastroDTO $dto): Usuario
    {
        return DB::transaction(function () use ($dto) {
            /**
             * Consulta o Grupo do usuário autenticado para verificar se o ID
             * do grupo passado está dentro da mesma regra
             */
            $grupo = $this->grupos->buscarNoEscopo($this->escopoEntidade->atual(), $dto->grupo_id);
            if(!$grupo)
                throw new BusinessException('O grupo selecionado não é válido para este cadastro.', ErrorCode::GRUPO_REQUIRED->value);

            $usuario = $this->usuarios->criarNoGrupo($grupo, [
                'nome' => $dto->nome,
                'email' => $dto->email,
                'status' => UsuarioStatus::CONVIDADO->value
            ]);

            $token = $this->tokenResetSenhaService->gerarToken($usuario);
            event(new UsuarioCriado($usuario, $token));

            return $usuario;
        });
    }

    public function atualizar(UsuarioAtualizacaoDTO $dto): Usuario
    {
        return DB::transaction(function () use ($dto) {
            /**
             * Consulta o Grupo do usuário autenticado para verificar se o ID
             * do grupo passado está dentro da mesma regra
             */
            $escopo = $this->escopoEntidade->atual();

            $grupo = $this->grupos->buscarNoEscopo($escopo, $dto->grupo_id);
            if(!$grupo)
                throw new BusinessException('O grupo selecionado não é válido para este cadastro.', ErrorCode::GRUPO_REQUIRED->value);

            $usuario = $this->usuarios->buscarNoEscopo($escopo, $dto->id);
            if(!$usuario)
                throw new BusinessException('Usuário não encontrado.', ErrorCode::USUARIO_NOT_FOUND->value);

            if (! $dto->temAlteracoes())
                throw new BusinessException('Nenhum dado informado para atualização.', ErrorCode::USUARIO_REQUIRED->value);

            $usuario->update($dto->paraPersistencia());
            event(new UsuarioStatusAlterado($usuario));

            return $usuario;
        });
    }

    public function atualizarStatus(UsuarioAtualizacaoStatusDTO $dto): Usuario
    {
        return DB::transaction(function () use ($dto) {
            /**
             * Faz atualização apenas do status. Essa função deve ser chamada apenas por usuários administrativos,
             * caso precise atualizar o usuário normalmente, utilizar a função atualizar padrão.
             */
            $usuario = $this->usuarios->buscarClienteDoGrupo($dto->usuarioId, $dto->grupoId);
            if(!$usuario)
                throw new BusinessException('Usuário não encontrado.', ErrorCode::USUARIO_NOT_FOUND->value);

            /**
             * Usuários convidados (ainda sem senha) ou com senha expirada não podem ter o
             * status alterado por aqui. A UI já esconde essa opção, mas a regra precisa
             * valer também no backend.
             */
            if (in_array($usuario->status, [UsuarioStatus::CONVIDADO, UsuarioStatus::EXPIRADO], true))
                throw new BusinessException('O status deste usuário não pode ser alterado.', ErrorCode::USUARIO_REQUIRED->value);

            if (! $dto->temAlteracoes())
                throw new BusinessException('Nenhum dado informado para atualização.', ErrorCode::USUARIO_REQUIRED->value);

            $usuario->update($dto->paraPersistencia());
            event(new UsuarioStatusAlterado($usuario));

            return $usuario;
        });
    }

    public function visualizar(string $id): Usuario
    {
        return DB::transaction(function () use ($id) {
            /**
             * Para listar o usuário precisa ser do mesmo tipo de entidade. Ex: admin, private
             * e também deve pertencer ao mesmo identificador da entidade. Ex: null (admin), grupo_empresas.
             */
            $usuario = $this->usuarios->buscarComGrupoNoEscopo($this->escopoEntidade->atual(), $id);

            if (! $usuario) {
                throw new BusinessException(
                    'Usuário não encontrado.',
                    ErrorCode::USUARIO_NOT_FOUND->value
                );
            }

            return $usuario;
        });
    }

    public function excluir(string $id): void
    {
        DB::transaction(function () use ($id) {
            /**
             * O usuário só é encontrado se o grupo dele estiver no escopo do contexto (inclusive
             * grupo excluído). Uma única consulta escopada: um usuário de outra empresa é
             * indistinguível de um inexistente.
             */
            $usuario = $this->usuarios->buscarComGrupoExcluidoNoEscopo($this->escopoEntidade->atual(), $id);
            if (!$usuario) {
                throw new BusinessException(
                    'Usuário não encontrado para exclusão.',
                    ErrorCode::USUARIO_NOT_FOUND->value
                );
            }

            $usuario->delete();
            $usuario->fresh();

            event(new UsuarioExcluido($usuario));
        });
    }

    public function ativar(string $id): Usuario
    {
        return DB::transaction(function () use ($id) {
            /**
             * Mesma regra da exclusão: só enxerga usuários excluídos do escopo do contexto.
             */
            $usuario = $this->usuarios->buscarExcluidoNoEscopo($this->escopoEntidade->atual(), $id);
            if (!$usuario) {
                throw new BusinessException(
                    'Usuário não encontrado para ativação.',
                    ErrorCode::USUARIO_NOT_FOUND->value
                );
            }

            $usuario->restore();
            return $usuario->fresh();
        });
    }

    public function listar(UsuarioFiltroDTO $filtro): LengthAwarePaginator
    {
        /**
         * Para listar o usuário precisa ser do mesmo tipo de entidade. Ex: admin, private
         * e também deve pertencer ao mesmo identificador da entidade. Ex: null (admin), grupo_empresas.
         */
        return $this->usuarios->listarNoEscopo($this->escopoEntidade->atual(), $filtro);
    }

    public function primeiroAcesso(UsuarioPrimeiroAcessoDTO $dto): void
    {
        DB::transaction(function () use ($dto) {
            $tokenResetSenha = $this->tokenResetSenhaService->consumirToken($dto->token);

            $usuario = $tokenResetSenha->usuario;

            $usuario->update([
                'senha' => Hash::make($dto->senha),
                'status' => UsuarioStatus::ATIVO->value
            ]);

            $tokenResetSenha->update([
                'usado_em' => now(),
            ]);
        });
    }

    public function esqueceuSenha(string $email, EntidadeTipo $entidadeTipo): void
    {
        $usuario = $this->usuarios->buscarAtivoOuConvidadoPorEmail($email, $entidadeTipo);

        if (! $usuario) {
            return;
        }

        $token = $this->tokenResetSenhaService->gerarToken($usuario);
        event(new UsuarioEsqueceuSenha($usuario, $token));
    }

    public function redefinirSenha(UsuarioRedefinirSenhaDTO $dto): void
    {
        DB::transaction(function () use ($dto) {
            $tokenResetSenha = $this->tokenResetSenhaService->consumirToken($dto->token);

            $usuario = $tokenResetSenha->usuario;

            $usuario->update([
                'senha' => Hash::make($dto->senha),
                'status' => UsuarioStatus::ATIVO->value
            ]);

            $tokenResetSenha->update([
                'usado_em' => now(),
            ]);

            /**
             * Quem redefine a senha (normalmente por suspeita de comprometimento) espera
             * que qualquer sessão aberta anteriormente deixe de funcionar.
             */
            $this->encerrarSessoesDoUsuario($usuario);

            $token = $this->tokenResetSenhaService->gerarToken($usuario);
            event(new SenhaUsuarioAlterada($usuario, $token));
        });
    }

    /**
     * Encerra as sessões ativas do usuário. Se $exceptoSessaoId for informado, essa sessão
     * é preservada (ex.: o usuário trocou a própria senha e continua logado neste aparelho).
     */
    public function encerrarSessoesDoUsuario(Usuario $usuario, ?string $exceptoSessaoId = null): void
    {
        $usuario->usuarioSessoes()
            ->where('ativo', true)
            ->when($exceptoSessaoId, fn ($q) => $q->where('id', '!=', $exceptoSessaoId))
            ->update([
                'ativo' => false,
                'logout_em' => now(),
            ]);
    }

    public function registrarLogin(Usuario $usuario, ?string $ip): void
    {
        if (! $usuario->exists) {
            throw new BusinessException('Usuário não encontrado.', ErrorCode::USUARIO_NOT_FOUND->value);
        }

        $usuario->update([
            'ultimo_login_em' => now(),
            'ultimo_ip' => $ip,
        ]);
    }

    public function obterUsuarioAtivoPorEmail(string $email, EntidadeTipo $entidadeTipo): Usuario | null
    {
        return $this->usuarios->buscarAtivoPorEmail($email, $entidadeTipo);
    }

    public function obterUsuarioAtivoPorId(string $id, EntidadeTipo $entidadeTipo): Usuario | null
    {
        return $this->usuarios->buscarAtivoPorId($id, $entidadeTipo);
    }

    public function resetarSenha(string $id, string $grupoId): void
    {
        /**
         * Esse método é utilizado pelo administrativo para forçar um envio de e-mail para o usuário.
         * Para reset de senha normal pela tela de login utilizar o fluxo padrão de esqueceu a senha
         */
        $usuario = $this->usuarios->buscarClienteDoGrupo($id, $grupoId, somenteAtivosOuConvidados: true);
        if (! $usuario) {
            return;
        }

        $token = $this->tokenResetSenhaService->gerarToken($usuario);
        event(new UsuarioEsqueceuSenha($usuario, $token));
    }

    public function listarAdministradoresComAcessoSuporte(string | null $busca)
    {
        $permissoes = [
            'admin.acesso_suporte.listar' // A listagem já permite o acesso por parte do admin
        ];

        return $this->usuarios->listarAdministradoresComPermissao($busca, $permissoes);
    }
}
