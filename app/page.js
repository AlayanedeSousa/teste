import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import AccountMenu from "./components/account-menu";
import TextAnalyzer from "./components/text-analyzer";

export const dynamic = "force-dynamic";

export default async function Home() {
  let user;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    // Sem sessão validada, o conteúdo protegido nunca é renderizado.
  }
  if (!user) redirect("/login");
  return (
    <main className="page">
      <AccountMenu email={user.email} />
      <TextAnalyzer />
    </main>
  );
}
