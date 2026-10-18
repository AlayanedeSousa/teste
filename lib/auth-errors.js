// Não exiba diretamente mensagens em inglês recebidas da API.
export function authErrorMessage(error) {
  const messages = {
    invalid_credentials: "E-mail ou senha incorretos.",
    email_not_confirmed: "Confirme seu e-mail antes de entrar. Confira também a pasta de spam.",
    user_already_exists: "Já existe uma conta com este e-mail. Tente entrar.",
    email_exists: "Já existe uma conta com este e-mail. Tente entrar.",
    weak_password: "Escolha uma senha mais forte, com pelo menos 6 caracteres.",
    over_email_send_rate_limit: "Muitos e-mails foram solicitados. Aguarde alguns minutos e tente novamente.",
    over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    email_address_invalid: "Digite um endereço de e-mail válido.",
    email_address_not_authorized: "O envio de confirmação para este e-mail não está liberado no Supabase.",
    signup_disabled: "A criação de contas está desativada no momento.",
    email_provider_disabled: "O login com e-mail está desativado no momento.",
    validation_failed: "Confira o e-mail e a senha e tente novamente.",
    user_banned: "Esta conta está bloqueada. Entre em contato com o suporte.",
  };
  return messages[error?.code] || "Não foi possível concluir a solicitação. Verifique sua conexão e tente novamente.";
}
