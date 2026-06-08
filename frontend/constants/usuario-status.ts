export const USUARIO_STATUS = {
  convidado: "Convidado",
  ativo: "Ativo",
  expirado: "Expirado",
  inativo: "Inativo",
  bloqueado: "Bloqueado",
} as const;

export type UsuarioStatus =
  keyof typeof USUARIO_STATUS;

  export const USUARIO_STATUS_CLASS_TEXT:
  Record<UsuarioStatus, string> = {
    convidado: "text-amber-700",
    ativo: "text-emerald-700",
    expirado: "text-orange-700",
    inativo: "text-zinc-700",
    bloqueado: "text-red-700",
  };

export const USUARIO_STATUS_BORDER:
  Record<UsuarioStatus, string> = {
    convidado: "border-amber-500",
    ativo: "border-emerald-500",
    expirado: "border-orange-500",
    inativo: "border-zinc-500",
    bloqueado: "border-red-500",
  };

export const USUARIO_STATUS_CLASSNAME:
  Record<UsuarioStatus, string> = {
    convidado: "bg-amber-100 text-amber-700",
    ativo: "bg-emerald-100 text-emerald-700",
    expirado: "bg-orange-100 text-orange-700",
    inativo: "bg-zinc-100 text-zinc-700",
    bloqueado: "bg-red-100 text-red-700",
  };

export const USUARIO_STATUS_OPTIONS =
  Object.entries(USUARIO_STATUS).map(
    ([value, label]) => ({
      value: value as UsuarioStatus,
      label,
    })
  );

export function getUsuarioStatusLabel(
  status: UsuarioStatus
): string {
  return USUARIO_STATUS[status];
}

export function getUsuarioStatusClassName(
  status: UsuarioStatus
): string {
  return USUARIO_STATUS_CLASSNAME[
    status
  ];
}

export function getUsuarioStatusBorder(
  status: UsuarioStatus
): string {
  return USUARIO_STATUS_BORDER[
    status
  ];
}

export function getUsuarioStatusClassText(
  status: UsuarioStatus
): string {
  return USUARIO_STATUS_CLASS_TEXT[
    status
  ];
}