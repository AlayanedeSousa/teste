"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import Icon from "../components/ui-icon";

export default function LoginForm({ configurationError, confirmationError }) {
  const [state, action, pending] = useActionState(authenticate, {});
  const error = configurationError || state.error || (!state.message && confirmationError);
  return (
    <form className="text-form" action={action} noValidate>
      <label htmlFor="email"><Icon name="mail" />E-mail</label>
      <input id="email" name="email" type="email" autoComplete="email" required />
      <label htmlFor="password"><Icon name="lock" />Senha</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      <p className="form-hint">Para criar uma conta, use uma senha com pelo menos 6 caracteres.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {state.message && <p className="form-message" role="status">{state.message}</p>}
      <div className="form-buttons" aria-busy={pending}>
        <button type="submit" name="intent" value="signin" disabled={pending || !!configurationError}>Entrar</button>
        <button className="secondary-button" type="submit" name="intent" value="signup" disabled={pending || !!configurationError}>Criar conta</button>
      </div>
      {pending && <p className="loading-message" role="status"><span className="spinner" aria-hidden="true" />Aguarde…</p>}
    </form>
  );
}
