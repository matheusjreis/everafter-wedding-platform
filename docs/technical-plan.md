# Plano Técnico do EverAfter

Status: rascunho inicial de planejamento  
Data: 2026-08-22  
Repositório: `everafter-wedding-platform`

Este documento registra a direção técnica inicial do EverAfter. Ele não define decisões irreversíveis sobre arquitetura financeira, provedor de pagamento ou políticas finais de produção.

## 1. Entendimento do produto

EverAfter é uma plataforma SaaS multi-tenant para casais criarem sites públicos de casamento e gerenciarem conteúdo, RSVP, galeria, presentes simbólicos, pagamentos, mensagens e publicação por meio de um painel privado.

O produto possui três superfícies principais:

* landing page institucional da plataforma;
* site público do casamento;
* painéis autenticados para casal e administrador da plataforma.

## 2. Premissas

* O MVP começa com um tema completo e um editor baseado em formulários.
* A interface inicial será em português.
* A estrutura de i18n deve permitir outros idiomas no futuro.
* Supabase será usado para autenticação, PostgreSQL, Storage, RLS e migrations.
* Next.js App Router será usado com Server Components por padrão.
* Pagamentos começam com abstração e provedor mockado.
* Dados completos de cartão nunca serão armazenados.
* A experiência pública será mobile-first.

## 3. Dúvidas bloqueantes

* O provedor de pagamento inicial deve priorizar Brasil, expansão internacional ou demonstração de portfólio?
* Os casais receberão repasses como pessoa física, pessoa jurídica ou ambos?
* A comissão da plataforma entra no MVP real ou fica apenas modelada?
* O RSVP público será aberto por site, por token de convite ou configurável?
* Qual política de retenção será aplicada aos dados dos convidados após a data do casamento?

## 4. Arquitetura proposta

A aplicação deve ser um monólito modular em Next.js.

Frontend:

* Next.js App Router;
* React Server Components para páginas de leitura;
* Client Components somente para formulários, prévias, lightbox, checkout e interações;
* Tailwind CSS e shadcn/ui;
* React Hook Form e Zod.

Backend:

* Server Actions para mutações autenticadas quando adequado;
* Route Handlers para webhooks, callbacks e fluxos públicos sensíveis;
* serviços por domínio em `src/features`;
* bibliotecas compartilhadas em `src/lib`.

Dados:

* Supabase PostgreSQL com RLS;
* ownership derivado de sessão autenticada e `couple_members`;
* políticas de Storage por casal/site.

Pagamentos:

* interface de provedor;
* implementação mockada no início;
* webhooks idempotentes;
* validação de assinatura antes de qualquer atualização financeira.

## 5. Diagrama de módulos

```text
Convidados
  -> Site público do casamento
    -> RSVP
    -> Lista de presentes
    -> Checkout

Casal
  -> Autenticação
  -> Painel do casal
    -> Editor do site
    -> Eventos
    -> Galeria
    -> Presentes
    -> RSVP
    -> Pagamentos
    -> Publicação

Administrador da plataforma
  -> Painel administrativo
    -> Casais
    -> Sites
    -> Transações
    -> Webhooks
    -> Auditoria

Núcleo
  -> Autorização
  -> Validação
  -> Logs
  -> Auditoria
  -> Pagamentos
  -> Supabase
```

## 6. Matriz de permissões

| Capacidade | Convidado | Administrador do casal | Administrador da plataforma |
| --- | --- | --- | --- |
| Ver site publicado | Sim | Sim | Sim |
| Ver site não publicado | Não | Somente próprio | Sim, com auditoria |
| Enviar RSVP | Sim | Teste/prévia | Não é fluxo principal |
| Ver presentes ativos | Sim | Próprios | Sim, com auditoria |
| Criar checkout | Sim | Teste/prévia | Não é fluxo principal |
| Ver dados privados de convidados | Não | Somente próprios | Excepcional, auditado |
| Editar conteúdo | Não | Somente próprio | Moderação/templates |
| Ver transações | Confirmação própria | Somente próprias | Global, auditado |
| Alterar status financeiro | Não | Não | Somente por fluxo auditado |
| Gerenciar planos e taxas | Não | Não | Sim |

Regras:

* acesso do casal exige `auth.uid()` em `couple_members`;
* acesso administrativo exige validação em `platform_admins`;
* convidados só acessam dados explicitamente públicos;
* preço, taxas, dono e status financeiro nunca vêm do navegador como fonte confiável.

## 7. Modelo inicial do banco

Identidade:

* `profiles`;
* `platform_admins`;
* `couples`;
* `couple_members`.

Site:

