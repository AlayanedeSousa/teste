import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getSupabaseConfig } from "./config";

export async function updateSession(request) {
  let config;
  try {
    config = getSupabaseConfig();
  } catch {
    return NextResponse.next({ request });
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Verifica a sessão e propaga os cookies renovados. A página também autoriza no servidor.
  try {
    await supabase.auth.getUser();
  } catch {
    // Falhas de rede nunca concedem acesso à página protegida.
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
