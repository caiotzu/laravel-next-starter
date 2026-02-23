"use client";

import { SenhaSection } from "./seguranca/SenhaSection";
import { SessoesSection } from "./seguranca/SessoesSection";
import { TwoFactorSection } from "./seguranca/TwoFactorSection";

interface SegurancaTabContentProps {
  twoFactorEnabled: boolean;
}

export function SegurancaTabContent({ twoFactorEnabled }: SegurancaTabContentProps) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-8 space-y-6">
        <TwoFactorSection twoFactorEnabled={twoFactorEnabled} />
        <SenhaSection />
      </div>

      <div className="col-span-12 md:col-span-4">
        <SessoesSection />
      </div>
    </div>
  );
}
