import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { LoginSection } from "@/components/LoginSection";

export default async function Page() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  return <LoginSection isLoggedIn={!!session} />;
}
