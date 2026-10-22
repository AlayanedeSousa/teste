# Analisador de texto

Projeto Next.js com App Router, JavaScript, Supabase Auth e CSS simples. A página principal é montada a partir de `desafio.js` e envia os campos para `POST /api/ia`. A resposta preserva as quebras de linha.

## Desenvolvimento

Use Node.js 24 e npm.

Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Também aceitamos `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` como alternativa: se já usa esse nome, não precisa renomear. Quando as duas chaves estiverem presentes, `NEXT_PUBLIC_SUPABASE_ANON_KEY` tem prioridade. Use uma chave pública (anon ou publishable), nunca uma chave secreta ou `service_role`. Arquivos `.env.local` não são enviados ao GitHub.

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

- Título, subtítulo, campos, botão, aviso, prompt, modelo e modo de teste da análise: `desafio.js`.
- Textos do login e metadados do site: `app/content.js`.
- Cores: variáveis no início de `app/globals.css`.
- Layout e estilos: `app/globals.css`.
- Comportamento do botão: `app/components/text-analyzer.js`.

## Análise de mensagens

`desafio.js` está com `modoTeste: true`: a API devolve um exemplo claramente identificado, sem chamar a IA e sem precisar de chave OpenRouter. O botão exibe “Analisando...” e fica desabilitado enquanto aguarda a resposta.

Para usar a IA real, defina `modoTeste: false`, configure `OPENROUTER_API_KEY` apenas no servidor (na Vercel ou em `.env.local`) e publique novamente. Nunca use prefixo `NEXT_PUBLIC_` nessa chave. A API exige uma sessão Supabase válida, interpola apenas os campos definidos no desafio e usa `https://openrouter.ai/api/v1/chat/completions` com o modelo do arquivo e `max_tokens: 900`. A comunicação externa exige acesso ao domínio `openrouter.ai`.

`POST /api/ia` recebe um objeto JSON com uma string para cada id de campo, por exemplo `{"mensagem":"Texto recebido"}`, e responde com texto puro. Erros 429 e 401 mostram as mensagens de limite e chave inválida solicitadas; uma sessão ausente retorna 403 com instrução para entrar. Campos vazios ou acima de 20.000 caracteres retornam 400.

O aviso foi mantido exatamente como fornecido. **Ainda não há persistência ou histórico:** apesar do trecho do aviso sobre guardar dados na conta, as mensagens e respostas ficam apenas no estado da página. No modo real, a mensagem é enviada à OpenRouter para processamento. O armazenamento privado requer uma implementação separada no Supabase com políticas de acesso.

## Publicar na Vercel

Importe este repositório na Vercel e use a raiz do repositório como diretório do projeto. O arquivo `vercel.json` define o framework Next.js, o comando `npm run build` e o diretório de saída `.next`, substituindo configurações de site estático como `public`. A versão do Node.js está definida em `package.json` como 24.x.

Adicione `NEXT_PUBLIC_SUPABASE_URL` e uma chave pública com o nome `NEXT_PUBLIC_SUPABASE_ANON_KEY` **ou** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` às variáveis da Vercel nos ambientes desejados (incluindo Production para o domínio público) e publique novamente. Se as variáveis já estiverem cadastradas com o nome publishable, apenas publique o commit mais recente. Sem URL ou chave, os botões ficam desabilitados e uma mensagem em português indica que o login está indisponível. Os valores `NEXT_PUBLIC_` são incorporados à compilação; alterar variáveis exige um novo deploy.

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
