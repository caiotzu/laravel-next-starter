"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"

type UserPrivate = {
  id: number
  nome: string
  cpf: string
  email: string
  avatar?: string
}

export function useUserPrivate() {
  return useQuery<UserPrivate>({
    queryKey: ["userPrivate"],
    queryFn: async () => {
      const res = await axios.post('/api/proxy/private', {
        url: '/webrenave/despachante/me',
        method: 'GET'
      });
      return res.data?.data ?? res.data;
    },
    staleTime: 1000 * 60 * 5, // cache por 5 minutos
    retry: false,
  })
}
