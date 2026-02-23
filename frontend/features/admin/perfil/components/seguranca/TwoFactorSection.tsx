"use client";

import { useEffect, useState } from "react";

import { AxiosError } from "axios";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import {
  useConfirmar2FA,
  useDesabilitar2FA,
  useHabilitar2FA,
} from "@/domain/admin/perfil/hooks/useAutenticacaoDoisFatores";

interface TwoFactorSectionProps {
  twoFactorEnabled: boolean;
}

export function TwoFactorSection({ twoFactorEnabled }: TwoFactorSectionProps) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(twoFactorEnabled);

  const [openHabilitar, setOpenHabilitar] = useState(false);
  const [openDesabilitar, setOpenDesabilitar] = useState(false);

  const [senhaHabilitar, setSenhaHabilitar] = useState("");
  const [senhaDesabilitar, setSenhaDesabilitar] = useState("");
  const [codigoHabilitar, setCodigoHabilitar] = useState("");
  const [codigoDesabilitar, setCodigoDesabilitar] = useState("");

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [habilitarErrors, setHabilitarErrors] = useState<string[] | null>(null);
  const [desabilitarErrors, setDesabilitarErrors] = useState<string[] | null>(null);

  const habilitarMutation = useHabilitar2FA();
  const confirmarMutation = useConfirmar2FA();
  const desabilitarMutation = useDesabilitar2FA();

  useEffect(() => {
    setIs2FAEnabled(twoFactorEnabled);
  }, [twoFactorEnabled]);

  function resetHabilitarState() {
    setSenhaHabilitar("");
    setCodigoHabilitar("");
    setQrCodeUrl(null);
    setHabilitarErrors(null);
  }

  function resetDesabilitarState() {
    setSenhaDesabilitar("");
    setCodigoDesabilitar("");
    setDesabilitarErrors(null);
  }

  function handleHabilitar() {
    setHabilitarErrors(null);

    habilitarMutation.mutate(
      { senha: senhaHabilitar },
      {
        onSuccess: (data) => setQrCodeUrl(data.otpauth_url),
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
      { codigo: codigoHabilitar },
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

  function handleDesabilitar() {
    setDesabilitarErrors(null);

    desabilitarMutation.mutate(
      { senha: senhaDesabilitar, codigo: codigoDesabilitar },
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

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={18} />
            Autenticação em Dois Fatores
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!is2FAEnabled ? (
            <Button onClick={() => setOpenHabilitar(true)}>Habilitar 2FA</Button>
          ) : (
            <Button variant="destructive" onClick={() => setOpenDesabilitar(true)}>
              <ShieldOff size={16} />
              Desabilitar 2FA
            </Button>
          )}
        </CardContent>
      </Card>

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
                {habilitarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar QR Code
              </Button>
            </>
          )}

          {qrCodeUrl && (
            <div className="flex flex-col items-center space-y-6">
              <QRCode value={qrCodeUrl} size={180} />

              <div className="flex justify-center">
                <InputOTP maxLength={6} value={codigoHabilitar} onChange={setCodigoHabilitar}>
                  <InputOTPGroup>
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button onClick={handleConfirmar} className="w-full" disabled={codigoHabilitar.length !== 6}>
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
            <InputOTP maxLength={6} value={codigoDesabilitar} onChange={setCodigoDesabilitar}>
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
            disabled={!senhaDesabilitar || codigoDesabilitar.length !== 6}
          >
            Confirmar Desativação
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
