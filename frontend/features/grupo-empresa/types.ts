import { LaravelPagination } from "@/types/laravel";

// model
    export interface GrupoEmpresa {
        id: string;
        nome: string;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
    }
//---

// cadastrar
    export interface CadastrarGrupoEmpresaRequest {
        nome: string;
    }

    export interface CadastrarGrupoEmpresaResponse {
        id: string;
        nome: string;
        created_at: string;
        updated_at: string;
    }
//---

// listar
    export interface ListarGrupoEmpresasRequest {
        id?: string;
        nome?: string;
        porPagina?: number;
        page?: number;
    }

    export type ListarGrupoEmpresasResponse = LaravelPagination<GrupoEmpresa>;
//---


