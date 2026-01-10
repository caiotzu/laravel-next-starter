"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"

type UserAdmin = {
  id: number
  nome: string
  cpf: string
  email: string
  avatar?: string
}

export function useUserAdmin() {
  return useQuery<UserAdmin>({
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
