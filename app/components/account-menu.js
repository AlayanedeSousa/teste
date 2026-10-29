"use client";

import { useActionState } from "react";
import { signOut } from "../login/actions";
import Link from "next/link";
import Icon from "./ui-icon";
import { content } from "../content";

export default function AccountMenu({ email }) {
  const [state, action, pending] = useActionState(signOut, {});
  return (
    <div className="account-section">
      <div className="account-bar">
        <div className="account-identity">
          <span className="brand-mark"><Icon name="shield" /></span>
          <div className="account-person">
            <span className="brand-name">{content.siteTitle}</span>
            <span className="account-email">{email}</span>
          </div>
        </div>
        <div className="account-actions">
          <Link href="/historico"><Icon name="history" />Meu histórico</Link>
          <form action={action}>
            <button type="submit" className="secondary-button" disabled={pending}><Icon name="logout" />{pending ? "Saindo…" : "Sair"}</button>
          </form>
        </div>
      </div>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
    </div>
  );
}
