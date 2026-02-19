"use client";

import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { ShieldCheck, ShieldOff, Loader2, Lock, Check, Monitor } from "lucide-react";
import { useForm } from "react-hook-form";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { useAtualizarPerfil } from "../hooks/useAtualizarPerfil";
import { useAtualizarSenhaPerfil } from "../hooks/useAtualizarSenha";
import {
  useHabilitar2FA,
  useConfirmar2FA,
  useDesabilitar2FA,
} from "../hooks/useAutenticacaoDoisFatores";
import {
  atualizarSenhaSchema,
  AtualizarSenhaFormData,
} from "../schemas/usuarioPerfil.schema";

interface SegurancaTabContentProps {
  twoFactorEnabled: boolean;
}

export function SegurancaTabContent({
  twoFactorEnabled,
}: SegurancaTabContentProps) {

  /* ---------------- LOCAL STATE 2FA ---------------- */

  const [is2FAEnabled, setIs2FAEnabled] = useState(twoFactorEnabled);

  useEffect(() => {
    setIs2FAEnabled(twoFactorEnabled);
  }, [twoFactorEnabled]);

  const [openHabilitar, setOpenHabilitar] = useState(false);
  const [openDesabilitar, setOpenDesabilitar] = useState(false);

  const [senhaHabilitar, setSenhaHabilitar] = useState("");
  const [senhaDesabilitar, setSenhaDesabilitar] = useState("");
  const [codigo, setCodigo] = useState("");

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const [habilitarErrors, setHabilitarErrors] = useState<string[] | null>(null);
  const [desabilitarErrors, setDesabilitarErrors] = useState<string[] | null>(null);

  const habilitarMutation = useHabilitar2FA();
  const confirmarMutation = useConfirmar2FA();
  const desabilitarMutation = useDesabilitar2FA();

  /* ---------------- ALTERAR SENHA ---------------- */

  const atualizarSenhaMutation = useAtualizarSenhaPerfil();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AtualizarSenhaFormData>({
    resolver: zodResolver(atualizarSenhaSchema),
  });

  const senhaNova = watch("senha_nova") || "";

  const requisitos = useMemo(
    () => ({
      length: senhaNova.length >= 8,
      upper: /[A-Z]/.test(senhaNova),
      lower: /[a-z]/.test(senhaNova),
      number: /[0-9]/.test(senhaNova),
      special: /[^A-Za-z0-9]/.test(senhaNova),
    }),
    [senhaNova]
  );

  const todosValidos = Object.values(requisitos).every(Boolean);

  function onSubmitSenha(data: AtualizarSenhaFormData) {
    atualizarSenhaMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Senha atualizada com sucesso!");
        reset();
      },
      onError: (error: AxiosError<ApiErrorResponse>) => {
        const apiErrors = error.response?.data?.errors;

        if (!apiErrors) {
          setHabilitarErrors(["Erro ao habilitar 2FA."]);
          return;
        }

        if (apiErrors.business) {
          setHabilitarErrors(apiErrors.business);
        }
      },
    });
  }

  /* ---------------- RESET ---------------- */

  function resetHabilitarState() {
    setSenhaHabilitar("");
    setCodigo("");
    setQrCodeUrl(null);
    setHabilitarErrors(null);
  }

  function resetDesabilitarState() {
    setSenhaDesabilitar("");
    setCodigo("");
    setDesabilitarErrors(null);
  }

  /* ---------------- HABILITAR ---------------- */

  function handleHabilitar() {
    setHabilitarErrors(null);

    habilitarMutation.mutate(
      { senha: senhaHabilitar },
      {
        onSuccess: (data) => {
          setQrCodeUrl(data.otpauth_url);
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
          const apiErrors = error.response?.data?.errors;

          if (!apiErrors) {
            setHabilitarErrors(["Erro ao habilitar 2FA."]);
            return;
          }

          if (apiErrors.business) {
            setHabilitarErrors(apiErrors.business);
          }
        },
      }
    );
  }

  function handleConfirmar() {
    setHabilitarErrors(null);

    confirmarMutation.mutate(
      { codigo },
      {
        onSuccess: () => {
          toast.success("2FA ativado com sucesso!");
          setIs2FAEnabled(true);
          setOpenHabilitar(false);
          resetHabilitarState();
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
          const apiErrors = error.response?.data?.errors;

          if (!apiErrors) {
            setHabilitarErrors(["Código inválido."]);
            return;
          }

          if (apiErrors.business) {
            setHabilitarErrors(apiErrors.business);
          }
        },
      }
    );
  }

  /* ---------------- DESABILITAR ---------------- */

  function handleDesabilitar() {
    setDesabilitarErrors(null);

    desabilitarMutation.mutate(
      { senha: senhaDesabilitar, codigo },
      {
        onSuccess: () => {
          toast.success("2FA desabilitado com sucesso!");
          setIs2FAEnabled(false);
          setOpenDesabilitar(false);
          resetDesabilitarState();
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
          const apiErrors = error.response?.data?.errors;

          if (!apiErrors) {
            setDesabilitarErrors(["Erro ao desabilitar 2FA."]);
            return;
          }

          if (apiErrors.business) {
            setDesabilitarErrors(apiErrors.business);
          }
        },
      }
    );
  }

  function Requisito({ valido, texto }: { valido: boolean; texto: string }) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Check
          size={16}
          className={valido ? "text-green-500" : "text-gray-400"}
        />
        <span className={valido ? "text-green-600" : "text-gray-500"}>
          {texto}
        </span>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="grid grid-cols-12 gap-6">

      {/* ================= COLUNA ESQUERDA ================= */}
      <div className="col-span-12 md:col-span-8 space-y-6">

        {/* 2FA */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck size={18} />
              Autenticação em Dois Fatores
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {!is2FAEnabled ? (
              <Button onClick={() => setOpenHabilitar(true)}>
                Habilitar 2FA
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => setOpenDesabilitar(true)}
              >
                <ShieldOff size={16} />
                Desabilitar 2FA
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ALTERAR SENHA */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={18} />
              Alterar Senha
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmitSenha)} className="space-y-4">
              <Input type="password" placeholder="Senha atual" {...register("senha_atual")} />
              {errors.senha_atual && (
                <p className="text-sm text-red-500">{errors.senha_atual.message}</p>
              )}

              <div>
                <Input type="password" placeholder="Nova senha" {...register("senha_nova")} />

                <div className="mt-3 space-y-1">
                  <Requisito valido={requisitos.length} texto="Mínimo 8 caracteres" />
                  <Requisito valido={requisitos.upper} texto="Letra maiúscula" />
                  <Requisito valido={requisitos.lower} texto="Letra minúscula" />
                  <Requisito valido={requisitos.number} texto="Número" />
                  <Requisito valido={requisitos.special} texto="Caractere especial" />
                </div>

                {errors.senha_nova && (
                  <p className="text-sm text-red-500 mt-1">{errors.senha_nova.message}</p>
                )}
              </div>

              <Input
                type="password"
                placeholder="Confirmar nova senha"
                {...register("senha_nova_confirma")}
              />
              {errors.senha_nova_confirma && (
                <p className="text-sm text-red-500">
                  {errors.senha_nova_confirma.message}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!todosValidos || atualizarSenhaMutation.isPending}
              >
                {atualizarSenhaMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Atualizar Senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ================= COLUNA DIREITA ================= */}
      <div className="col-span-12 md:col-span-4">
        <Card className="rounded-2xl h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor size={18} />
              Sessões
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em breve será possível visualizar e encerrar sessões ativas.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ================= DIALOGS (INALTERADOS) ================= */}
      {/* -------- HABILITAR -------- */}
      <Dialog
        open={openHabilitar}
        onOpenChange={(open) => {
          setOpenHabilitar(open);
          if (!open) resetHabilitarState();
        }}
      >
        <DialogContent className="space-y-6">
          <DialogHeader>
            <DialogTitle>Habilitar 2FA</DialogTitle>
          </DialogHeader>

          {habilitarErrors && (
            <AppAlert
              variant="error"
              subtitle="Erro"
              messages={habilitarErrors}
              onClose={() => setHabilitarErrors(null)}
            />
          )}

          {!qrCodeUrl && (
            <>
              <Input
                type="password"
                placeholder="Digite sua senha"
                value={senhaHabilitar}
                onChange={(e) => setSenhaHabilitar(e.target.value)}
                disabled={habilitarMutation.isPending}
              />

              <Button
                onClick={handleHabilitar}
                className="w-full"
                disabled={!senhaHabilitar || habilitarMutation.isPending}
              >
                {habilitarMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Gerar QR Code
              </Button>
            </>
          )}

          {qrCodeUrl && (
            <div className="flex flex-col items-center space-y-6">
              <QRCode value={qrCodeUrl} size={180} />

              <div className="flex justify-center">
                <InputOTP maxLength={6} value={codigo} onChange={setCodigo}>
                  <InputOTPGroup>
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleConfirmar}
                className="w-full"
                disabled={codigo.length !== 6}
              >
                Confirmar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* -------- DESABILITAR -------- */}
      <Dialog
        open={openDesabilitar}
        onOpenChange={(open) => {
          setOpenDesabilitar(open);
          if (!open) resetDesabilitarState();
        }}
      >
        <DialogContent className="space-y-6">
          <DialogHeader>
            <DialogTitle>Desabilitar 2FA</DialogTitle>
          </DialogHeader>

          {desabilitarErrors && (
            <AppAlert
              variant="error"
              subtitle="Erro"
              messages={desabilitarErrors}
              onClose={() => setDesabilitarErrors(null)}
            />
          )}

          <Input
            type="password"
            placeholder="Digite sua senha"
            value={senhaDesabilitar}
            onChange={(e) => setSenhaDesabilitar(e.target.value)}
          />

          <div className="flex justify-center">
            <InputOTP maxLength={6} value={codigo} onChange={setCodigo}>
              <InputOTPGroup>
                {[...Array(6)].map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            variant="destructive"
            onClick={handleDesabilitar}
            className="w-full"
            disabled={!senhaDesabilitar || codigo.length !== 6}
          >
            Confirmar Desativação
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
