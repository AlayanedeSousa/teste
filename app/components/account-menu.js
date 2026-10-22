"use client";

import { useActionState } from "react";
import { signOut } from "../login/actions";
import Link from "next/link";

export default function AccountMenu({ email }) {
  const [state, action, pending] = useActionState(signOut, {});
  return (
    <div className="account-section">
      <div className="account-bar">
        <span className="account-email">{email}</span>
        <div className="account-actions">
          <Link href="/historico">Meu histórico</Link>
          <form action={action}>
            <button type="submit" className="secondary-button" disabled={pending}>{pending ? "Saindo…" : "Sair"}</button>
          </form>
        </div>
      </div>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
    </div>
  );
}
