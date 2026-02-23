import { Check } from "lucide-react";

interface RequisitoSenhaProps {
  valido: boolean;
  texto: string;
}

export function RequisitoSenha({ valido, texto }: RequisitoSenhaProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Check size={16} className={valido ? "text-green-500" : "text-gray-400"} />
      <span className={valido ? "text-green-600" : "text-gray-500"}>{texto}</span>
    </div>
  );
}