* `wedding_sites`;
* `site_slugs`;
* `wedding_site_sections`;
* `wedding_themes`;
* `wedding_events`;
* `wedding_locations`;
* `galleries`;
* `gallery_images`.

Convidados:

* `guests`;
* `rsvp_responses`;
* `guest_messages`.

Presentes e pagamentos:

* `gift_categories`;
* `gifts`;
* `payment_customers`;
* `payment_accounts`;
* `transactions`;
* `transaction_events`;
* `received_gifts`;
* `payouts`;
* `webhook_events`;
* `platform_fees`.

Comercial e auditoria:

* `subscription_plans`;
* `subscriptions`;
* `custom_domains`;
* `audit_logs`.

Regras de modelagem:

* UUID como chave primária;
* valores monetários em centavos;
* `created_at` e `updated_at`;
* constraints para valores positivos, unicidade de slugs e IDs de provedores;
* índices em `couple_id`, `slug`, status financeiro, webhooks e chaves estrangeiras;
* soft delete somente quando houver justificativa de retenção/auditoria.

## 8. Estratégia de RLS

RLS deve ser habilitado em todas as tabelas da aplicação.

Funções auxiliares recomendadas:

* `is_platform_admin(user_id uuid)`;
* `is_active_couple_member(user_id uuid, couple_id uuid)`;
* `can_manage_couple(user_id uuid, couple_id uuid)`;
* `can_view_published_site(site_id uuid)`.

Essas funções devem ser `security definer`, com `search_path` controlado e implementação pequena.

Testes obrigatórios:

* casal A não acessa dados do casal B;
* convidado não acessa RSVP, pagamentos, repasses ou auditoria;
* usuário comum não consegue se tornar administrador da plataforma;
* site não publicado não aparece publicamente;
* membro suspenso perde acesso;
* `couple_id` enviado pelo navegador não burla ownership;
* Storage não permite leitura/escrita entre casais.

## 9. Storage

Buckets iniciais:

* `wedding-public`;
* `wedding-private`;
* `system`.

Objetos devem usar caminhos por casal, por exemplo:

```text
couples/{couple_id}/gallery/{image_id}.webp
couples/{couple_id}/hero/{image_id}.webp
couples/{couple_id}/gifts/{image_id}.webp
```

O ownership também deve existir em tabelas como `gallery_images`; não basta confiar no texto do caminho.

Uploads devem validar MIME type, extensão, tamanho, dimensões e nome seguro.

## 10. Fluxo de autenticação

Cadastro:

1. usuário cria conta no Supabase Auth;
2. e-mail é confirmado;
3. perfil é criado;
4. onboarding cria `couples`, `couple_members` e `wedding_sites`;
5. usuário entra no painel do casal.

Login:

1. Supabase valida credenciais;
2. middleware protege grupos de rotas;
3. loaders/server actions validam membership ou perfil administrativo;
4. contas suspensas são bloqueadas.

## 11. Fluxo financeiro

1. convidado seleciona um presente ativo;
2. backend consulta o presente no banco;
3. backend valida site publicado e ownership;
4. backend calcula valores;
5. transação é criada;
6. provedor cria checkout;
7. convidado paga;
8. webhook assinado é recebido;
9. assinatura é validada;
10. evento é processado com idempotência;
11. transação muda de status;
12. presente recebido é registrado;
13. casal acompanha no painel.

Estados mínimos:

* `created`;
* `pending`;
* `processing`;
* `approved`;
* `declined`;
* `expired`;
* `cancelled`;
* `refunded`;
* `disputed`;
* `available_for_payout`;
* `paid_out`;
* `payout_failed`.

## 12. Provedores de pagamento

Fontes oficiais verificadas em 2026-08-22:

* Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/how-tos/integrate-marketplace
* Pagar.me: https://docs.pagar.me/docs/pedidos-com-split
* Asaas: https://docs.asaas.com/docs/split
* Stripe Pix Brasil: https://docs.stripe.com/payments/pix?locale=pt-BR
* Stripe preços Brasil: https://stripe.com/br/pricing

Recomendação preliminar:

* usar provedor mockado no início;
* avaliar Pagar.me e Asaas primeiro para operação Brasil com split/subcontas;
* considerar Mercado Pago se Checkout Pro marketplace reduzir risco;
* considerar Stripe se expansão internacional for prioridade e Pix estiver disponível para a conta.

Nenhum provedor real deve ser escolhido sem validar sandbox, contrato, KYC, taxas, split, repasse, estorno, chargeback e assinatura de webhook.

## 13. Segurança

Controles:

* RLS;
* autorização no servidor;
* validação com Zod;
* rate limiting;
* headers de segurança;
* auditoria;
* validação de upload;
* webhooks assinados e idempotentes;
* segredos somente no servidor;
* service-role key nunca no bundle do navegador.

