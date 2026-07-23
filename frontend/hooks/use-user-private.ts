"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"

import { Usuario } from "@/domains/private/perfil/usuario/types/usuario.model";

export function useUserPrivate() {
  return useQuery<Usuario>({
    queryKey: ["userPrivate"],
    queryFn: async () => {
      const res = await axios.post('/api/proxy/private', {
        url: '/me',
        method: 'GET'
      });
      return res.data?.data.data ?? res.data;
    },
    staleTime: 1000 * 60 * 5, // cache por 5 minutos
    retry: false,
  })
}
