"use client";

import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
  ShieldCheck,
  ShieldOff,
  Loader2,
  Lock,
  Check,
  Monitor,
  LogOut,
  Eye, 
  EyeOff
} from "lucide-react";
import { useForm } from "react-hook-form";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { formatDate } from "@/lib/utils";

import { useAtualizarPerfil } from "../hooks/useAtualizarPerfil";
import { useAtualizarSenhaPerfil } from "../hooks/useAtualizarSenha";
import {
  useHabilitar2FA,
  useConfirmar2FA,
  useDesabilitar2FA,
} from "../hooks/useAutenticacaoDoisFatores";
import { useEncerrarSessao } from "../hooks/useEncerrarSessao";
import { useUsuarioSessoes } from "../hooks/useUsuarioSessoes";
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

  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showSenhaNova, setShowSenhaNova] = useState(false);
  const [showSenhaConfirmacao, setShowSenhaConfirmacao] = useState(false);

  const [senhaHabilitar, setSenhaHabilitar] = useState("");
  const [senhaDesabilitar, setSenhaDesabilitar] = useState("");
  const [codigo, setCodigo] = useState("");

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const [habilitarErrors, setHabilitarErrors] = useState<string[] | null>(null);
  const [desabilitarErrors, setDesabilitarErrors] = useState<string[] | null>(null);

  const habilitarMutation = useHabilitar2FA();
  const confirmarMutation = useConfirmar2FA();
  const desabilitarMutation = useDesabilitar2FA();

  /* ---------------- SESSÕES ---------------- */

  const {
    data: sessoes,
    isLoading: loadingSessoes,
    isError: erroSessoes,
  } = useUsuarioSessoes();

  const encerrarSessaoMutation = useEncerrarSessao();

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
        setShowSenhaAtual(false);
        setShowSenhaNova(false);
        setShowSenhaConfirmacao(false);
      },
      onError: (error: AxiosError<ApiErrorResponse>) => {
        const apiErrors = error.response?.data?.errors;

        if (!apiErrors) {
          setHabilitarErrors(["Erro ao atualizar senha."]);
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
        <Check size={16} className={valido ? "text-green-500" : "text-gray-400"} />
        <span className={valido ? "text-green-600" : "text-gray-500"}>
          {texto}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">

      {/* COLUNA ESQUERDA */}
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
              <Button variant="destructive" onClick={() => setOpenDesabilitar(true)}>
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
              <Field>
                <InputGroup>
                  <InputGroupInput
                    type={showSenhaAtual ? "text" : "password"}
                    placeholder="Senha atual" 
                    {...register("senha_atual")} 
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label="visualizar"
                      title="visualizar"
                      size="icon-xs"
                      onClick={() => setShowSenhaAtual(prev => !prev)}
                    >
                      {showSenhaAtual ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {errors.senha_atual && (
                  <p className="text-sm text-red-500">{errors.senha_atual.message}</p>
                )}
              </Field>

              <div>
                <Field>
                  <InputGroup>
                    <InputGroupInput
                      type={showSenhaNova ? "text" : "password"}
                      placeholder="Nova senha" 
                      {...register("senha_nova")} 
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        aria-label="visualizar"
                        title="visualizar"
                        size="icon-xs"
                        onClick={() => setShowSenhaNova(prev => !prev)}
                      >
                        {showSenhaNova ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

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

              <Field>
                <InputGroup>
                  <InputGroupInput
                    type={showSenhaConfirmacao ? "text" : "password"}
                    placeholder="Confirmar nova senha" 
                    {...register("senha_nova_confirma")} 
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label="Confirmar nova senha"
                      title="Confirmar nova senha"
                      size="icon-xs"
                      onClick={() => setShowSenhaConfirmacao(prev => !prev)}
                    >
                      {showSenhaConfirmacao ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
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

      {/* COLUNA DIREITA */}
      <div className="col-span-12 md:col-span-4">
        <Card className="rounded-2xl h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor size={18} />
              Sessões
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {loadingSessoes && (
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}

            {erroSessoes && (
              <p className="text-sm text-red-500">
                Erro ao carregar sessões.
              </p>
            )}

            {!loadingSessoes && sessoes?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma sessão ativa encontrada.
              </p>
            )}

            {sessoes?.map((sessao) => (
              <div
                key={sessao.id}
                className="flex items-center justify-between border rounded-xl p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {sessao.dispositivo ? sessao.dispositivo : "---"}
                    {sessao.plataforma ? ` - ${sessao.plataforma}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {sessao.id} <br />
                    IP: {sessao.ip} <br />
                    Navegador: {sessao.browser} <br />
                    Ultimo Acesso: {formatDate(sessao.ultimo_acesso_em)} <br />
                  </p>
                  {sessao.atual && (
                    <Badge className="bg-emerald-100 text-emerald-700">Sessão atual</Badge>
                  )}
                </div>

                {!sessao.atual && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      encerrarSessaoMutation.mutate(sessao.id, {
                        onSuccess: () =>
                          toast.success("Sessão encerrada com sucesso!"),
                      })
                    }
                    disabled={encerrarSessaoMutation.isPending}
                  >
                    {encerrarSessaoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut size={14} />
                    )}
                  </Button>
                )}
              </div>
            ))}

          </CardContent>
        </Card>
      </div>

      {/* DIALOGS COMPLETOS */}

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