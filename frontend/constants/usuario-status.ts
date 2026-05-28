export const USUARIO_STATUS = {
  convidado: "Convidado",
  ativo: "Ativo",
  expirado: "Expirado",
  inativo: "Inativo",
  bloqueado: "Bloqueado",
} as const;

export type UsuarioStatus =
  keyof typeof USUARIO_STATUS;

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