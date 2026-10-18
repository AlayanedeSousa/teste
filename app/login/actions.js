"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { authErrorMessage } from "../../lib/auth-errors";

export async function authenticate(previousState, formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const intent = formData.get("intent");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Digite um endereço de e-mail válido." };
  }
  if (!password) return { error: "Digite sua senha." };
  if (intent !== "signin" && intent !== "signup") return { error: "Escolha Entrar ou Criar conta." };
  if (intent === "signup" && password.length < 6) return { error: "A senha deve ter pelo menos 6 caracteres." };

  try {
    const supabase = await createClient();
    if (intent === "signup") {
      const origin = (await headers()).get("origin");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: origin ? { emailRedirectTo: `${new URL(origin).origin}/auth/callback` } : {},
      });
      if (error) return { error: authErrorMessage(error) };
      if (!data.session) {
        return { message: "Confira seu e-mail para confirmar o cadastro. Depois volte aqui para entrar. Se já tiver uma conta, use Entrar." };
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: authErrorMessage(error) };
    }
  } catch {
    return { error: "Não foi possível acessar o serviço de login. Tente novamente em instantes." };
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { error: "Não foi possível sair. Tente novamente." };
  } catch {
    return { error: "Não foi possível sair. Verifique sua conexão e tente novamente." };
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
