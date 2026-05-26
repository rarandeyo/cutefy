import { headers } from "next/headers";
import type React from "react";
import { getAuth } from "@/shared/lib/auth/server";
import { LoginSection } from "@/features/auth/components/LoginSection";
import { generateParticles } from "@/features/auth/lib/particles";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.JSX.Element> {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const particles = generateParticles(14);

  return <LoginSection isLoggedIn={!!session} particles={particles} />;
}
