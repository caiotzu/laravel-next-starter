import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  user: any;
}

export function PerfilTabContent({ user }: Props) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Informações Pessoais</CardTitle>
      </CardHeader>

      <CardContent className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Nome</p>
          <p className="font-medium">{user.nome}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Grupo</p>
          <p className="font-medium">{user.grupo}</p>
        </div>
      </CardContent>
    </Card>
  );
}
