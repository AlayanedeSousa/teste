import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getSupabaseConfig } from "../../lib/supabase/config";
import { content } from "../content";
import LoginForm from "./login-form";

export const metadata = { title: `Entrar | ${content.siteTitle}` };

export default async function LoginPage({ searchParams }) {
  let configurationError;
  let user;
  try {
    getSupabaseConfig();
  } catch {
    configurationError = "O login ainda não foi configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente e publique novamente.";
  }
  if (!configurationError) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      // O formulário informa falhas de conexão na tentativa de entrar.
    }
  }
  if (user) redirect("/");
  const params = await searchParams;
  const confirmationError = params.error === "confirmation"
    ? "Não foi possível confirmar seu e-mail. O link pode ter expirado ou já ter sido usado. Tente entrar ou solicite um novo cadastro."
    : undefined;
  return (
    <main className="page login-page">
      <header className="intro">
        <h1>{content.title}</h1>
        <p>Entre ou crie sua conta para usar o corretor.</p>
      </header>
      <LoginForm configurationError={configurationError} confirmationError={confirmationError} />
    </main>
  );
}
