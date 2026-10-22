import Link from "next/link";
import { redirect } from "next/navigation";
import AccountMenu from "../components/account-menu";
import { createClient } from "../../lib/supabase/server";
import { formatHistoryDate } from "../../lib/history";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meu histórico | Analista de Texto" };
const pageSize = 20;

export default async function HistoryPage({ searchParams }) {
  let supabase;
  let user;
  try {
    supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    // Nunca consulte o histórico sem uma identidade validada no servidor.
  }
  if (!user) redirect("/login");

  const params = await searchParams;
  const requestedPage = Number(params.pagina || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  let rows = [];
  let total = 0;
  let failed = false;
  try {
    const { data, count, error } = await supabase
      .from("respostas")
      .select("id, entrada, resposta, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    rows = data || [];
    total = count || 0;
  } catch {
    failed = true;
  }

  return (
    <main className="page">
      <AccountMenu email={user.email} />
      <header className="intro">
        <h1>Meu histórico</h1>
        <p>Suas análises, da mais recente para a mais antiga. Horário de Brasília.</p>
        <Link href="/">Nova análise</Link>
      </header>
      {failed ? (
        <p className="form-error" role="alert">Não foi possível carregar seu histórico. Atualize a página e tente novamente.</p>
      ) : rows.length === 0 ? (
        <p role="status">{page === 1 ? "Você ainda não tem análises salvas." : "Não há análises nesta página."}</p>
      ) : (
        <div className="history-list">
          {rows.map(row => (
            <article className="history-card" key={row.id}>
              <time dateTime={row.created_at || undefined}>{formatHistoryDate(row.created_at)}</time>
              <h2>Mensagem enviada</h2>
              <p className="history-text">{row.entrada}</p>
              <h2>Resposta</h2>
              <p className="history-text">{row.resposta}</p>
            </article>
          ))}
        </div>
      )}
      {!failed && (page > 1 || total > pageSize) && (
        <nav className="history-pagination" aria-label="Páginas do histórico">
          {page > 1 && <Link href={`/historico?pagina=${page - 1}`}>Mais recentes</Link>}
          <span>Página {page}</span>
          {page * pageSize < total && <Link href={`/historico?pagina=${page + 1}`}>Mais antigas</Link>}
        </nav>
      )}
    </main>
  );
}