Principais ameaças:

* vazamento entre casais;
* IDOR;
* elevação de privilégios;
* preço de presente adulterado;
* webhook falso;
* webhook duplicado;
* XSS;
* upload malicioso;
* exposição de site não publicado;
* segredos em logs ou bundle.

## 14. Estratégia mobile-first

Validar no mínimo:

* 320 px;
* 360 px;
* 375 px;
* 390 px;
* 412 px;
* 768 px;
* 1024 px;
* 1280 px.

Prioridades:

* sem rolagem horizontal;
* áreas de toque adequadas;
* formulários amigáveis para teclado móvel;
* Pix com QR Code e copiar código;
* tabelas convertidas em cards/listas;
* imagens responsivas;
* respeito a `prefers-reduced-motion`.

## 15. Estratégia de design

Direção visual:

* elegante;
* romântica;
* contemporânea;
* confiável;
* acolhedora;
* sem aparência genérica de template.

Sistema inicial:

* tipografia serifada para momentos emocionais;
* sans-serif para UI;
* base clara, texto escuro, rosa queimado, verde sálvia e champagne;
* bordas até 8 px;
* estados de carregamento, erro, vazio e sucesso;
* animações sutis e acessíveis.

## 16. Landing institucional

Seções:

1. header;
2. hero;
3. demonstração do produto;
4. como funciona;
5. funcionalidades;
6. templates;
7. segurança e confiança;
8. depoimentos demonstrativos;
9. FAQ;
10. CTA final;
11. footer.

## 17. Site público do casal

Fluxo narrativo:

1. hero do casamento;
2. contador;
3. história do casal;
4. galeria;
5. eventos;
6. localização;
7. RSVP;
8. presentes;
9. mensagem final;
10. footer do casamento.

O modo de prévia no painel deve reutilizar os mesmos componentes do site público.

## 18. MVP e roadmap

MVP:

* landing institucional;
* autenticação;
* onboarding;
* um tema completo;
* editor por formulários;
* site público;
* RSVP;
* galeria;
* presentes;
* pagamentos com provider aprovado;
* webhooks idempotentes;
* painel do casal;
* painel administrativo básico;
* RLS;
* testes;
* deploy documentado.

Roadmap:

* drag-and-drop;
* múltiplos administradores por casamento;
* domínios personalizados;
* planos pagos;
* múltiplos templates;
* WhatsApp;
* álbum colaborativo;
* relatórios avançados;
* múltiplos idiomas completos;
* múltiplas moedas.

## 19. Estrutura de diretórios

```text
src/
  app/
  components/
  features/
  lib/
  hooks/
  styles/
  types/
  config/
supabase/
  migrations/
  seed/
  tests/
tests/
  unit/
  integration/
  e2e/
docs/
```

## 20. Plano de implementação

1. Fundação do projeto: implementada;
2. Design system e landing page: implementação inicial concluída;
3. Autenticação: implementação inicial com Supabase SSR, cadastro, login, recuperação, reset e dashboard protegido;
4. Banco de dados e isolamento multi-tenant: migrations criadas para identidade, casais, membros, sites, RLS e onboarding transacional;
5. Painel do casal: onboarding inicial, perfil do usuário e leitura do site em rascunho implementados;
6. Site público do casamento: prévia dinâmica por slug e editor inicial implementados;
7. Pagamentos;
8. Administração da plataforma;
9. Qualidade, segurança e deploy.

## 21. Critérios de aceite

* casal A não acessa dados do casal B;
* convidado não acessa rotas administrativas;
* casal não vira administrador da plataforma;
* preço de presente não é adulterável;
* webhook falso é rejeitado;
* webhook duplicado não gera crédito duplicado;
* segredos não entram no bundle ou no Git;
* dados de cartão não são armazenados;
* uploads são validados;
* site funciona a partir de 320 px;
* checkout e Pix funcionam no celular;
* build, lint e testes passam;
* migrations e RLS são versionadas, documentadas e testadas.

## 22. Riscos

* complexidade de KYC, split e repasse;
* falhas em RLS;
* abuso em RSVP e checkout público;
* upload inseguro;
* escopo grande demais para o MVP;
* i18n caro se copy for espalhada;
* regressões mobile sem validação visual;
* acesso administrativo sem auditoria suficiente.

## 23. Higiene de segredos

O repositório deve versionar apenas `.env.example`.

Arquivos `.env` e `.env.local` devem permanecer ignorados.

Chaves reais do Supabase, segredos de webhook, URLs de banco e segredos de pagamento nunca devem ser commitados.
