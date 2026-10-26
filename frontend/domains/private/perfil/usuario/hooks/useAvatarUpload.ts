"use client";

import { ChangeEvent, useEffect, useRef } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { useSyncedState } from "@/hooks/use-synced-state";


import { atualizarAvatar } from "../services/usuarioService";
import { Usuario } from "../types/usuario.model";
import { AtualizarAvatarRequest } from "../types/usuario.requests";
import { AtualizarAvatarResponse } from "../types/usuario.responses";

import { extrairAvatar } from "@/lib/extrair-avatar";

export function useAvatarUpload(initialAvatar: string | null) {
  // Acompanha o avatar vindo do servidor; o upload atualiza localmente quando a imagem nova carrega.
  const [avatar, setAvatar] = useSyncedState<string | null>(initialAvatar);

  const previousAvatarRef = useRef<string | null>(initialAvatar);
  const previewUrlRef = useRef<string | null>(null);

  const queryClient = useQueryClient();

  // Mantém a referência do avatar anterior em dia caso venha atualização externa
  useEffect(() => {
    previousAvatarRef.current = initialAvatar;
  }, [initialAvatar]);

  const mutation = useMutation<
    AtualizarAvatarResponse,
    AxiosError<ApiErrorResponse>,
    AtualizarAvatarRequest
  >({
    mutationFn: atualizarAvatar,

    onSuccess: (response) => {
      // O backend devolve o usuário embrulhado em `data`; `extrairAvatar` lida com o formato real.
      const newAvatar = extrairAvatar(response);

      if (!newAvatar) {
        // Sem avatar utilizável na resposta: busca o usuário de novo para a sidebar não ficar defasada.
        queryClient.invalidateQueries({ queryKey: ["userPrivate"] });
        toast.success("Avatar atualizado com sucesso.");
        return;
      }

      // Atualiza o cache global (alimenta a foto da sidebar) IMEDIATAMENTE: não pode depender
      // de a imagem carregar no navegador.
      queryClient.setQueryData<Usuario>(
        ["userPrivate"],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            avatar: newAvatar,
          };
        }
      );

      toast.success("Avatar atualizado com sucesso.");

      const loadedImage = new window.Image();

      loadedImage.onload = () => {
        // Troca o preview local pela imagem definitiva só quando ela estiver carregada
        setAvatar(newAvatar);
        previousAvatarRef.current = newAvatar;

        // Limpa preview temporário
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
      };

      loadedImage.onerror = () => {
        // Mantém o preview atual para evitar imagem quebrada.
      };

      loadedImage.src = `${newAvatar}${newAvatar.includes("?") ? "&" : "?"}v=${Date.now()}`;
    },

    onError: (error) => {
      // Reverte para avatar anterior
      setAvatar(previousAvatarRef.current);

      // Limpa preview temporário
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      toast.error(
        error.response?.data?.errors?.business ??
          "Erro ao atualizar avatar."
      );
    },
  });

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (!reader.result) {
          reject("Erro ao converter imagem");
          return;
        }

        const base64 = reader.result.toString().split(",")[1];
        resolve(base64);
      };

      reader.onerror = (error) => reject(error);

      reader.readAsDataURL(file);
    });

  const handleAvatarChange = async (
    e: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];

    // Guarda avatar atual antes da tentativa
    previousAvatarRef.current = avatar;

    // Preview temporário
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setAvatar(previewUrl);

    try {
      const base64 = await convertToBase64(file);
      mutation.mutate({ avatar: base64 });
    } catch {
      setAvatar(previousAvatarRef.current);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      toast.error("Erro ao processar imagem.");
    }
  };

  return {
    avatar,
    handleAvatarChange,
    uploading: mutation.isPending,
  };
}
