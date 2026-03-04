export const ESTADOS = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
} as const

export type UF = keyof typeof ESTADOS

export const ESTADOS_OPTIONS = Object.entries(ESTADOS).map(
  ([sigla, nome]) => ({
    value: sigla as UF,
    label: `${sigla} - ${nome}`,
  })
)

export const ESTADOS_LABELS = ESTADOS_OPTIONS.map(
  (e) => e.label
)

export const ESTADOS_MAP = new Map(
  ESTADOS_OPTIONS.map((e) => [e.label, e.value])
)

export function getNomeEstado(uf: UF): string {
  return ESTADOS[uf]
}

export function getLabelByUF(uf: UF): string {
  return `${uf} - ${ESTADOS[uf]}`
}