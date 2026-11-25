import { iniciarVinculoSocial } from "@/lib/social/handlers";

export async function POST(req: Request, ctx: { params: Promise<{ provedor: string }> }) {
  const { provedor } = await ctx.params;

  return iniciarVinculoSocial(req, "admin", provedor);
}
