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
    convidado: "text-amber-700 dark:text-amber-400",
    ativo: "text-emerald-700 dark:text-emerald-400",
    expirado: "text-orange-700 dark:text-orange-400",
    inativo: "text-zinc-700 dark:text-zinc-400",
    bloqueado: "text-red-700 dark:text-red-400",
  };

export const USUARIO_STATUS_BORDER:
  Record<UsuarioStatus, string> = {
    convidado: "border-amber-500 dark:border-amber-900/60",
    ativo: "border-emerald-500 dark:border-emerald-900/60",
    expirado: "border-orange-500 dark:border-orange-900/60",
    inativo: "border-zinc-500 dark:border-zinc-900/60",
    bloqueado: "border-red-500 dark:border-red-900/60",
  };

export const USUARIO_STATUS_CLASSNAME:
  Record<UsuarioStatus, string> = {
    convidado: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
    ativo: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
    expirado: "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400",
    inativo: "bg-zinc-100 dark:bg-zinc-950/30 text-zinc-700 dark:text-zinc-400",
    bloqueado: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
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