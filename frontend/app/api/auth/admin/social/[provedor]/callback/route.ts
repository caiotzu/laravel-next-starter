import { concluirLoginSocial } from "@/lib/social/handlers";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ provedor: string }> }) {
  const { provedor } = await ctx.params;

  return concluirLoginSocial(req, "admin", provedor);
}
