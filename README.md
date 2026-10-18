# Analisador de texto

Página única em Next.js com App Router, JavaScript e CSS simples. O botão **Analisar** mostra exatamente o texto digitado, preservando espaços e quebras de linha. A resposta começa vazia e só muda ao enviar o formulário.

## Desenvolvimento

Use Node.js 24 e npm.

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

Importe este repositório na Vercel e selecione o framework Next.js. Use a raiz do repositório como diretório do projeto e mantenha os comandos padrão (`npm run build`). A versão do Node.js está definida em `package.json` como 24.x. Não são necessárias variáveis de ambiente, banco de dados ou chaves de API.
