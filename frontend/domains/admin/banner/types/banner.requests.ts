import { BannerDirecionamentoTipo, BannerEntidadeTipo, BannerStatus } from "./banner.model";

export interface BannerImagemCadastroRequest {
  nome: string;
  conteudo: string; // base64, sem o prefixo "data:...;base64,"
}

/**
 * Item de imagem na atualização: `id` presente = imagem existente mantida
 * (a `ordem` é a posição na lista). `id` ausente = imagem nova, precisa de
 * `nome` + `conteudo` em base64. Ver BannerImagemAtualizacaoDTO no backend.
 */
export interface BannerImagemAtualizacaoRequest {
  id?: string;
  nome?: string;
  conteudo?: string;
}

export interface BannerLinkRequest {
  id?: string;
  nome: string;
  url: string;
}

export interface BannerDirecionamentoRequest {
  tipo: BannerDirecionamentoTipo;
  entidade_tipo?: BannerEntidadeTipo;
}

export interface CadastrarBannerRequest {
  titulo: string;
  conteudo?: string;
  inicio_em: string;
  fim_em?: string;
  direcionamento: BannerDirecionamentoRequest;
  imagens: BannerImagemCadastroRequest[];
  links: BannerLinkRequest[];
}

export interface AtualizarBannerRequest {
  titulo: string;
  conteudo?: string;
  inicio_em: string;
  fim_em?: string;
  direcionamento: BannerDirecionamentoRequest;
  imagens: BannerImagemAtualizacaoRequest[];
  links: BannerLinkRequest[];
}

export interface ListarBannersRequest {
  titulo?: string;
  status?: BannerStatus;
  page?: number;
  por_pagina?: number;
}
