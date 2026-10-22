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

As análises são salvas na tabela `respostas`, com a sessão Supabase da pessoa logada. `entrada` reúne cada campo com seu rótulo e `resposta` recebe o texto retornado. A inserção envia apenas essas duas colunas: o default `auth.uid()` do banco preenche `user_id` automaticamente pela sessão, e as políticas RLS impedem acesso ou gravação em nome de outra pessoa. O modo de teste também salva seus exemplos. Uma falha de gravação é informada em português; a API só confirma sucesso depois do salvamento. No modo real, a mensagem também é enviada à OpenRouter para processamento.

## Histórico privado no Supabase

Antes de publicar esta funcionalidade, execute o conteúdo de `supabase/migrations/202610220001_respostas.sql` no **SQL Editor** do projeto Supabase. O script pode ser executado novamente: cria `respostas` se necessário e acrescenta colunas que faltarem em uma tabela existente. O esquema esperado tem `id`, `user_id` (UUID), `entrada` (texto), `resposta` (texto) e `created_at` (timestamp com fuso).

O script preserva os dados existentes. Não inventa dono nem data para registros antigos sem essas informações: registros sem `user_id` não aparecem para usuários até que o dono correto seja identificado por uma pessoa administradora. Não atribua todos os registros a uma conta para contornar isso.

A migração ativa Row Level Security e cria políticas de leitura e inserção por `auth.uid() = user_id`, inclusive uma política restritiva para impedir acesso cruzado mesmo se houver políticas permissivas antigas. O aplicativo usa somente a chave pública e os cookies da sessão, sem `service_role` ou chave administrativa. Se a tabela existente usar nomes/tipos diferentes, adapte o esquema antes do deploy; a migração não converte dados automaticamente.

`/historico` exige login e consulta apenas os registros do usuário, com os mais recentes primeiro, em páginas de 20. A data e a hora são exibidas no fuso `America/Sao_Paulo` (Brasília). O topo tem o link “Meu histórico” ao lado de “Sair”.

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
- Não é necessária uma tabela de perfis nem uma chave administrativa. A tabela `respostas` guarda as análises privadas após a migração descrita acima.

## Testes

```sh
npx playwright install chromium
npm test
```

Se o Chromium já estiver instalado no sistema, use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test`. A suíte inicia um serviço Auth simulado na porta 54329 e o Next.js na porta 3100. Não precisa de uma conta Supabase real e não envia e-mails. Cobre acesso protegido, mensagens em português, login, cadastro com e sem confirmação, callback PKCE, persistência da sessão, saída e layout móvel. A configuração e a entrega de e-mails do Supabase real devem ser conferidas separadamente no projeto publicado.
