"use client";

import { useState } from "react";

import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Info } from "@/components/common/Info";

import { VisualizarGrupoEmpresaResponse } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.responses";
import { formatDate } from "@/lib/utils";

import { UsuarioCard } from "./UsuarioCard";

interface GrupoEmpresaVisualizacaoProps {
  grupoEmpresa: VisualizarGrupoEmpresaResponse;
}

export function GrupoEmpresaVisualizacao({
  grupoEmpresa,
}: GrupoEmpresaVisualizacaoProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  function toggleExpand(groupId: string) {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) newSet.delete(groupId);
      else newSet.add(groupId);
      return newSet;
    });
  }

  return (
    <div className="flex flex-1 flex-col py-6 space-y-6">
      <div
        className={`rounded-xl shadow-sm border-l-4 bg-card p-6 ${
          grupoEmpresa.deleted_at
            ? "border-red-500"
            : "border-emerald-500"
        }`}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold">
            {grupoEmpresa.nome}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
          <Info label="ID" value={grupoEmpresa.id} />
          <Info label="Situação" value={grupoEmpresa.deleted_at ? 'Excluído' : 'Ativo'} />
          <Info label="Criado em" value={formatDate(grupoEmpresa.created_at)} />
          <Info label="Atualizado em" value={formatDate(grupoEmpresa.updated_at)} />
          <Info label="Excluído em" value={formatDate(grupoEmpresa.deleted_at)} />
        </div>
      </div>

      {grupoEmpresa.grupos.map((grupo) => (
        <div
          key={grupo.id}
          className={`rounded-xl shadow-sm border-l-4 bg-card ${
            grupo.deleted_at
              ? "border-red-500"
              : "border-emerald-500"
          }`}
        >
          <div
            className="flex justify-between items-center p-5 cursor-pointer"
            onClick={() => toggleExpand(grupo.id)}
          >
            <div>
              <h3 className="font-semibold">{grupo.descricao}</h3>
              <p className="text-xs text-muted-foreground">
                Versão {grupo.versao}
              </p>
            </div>

            {expandedGroups.has(grupo.id) ? (
              <ChevronUp />
            ) : (
              <ChevronDown />
            )}
          </div>

          {expandedGroups.has(grupo.id) && (
            <div className="px-5 pb-5">
              {grupo.usuarios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {grupo.usuarios.map((usuario) => (
                    <UsuarioCard
                      key={usuario.id}
                      usuario={usuario}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhum usuário nesse grupo.
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
