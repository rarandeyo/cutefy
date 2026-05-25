import { headers } from "next/headers";
import { LoginSection } from "@/features/auth/components/LoginSection";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  return <LoginSection isLoggedIn={!!session} />;
}
