# Analisador de texto

Página única em Next.js com App Router, JavaScript e CSS simples. O botão **Analisar** mostra exatamente o texto digitado, preservando espaços e quebras de linha. A resposta começa vazia e só muda ao enviar o formulário.

## Desenvolvimento

Use Node.js 24 e npm.

Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use a chave pública (anon ou publishable), nunca uma chave secreta ou `service_role`. Se você já tem `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, use o mesmo valor no novo nome `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Arquivos `.env.local` não são enviados ao GitHub.

```sh
npm ci
npm run dev
```

## Produção

```sh
npm run build
npm start
```

## Personalização

- Textos e metadados: `app/content.js`.
- Cores: variáveis no início de `app/globals.css`.
- Layout e estilos: `app/globals.css`.
- Comportamento do botão: `app/page.js`.

## Publicar na Vercel

Importe este repositório na Vercel e use a raiz do repositório como diretório do projeto. O arquivo `vercel.json` define o framework Next.js, o comando `npm run build` e o diretório de saída `.next`, substituindo configurações de site estático como `public`. A versão do Node.js está definida em `package.json` como 24.x.

Adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` às variáveis da Vercel nos ambientes desejados e publique novamente. A chave antes configurada como `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` precisa estar também no nome `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Se houver um deploy anterior com erro, publique o commit mais recente da branch `main`; repetir um deploy antigo não inclui a nova configuração.

## Supabase Auth

- `/login` permite entrar ou criar conta com e-mail e senha. Os erros são apresentados em português.
- `/` valida o usuário no servidor antes de mostrar o corretor. Sem sessão válida, redireciona para `/login`.
- O topo da página mostra o e-mail e o botão Sair. A sessão usa cookies e é renovada pelo proxy do Next.js.
- Em Supabase → Authentication, habilite o provedor Email e a criação de contas. Se a confirmação de e-mail estiver ativa, o cadastro exibe uma instrução para conferir a caixa de entrada.
- Em Authentication → URL Configuration, defina **Site URL** como o endereço público do site. Adicione `https://SEU-DOMINIO/auth/callback` às **Redirect URLs**, além de `http://localhost:3000/auth/callback` para desenvolvimento local. A confirmação deve ser aberta no mesmo navegador que iniciou o cadastro para concluir o fluxo PKCE. Depois de confirmar, também é possível voltar a `/login` e entrar com a senha.
- Não é necessária uma tabela de perfis nem uma chave administrativa. Textos e respostas continuam apenas no estado da página.

## Testes

```sh
npx playwright install chromium
npm test
```

Se o Chromium já estiver instalado no sistema, use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test`. A suíte inicia um serviço Auth simulado na porta 54329 e o Next.js na porta 3100. Não precisa de uma conta Supabase real e não envia e-mails. Cobre acesso protegido, mensagens em português, login, cadastro com e sem confirmação, callback PKCE, persistência da sessão, saída e layout móvel. A configuração e a entrega de e-mails do Supabase real devem ser conferidas separadamente no projeto publicado.
