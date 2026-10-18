import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return new NextResponse(null, {
          status: 303,
          headers: { Location: "/", "Cache-Control": "private, no-store" },
        });
      }
    } catch {
      // A página de login apresenta uma mensagem em português.
    }
  }
  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/login?error=confirmation", "Cache-Control": "private, no-store" },
  });
}
