"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"

import { Usuario } from "@/types/usuario.model";

export function useUserAdmin() {
  return useQuery<Usuario>({
    queryKey: ["userAdmin"],
    queryFn: async () => {
      const res = await axios.post('/api/proxy/admin', {
        url: '/admin/me',
        method: 'GET'
      });
      return res.data?.data ?? res.data;
    },
    staleTime: 1000 * 60 * 5, // cache por 5 minutos
    retry: false,
  })
}

