<?php

use Illuminate\Support\Facades\Storage;

use App\Enums\BannerStatus;
use App\Enums\UsuarioStatus;
use App\Models\Banner;
use App\Models\BannerImagem;
use App\Models\Usuario;

uses(Tests\TestCase::class);

test('avatar do usuário é resolvido para URL absoluta do disco public', function () {
    $usuario = new Usuario();
    $usuario->setRawAttributes(['avatar' => 'avatars/foto.png']);

    expect($usuario->avatar)->toBe(url(Storage::url('avatars/foto.png')));
    expect($usuario->avatar)->toEndWith('/storage/avatars/foto.png');
});

test('avatar nulo continua nulo', function () {
    $usuario = new Usuario();
    $usuario->setRawAttributes(['avatar' => null]);

    expect($usuario->avatar)->toBeNull();
});

test('caminho da imagem do banner é URL absoluta com /storage', function () {
    $imagem = new BannerImagem();
    $imagem->setRawAttributes(['caminho' => 'banners/1.png']);

    expect($imagem->caminho)->toEndWith('/storage/banners/1.png');
    expect($imagem->caminho)->toStartWith('http');
});

test('caminho vazio da imagem do banner é nulo', function () {
    $imagem = new BannerImagem();
    $imagem->setRawAttributes(['caminho' => null]);

    expect($imagem->caminho)->toBeNull();
});

test('Usuario faz cast de status para enum e esconde senha', function () {
    $usuario = new Usuario();
    $usuario->setRawAttributes(['status' => 'ativo', 'senha' => 'x', 'nome' => 'A']);

    expect($usuario->status)->toBe(UsuarioStatus::ATIVO);
    expect($usuario->toArray())->not->toHaveKey('senha');
});

test('Banner::estaAtivo depende do status', function () {
    $banner = new Banner();
    $banner->setRawAttributes(['status' => 'ativo']);
    expect($banner->estaAtivo())->toBeTrue();

    $banner->setRawAttributes(['status' => 'inativo']);
    expect($banner->estaAtivo())->toBeFalse();
    expect($banner->status)->toBe(BannerStatus::INATIVO);
});

test('scope disponivelAgora filtra por status e janela de período', function () {
    $sql = Banner::query()->disponivelAgora()->toSql();

    expect($sql)->toContain('"status" = ?')
        ->toContain('"inicio_em" <= ?')
        ->toContain('"fim_em" is null')
        ->toContain('"fim_em" >= ?');
});
