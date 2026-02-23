"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";
import { Usuario } from "@/types/usuario.model";

import { atualizarAvatar } from "../services/usuarioService";
import { AtualizarAvatarRequest } from "../types/usuario.requests";
import { AtualizarAvatarResponse } from "../types/usuario.responses";

export function useAvatarUpload(initialAvatar: string | null) {
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);

  const previousAvatarRef = useRef<string | null>(initialAvatar);
  const previewUrlRef = useRef<string | null>(null);

  const queryClient = useQueryClient();

  // Mantém sincronizado caso venha atualização externa
  useEffect(() => {
    setAvatar(initialAvatar);
    previousAvatarRef.current = initialAvatar;
  }, [initialAvatar]);

  const mutation = useMutation<
    AtualizarAvatarResponse,
    AxiosError<ApiErrorResponse>,
    AtualizarAvatarRequest
  >({
    mutationFn: atualizarAvatar,

    onSuccess: (response) => {
      const usuarioAtualizado = response.data;
      const newAvatar = usuarioAtualizado.avatar;

      // Atualiza estado definitivo
      setAvatar(newAvatar);
      previousAvatarRef.current = newAvatar;

      // Atualiza cache global tipado
      queryClient.setQueryData<Usuario>(
        ["userAdmin"],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            avatar: newAvatar,
          };
        }
      );

      // Limpa preview temporário
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      toast.success("Avatar atualizado com sucesso.");
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
