"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";
import { LaravelApiResponse } from "@/types/laravel";

import {
  desvincularLoginSocial,
  iniciarVinculoLoginSocial,
  listarLoginSocial,
} from "../services/loginSocialService";
import { VinculoSocial } from "../types/loginSocial.model";
import { IniciarVinculoLoginSocialRequest } from "../types/loginSocial.requests";
import {
  DesvincularLoginSocialResponse,
  IniciarVinculoLoginSocialResponse,
} from "../types/loginSocial.response";

export const LOGIN_SOCIAL_QUERY_KEY = ["loginSocial"];

export function useLoginSocial() {
  return useQuery<LaravelApiResponse<VinculoSocial[]>, AxiosError<ApiErrorResponse>>({
    queryKey: LOGIN_SOCIAL_QUERY_KEY,
    queryFn: listarLoginSocial,
  });
}

export function useIniciarVinculoLoginSocial() {
  return useMutation<
    IniciarVinculoLoginSocialResponse,
    AxiosError<ApiErrorResponse>,
    IniciarVinculoLoginSocialRequest
  >({
    mutationFn: iniciarVinculoLoginSocial,
  });
}

export function useDesvincularLoginSocial() {
  const queryClient = useQueryClient();

  return useMutation<DesvincularLoginSocialResponse, AxiosError<ApiErrorResponse>, string>({
    mutationFn: desvincularLoginSocial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOGIN_SOCIAL_QUERY_KEY });
    },
  });
}
