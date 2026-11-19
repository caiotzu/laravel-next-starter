import { listarProvedoresSociais } from "@/lib/social/handlers";

export const dynamic = "force-dynamic";

export async function GET() {
  return listarProvedoresSociais("admin");
}
