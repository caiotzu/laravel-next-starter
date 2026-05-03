<?php

namespace App\Models;

use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Grupo extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $table = 'grupos';

    protected $fillable = [
        'id',
        'descricao',
        'entidade_tipo_id',
        'entidade_id'
    ];

    protected $guarded = [
        'versao'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            /**
             * Adiciona as entidades vinculadas ao usuário sem a necessidade
             * de repassar sempre no service.
             * Só realizar o cadastro automático caso não seja passado, pois pode
             * ser realizado o castro de um novo grupo a partir do admin para uma nova empresa.
             */
            if(!$model->entidade_tipo_id && !$model->entidade_id) {
                $user = Auth::user();

                $model->entidade_tipo_id = $user->grupo->entidade_tipo_id;
                $model->entidade_id = $user->grupo->entidade_id;
            }
        });

        /**
         * Sempre que atualizar a versão faz update automaticamente
         * evitando trabalho nos services
         */
        static::updating(function ($model) {
            $model->versao++;
        });
    }

    public function permissoes(): BelongsToMany
    {
        return $this->belongsToMany(Permissao::class, 'grupo_permissoes', 'grupo_id', 'permissao_id')->withTimestamps();
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'grupo_id', 'id');
    }

    public function entidadeTipo(): BelongsTo
    {
        return $this->belongsTo(EntidadeTipo::class, 'entidade_tipo_id', 'id');
    }
}
