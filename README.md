# EverAfter

EverAfter é uma plataforma SaaS multi-tenant para criação e gestão de sites personalizados de casamento.

Cada casal pode criar uma conta, configurar seu site público, divulgar informações do casamento, publicar fotos, gerenciar uma lista de presentes simbólicos, receber confirmações de presença e acompanhar pagamentos pelo painel.

> Plataforma multi-tenant para sites de casamento com lista de presentes, pagamentos online, RSVP e painéis personalizáveis para casais.

![Prévia da landing page do EverAfter](public/images/everafter-readme-hero.png)

## Funcionalidades

* Landing page institucional;
* Cadastro, login e recuperação de senha;
* Site público personalizado para cada casal;
* URL amigável para o casamento;
* Contador regressivo;
* História do casal;
* Eventos, locais e mapa;
* Galeria de fotos;
* Lista de presentes simbólicos;
* Pagamentos online com Pix e cartão, após escolha do provedor;
* RSVP;
* Mensagens dos convidados;
* Painel do casal;
* Painel administrativo da plataforma;
* Isolamento multi-tenant;
* Segurança em Nível de Linha (RLS) no Supabase;
* Experiência mobile-first;
* Deploy planejado na Vercel.

## Perfis

### Administrador da plataforma

Pode acompanhar casais, sites, transações, repasses, taxas, planos, falhas de webhook e logs de auditoria. Ações sensíveis devem ser auditadas.

### Administrador do casal

Pode criar e editar o site do casamento, gerenciar eventos, galeria, presentes, RSVP, mensagens, pagamentos, aparência e publicação. Cada casal acessa somente seus próprios dados.

### Convidado

Não precisa criar conta. Pode acessar sites publicados, confirmar presença, consultar presentes, realizar pagamento e deixar mensagem.

## Stack

* React;
* Next.js com App Router;
* TypeScript estrito;
* Tailwind CSS;
* shadcn/ui;
* Supabase;
* PostgreSQL;
* Supabase Auth;
* Supabase Storage;
* Segurança em Nível de Linha (RLS);
* React Hook Form;
* Zod;
* Vitest;
* React Testing Library;
* Playwright;
* Vercel.

## Arquitetura

O EverAfter usa uma arquitetura multi-tenant. O isolamento entre casais não deve depender de filtros no frontend.

As garantias de isolamento serão feitas por:

* Supabase Auth;
* PostgreSQL RLS;
* políticas de Storage;
* autorização no servidor;
* validação de entradas;
* constraints e relacionamentos do banco;
* testes automatizados de autorização.

Operações sensíveis sempre devem ser validadas no servidor. O navegador nunca é fonte confiável para preço de presente, dono do recurso, status de pagamento, comissão ou valor líquido.

## Fluxo financeiro

O MVP começa com uma abstração de pagamento e um provedor mockado. A integração real será decidida após avaliação formal de Mercado Pago, Pagar.me, Asaas e Stripe.

Fluxo esperado:

1. O convidado escolhe um presente;
2. O backend consulta o preço real no banco;
3. O backend cria a transação;
4. O provedor cria o checkout;
5. O convidado realiza o pagamento;
6. O provedor envia webhook assinado;
7. O backend valida a assinatura;
8. O webhook é processado com idempotência;
9. A transação é atualizada;
10. O presente recebido aparece no painel do casal.

O EverAfter não armazena dados completos de cartão.

## Mobile-first

O produto é pensado primeiro para celular, já que muitos convidados acessarão o site por links enviados pelo WhatsApp.

As principais telas devem ser validadas em larguras como 320, 360, 375, 390, 412, 768, 1024 e 1280 px.

## Segurança

Segurança é critério de aceite, não melhoria futura.

O projeto deve proteger contra:

* vazamento entre tenants;
* IDOR;
* elevação de privilégios;
* alteração de preço pelo navegador;
* webhook falso ou duplicado;
* exposição de chaves;
* XSS;
* CSRF;
* upload inseguro;
* acesso público a sites não publicados.

## Privacidade

O projeto deve seguir princípios da LGPD:

* coleta mínima;
* finalidade clara;
* proteção de dados dos convidados;
* retenção adequada;
* exclusão e exportação de dados;
* auditoria de ações administrativas.

## Status do projeto

O EverAfter está em desenvolvimento e faz parte de um portfólio.

Implementado até agora:

* plano técnico inicial em `docs/technical-plan.md`;
* fundação Next.js com TypeScript estrito;
* Tailwind CSS e configuração compatível com shadcn/ui;
* dicionário de textos em português preparado para i18n;
* landing page institucional inicial;
* rotas placeholder para cadastro e demonstração;
* abstrações iniciais para Supabase e pagamentos;
* Vitest, React Testing Library, Playwright, ESLint e build configurados;
* `.env.example` versionado e arquivos locais de ambiente ignorados pelo Git.

## Desenvolvimento local

### Pré-requisitos

* Node.js 20.17 ou superior;
* npm 10 ou superior;
* projeto Supabase nas próximas fases de backend.

### Instalação

```bash
npm install
```

### Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha os valores localmente.

```bash
cp .env.example .env.local
```

Nunca comite chaves reais do Supabase, segredos de pagamento, URLs de banco ou segredos de webhook.

Somente variáveis `NEXT_PUBLIC_*` podem ser expostas ao navegador. `SUPABASE_SERVICE_ROLE_KEY`, segredos de pagamento, segredos de webhook e `DATABASE_URL` são somente servidor.

### Rodando localmente

```bash
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

### Qualidade

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Para testes E2E:

```bash
npx playwright install chromium
npm run test:e2e
```

## Supabase

As migrations versionadas estão em `supabase/migrations`. Elas criam a base multi-tenant, as políticas RLS e a RPC transacional usada no onboarding inicial do casal.

Depois de conferir que as variáveis em `.env.local` apontam para o projeto correto, vincule o projeto e aplique as migrations:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

Se a CLI do Supabase não estiver instalada globalmente, use os mesmos comandos com `npx supabase`.

No painel do Supabase, mantenha:

* **Authentication > URL Configuration > Site URL**: `http://localhost:3000`
* **Authentication > URL Configuration > Redirect URLs**: `http://localhost:3000/auth/callback`

Em produção, troque esses valores pelo domínio da Vercel.

Rotas já implementadas:

* `/dashboard`: painel inicial do casal;
* `/settings/profile`: edição de nome, e-mail e URL da foto de perfil;
* `/dashboard/site/[siteId]/editor`: editor inicial do site do casamento;
* `/wedding/[slug]`: prévia pública/dinâmica do site do casamento.

## Deploy

O deploy é planejado para Vercel. Segredos de produção devem ser configurados nas variáveis de ambiente da Vercel e nas configurações do Supabase, nunca no repositório.

## Roadmap

* Múltiplos templates completos;
* Domínios personalizados;
* Planos pagos;
* Editor avançado;
* Múltiplos administradores por casamento;
* Login social;
* WhatsApp;
* Álbum colaborativo;
* Relatórios avançados;
* Múltiplos idiomas;
* Múltiplas moedas.

## Aviso

EverAfter é um projeto de portfólio em desenvolvimento. Recursos de pagamento devem usar APIs oficiais dos provedores e respeitar requisitos financeiros, jurídicos, regulatórios, de privacidade e de segurança.
