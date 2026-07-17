// EmpresaFormView.tsx
"use client";

import { Building2, Mail, MapPin, Phone } from "lucide-react";

import { Info } from "@/components/common/Info";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { getEmpresaContatoTipoLabel } from "@/constants/empresa-contato-tipos";
import { getEmpresaEnderecoTipoLabel } from "@/constants/empresa-endereco-tipos";
import { getEmpresaStatusBorder, getEmpresaStatusLabel } from "@/constants/empresa-status";
import { Empresa } from "@/domains/admin/empresa/types/empresa.model";
import { formatDate, maskCNPJAlfanumerico, maskCEP, maskPhone } from "@/lib/utils";

interface Props {
  empresa: Empresa;
}

export function EmpresaFormView({ empresa }: Props) {
  return (
    <div className="space-y-6">
      <div className={`rounded-xl shadow-sm border-l-4 bg-card p-6 ${empresa.deletedAt ? 'border-red-500' : getEmpresaStatusBorder(empresa.status)}`}>
        <div className="flex flex-col md:flex-row gap-8">
          <Avatar className="h-28 w-28">
            <AvatarFallback><Building2 className="h-12 w-12"/></AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-3xl font-semibold">{empresa.nomeFantasia}</h2>
              <p className="text-muted-foreground">{empresa.razaoSocial}</p>
              <p className="text-sm text-muted-foreground mt-1">{maskCNPJAlfanumerico(empresa.cnpj)}</p>
            </div>

            <div className="flex flex-wrap gap-10">
              <Info label="Grupo" value={empresa.grupoEmpresa?.nome ?? "---"} />
              <Info label="Matriz" value={empresa.matriz?.nomeFantasia ?? "Empresa Matriz"} />
              <Info label="Status" value={getEmpresaStatusLabel(empresa.status)} />
              <Info label="UF" value={empresa.uf} />
              <Info label="Inscrição Estadual" value={empresa.inscricaoEstadual ?? "---"} />
              <Info label="Inscrição Municipal" value={empresa.inscricaoMunicipal ?? "---"} />
              <Info label="Criado em" value={formatDate(empresa.createdAt)} />
              <Info label="Atualizado em" value={formatDate(empresa.updatedAt)} />
              <Info label="Excluída em" value={formatDate(empresa.deletedAt)} />
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Phone className="h-5 w-5"/>Contatos</h3>

          <div className="grid grid-cols-12 gap-4">
            {!empresa.contatos || empresa.contatos.length === 0 ? (
              <div className="col-span-12">
                <p className="text-muted-foreground">
                  Nenhum contato cadastrado.
                </p>
              </div>
            ) : (
              empresa.contatos.map((contato) => (
                <div
                  key={contato.id}
                  className="col-span-12 md:col-span-4 rounded-lg border p-4"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {getEmpresaContatoTipoLabel(contato.tipo)}
                    </span>

                    <div className="flex gap-2">
                      {contato.principal && (<Badge className="bg-emerald-100 text-emerald-700">Principal</Badge>)}

                      {contato.ativo ? 
                        (<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>)
                        :
                        (<Badge className="bg-emerald-100 text-red-700 hover:bg-emerald-100">Inativo</Badge>)
                      }
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {contato.tipo === "E" ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}

                      <span>
                        {contato.tipo === "T"
                          ? maskPhone(contato.valor)
                          : contato.valor}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-8">
                      <Info
                        label="Status"
                        value={contato.ativo ? "Ativo" : "Inativo"}
                      />
                      <Info
                        label="Criado em"
                        value={formatDate(contato.createdAt)}
                      />
                      <Info
                        label="Atualizado em"
                        value={formatDate(contato.updatedAt)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><MapPin className="h-5 w-5"/>Endereços</h3>

          <div className="grid gap-4">
            {!empresa.enderecos || empresa.enderecos.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum endereço cadastrado.
              </p>
            ) : (
              <div className="space-y-4">
                {empresa.enderecos.map((endereco) => (
                  <div
                    key={endereco.id}
                    className="rounded-lg border p-5 shadow-sm"
                  >
                    <div className="mb-5 flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="text-base font-semibold">
                          {getEmpresaEnderecoTipoLabel(endereco.tipo)}
                        </h4>
                      </div>

                      <div className="flex gap-2">
                        {endereco.principal && (<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Principal</Badge>)}

                        {endereco.ativo ? 
                          (<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>)
                          :
                          (<Badge className="bg-emerald-100 text-red-700 hover:bg-emerald-100">Inativo</Badge>)
                        }
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-3">
                      <Info
                        label="CEP"
                        value={maskCEP(endereco.cep)}
                      />
                      <Info
                        label="Logradouro"
                        value={endereco.logradouro}
                      />
                      <Info
                        label="Número"
                        value={endereco.numero}
                      />
                      <Info
                        label="Complemento"
                        value={endereco.complemento || '---'}
                      />
                      <Info
                        label="Bairro"
                        value={endereco.bairro}
                      />
                      <Info
                        label="Município"
                        value={`${endereco.municipio?.nome} - ${endereco.municipio?.uf}`}
                      />
                    </div>

                    <div className="mt-5 border-t pt-4">
                      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                        <Info
                          label="Criado em"
                          value={formatDate(endereco.createdAt)}
                        />
                        <Info
                          label="Atualizado em"
                          value={formatDate(endereco.updatedAt)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
