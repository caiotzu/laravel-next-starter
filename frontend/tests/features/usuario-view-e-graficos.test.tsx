/**
 * TEST-005: UsuarioView (o "cartão" do usuário, Admin e Private) e os gráficos de evolução do
 * dashboard (estado vazio × com dados).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardEvolucaoChamadosChart } from "@/features/admin/dashboard/components/DashboardEvolucaoChamadosChart";
import { DashboardEvolucaoEmpresasChart } from "@/features/admin/dashboard/components/DashboardEvolucaoEmpresasChart";
import UsuarioViewAdmin from "@/features/admin/usuario/components/UsuarioView";
import UsuarioViewPrivate from "@/features/private/usuario/components/UsuarioView";

const usuario = {
  id: "u1",
  grupoId: "g1",
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  status: "ativo" as const,
  avatar: null,
  google2faEnable: true,
  google2faConfirmadoEm: "2026-03-10T15:30:00.000000Z",
  ultimoLoginEm: "2026-10-20T12:00:00.000000Z",
  ultimoIp: "203.0.113.7",
  createdAt: "2026-01-01",
  updatedAt: null,
  deletedAt: null,
  grupo: { id: "g1", descricao: "Financeiro" },
};

describe.each([
  ["Admin", UsuarioViewAdmin],
  ["Private", UsuarioViewPrivate],
] as const)("UsuarioView (%s)", (_nome, UsuarioView) => {
  it("mostra nome, e-mail, grupo, status, 2FA, último login e último IP", () => {
    render(<UsuarioView usuario={usuario as never} />);

    expect(screen.getByRole("heading", { name: "Maria Souza" })).toBeInTheDocument();
    expect(screen.getByText("maria@exemplo.com")).toBeInTheDocument();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("203.0.113.7")).toBeInTheDocument();

    // 2FA habilitado = Sim e datas formatadas (não "---")
    const rotulo2fa = screen.getByText("2FA habilitado");
    expect(rotulo2fa.parentElement).toHaveTextContent("Sim");
    expect(screen.getByText("Último login").parentElement).not.toHaveTextContent("---");
  });

  it("campos ausentes aparecem como '---' e 2FA desligado como 'Não'", () => {
    render(
      <UsuarioView
        usuario={{ ...usuario, grupo: undefined, google2faEnable: false, google2faConfirmadoEm: null, ultimoLoginEm: null, ultimoIp: null } as never}
      />
    );

    expect(screen.getByText("Grupo").parentElement).toHaveTextContent("---");
    expect(screen.getByText("2FA habilitado").parentElement).toHaveTextContent("Não");
    expect(screen.getByText("2FA habilitado em").parentElement).toHaveTextContent("---");
    expect(screen.getByText("Último login").parentElement).toHaveTextContent("---");
    expect(screen.getByText("Último IP").parentElement).toHaveTextContent("---");
  });

  it.each([
    ["convidado", "Convidado"],
    ["bloqueado", "Bloqueado"],
    ["inativo", "Inativo"],
  ] as const)("status %s é exibido como %s", (status, rotulo) => {
    render(<UsuarioView usuario={{ ...usuario, status } as never} />);

    expect(screen.getByText(rotulo)).toBeInTheDocument();
  });

  it("sem avatar mostra o ícone de usuário no lugar da foto", () => {
    const { container } = render(<UsuarioView usuario={usuario as never} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

describe("DashboardEvolucaoChamadosChart", () => {
  it("sem nenhum chamado no período mostra a mensagem de vazio", () => {
    render(<DashboardEvolucaoChamadosChart dados={[{ data: "2026-10-01", abertos: 0, fechados: 0 }]} />);

    expect(screen.getByText("Nenhum chamado no período selecionado.")).toBeInTheDocument();
  });

  it("lista vazia também mostra a mensagem de vazio", () => {
    render(<DashboardEvolucaoChamadosChart dados={[]} />);

    expect(screen.getByText("Nenhum chamado no período selecionado.")).toBeInTheDocument();
  });

  it("com dados mostra o cartão do gráfico e NÃO a mensagem de vazio", () => {
    const { container } = render(
      <DashboardEvolucaoChamadosChart
        dados={[
          { data: "2026-10-01", abertos: 3, fechados: 1 },
          { data: "2026-10-02", abertos: 0, fechados: 4 },
        ]}
      />
    );

    expect(screen.getByText("Evolução diária no período selecionado")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum chamado no período selecionado.")).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="chart"]')).not.toBeNull();
  });
});

describe("DashboardEvolucaoEmpresasChart", () => {
  it("sem nenhuma empresa nova mostra a mensagem de vazio", () => {
    render(<DashboardEvolucaoEmpresasChart dados={[{ data: "2026-10-01", novas: 0 }]} />);

    expect(screen.getByText("Evolução de empresas cadastradas")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma empresa cadastrada no período selecionado.")).toBeInTheDocument();
  });

  it("com dados mostra o gráfico e NÃO a mensagem de vazio", () => {
    const { container } = render(
      <DashboardEvolucaoEmpresasChart dados={[{ data: "2026-10-01", novas: 2 }, { data: "2026-10-02", novas: 0 }]} />
    );

    expect(screen.getByText("Novas empresas por dia no período selecionado")).toBeInTheDocument();
    expect(screen.queryByText("Nenhuma empresa cadastrada no período selecionado.")).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="chart"]')).not.toBeNull();
  });
});
