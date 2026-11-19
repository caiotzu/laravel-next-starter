import { iniciarLoginSocial } from "@/lib/social/handlers";

export async function POST(req: Request, ctx: { params: Promise<{ provedor: string }> }) {
  const { provedor } = await ctx.params;

  return iniciarLoginSocial(req, "admin", provedor);
}
