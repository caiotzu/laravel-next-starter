import { LogIn } from "lucide-react"

/**
 * Ícones de marca por provedor de login social (tela de login e aba do perfil). Para um provedor
 * novo, nada é obrigatório aqui: sem ícone cadastrado, usa o genérico. SVG inline: a CSP não
 * permite imagens de hosts externos.
 */
const ICONES: Record<string, () => React.JSX.Element> = {
  google: () => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.29v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.29a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.6l4 3.1C6.23 6.87 8.88 4.76 12 4.76Z" />
    </svg>
  ),
}

export function IconeProvedorSocial({ chave }: { chave: string }) {
  const Icone = ICONES[chave]

  return Icone ? <Icone /> : <LogIn className="h-4 w-4" />
}
