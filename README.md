# Sistema — Assembleia de Deus de Nova Almeida

Sistema web da igreja: página inicial pública, controle de entradas e saídas,
dizimistas do mês (transparência sem expor valores individuais), mídia dos
cultos (fotos/vídeos com download individual ou em lote) e relatórios
financeiros mensais/anuais para membros, com administração completa (membros,
lançamentos, fotos, informações institucionais).

## Ambientes no ar

- Frontend: `infra/cdk-outputs.json` → `IcadnaStorageStack.FrontendUrl`
- API: `infra/cdk-outputs.json` → `IcadnaApiStack.ApiUrl`

## Estrutura

```
/frontend   -> React + Vite + Tailwind + Amplify (auth Cognito)
/backend    -> Lambdas (Node.js, uma pasta por domínio)
/infra      -> AWS CDK (TypeScript) — Cognito, DynamoDB, S3, CloudFront, API Gateway
/scripts    -> scripts de deploy auxiliares
```

## Modelo de acesso

Grupos do Cognito com permissão cumulativa — uma pessoa pertence a **um** grupo, mas
cada grupo (exceto `member`) já inclui a base de leitura de `member`:

- **Visitante** (sem login): só a página inicial (e as capas dos cultos, como teaser).
- **member**: + Entradas e Saídas (leitura), Dizimistas do Mês, Mídia do Culto (leitura), Relatórios.
- **midia**: tudo de `member` + CRUD de cultos e mídia (criar culto, enviar/editar/remover fotos e vídeos).
- **tesouraria**: tudo de `member` + CRUD de lançamentos financeiros e a visão completa
  (com o vínculo dizimista↔valor, que nunca aparece pra `member`/`midia`).
- **admin** (diretoria): acesso total — CRUD de membros (incluindo trocar o grupo de
  qualquer pessoa), tudo de `midia` e `tesouraria`, e informações institucionais.

No backend, `common/auth.ts` centraliza isso em `podeGerenciarFinancas()`
(admin/tesouraria) e `podeGerenciarMidia()` (admin/midia); toda rota de leitura básica
aceita qualquer um dos 4 grupos. No frontend, `AdminLayout` mostra só as abas que o
grupo da pessoa permite.

Não há autocadastro público: a administração cadastra o membro em
**Administração → Novo membro**, o que cria a conta no Cognito (`AdminCreateUser`)
e envia login + senha temporária **por SMS** (o login é o número de celular, em
formato E.164, ex: `+5527999112233`). No primeiro acesso a pessoa define sua
própria senha.

> **Atenção — SNS em modo sandbox:** contas AWS novas geralmente começam com o
> envio de SMS (via SNS) em modo sandbox, que só entrega mensagens para números
> verificados manualmente no console (SNS → Text messaging (SMS) → Sandbox
> destination phone numbers). Antes de cadastrar membros de verdade, verifique
> o status em SNS e, se necessário, solicite a saída do sandbox
> ("Request production access") — sem isso, o SMS com a senha temporária pode
> não chegar.

## Pré-requisitos

- Node.js 20+
- Conta AWS configurada (`aws configure` / credenciais no ambiente)
- CDK bootstrapado na conta/região (`npm run infra:bootstrap`, uma vez só)

## Instalação

```bash
npm install
```

## Deploy da infraestrutura (Cognito, DynamoDB, S3, CloudFront, API Gateway, Lambdas)

```bash
npm run infra:deploy
```

Gera `infra/cdk-outputs.json` com todos os IDs/URLs necessários.

## Configurar o frontend

Copie `frontend/.env.example` para `frontend/.env` e preencha com os valores
de `infra/cdk-outputs.json` (User Pool ID, Client ID, Identity Pool ID, API URL).

```bash
npm run frontend:dev     # desenvolvimento local (http://localhost:5173)
```

## Deploy do frontend (build + S3 + invalidação CloudFront)

```bash
bash scripts/deploy-frontend.sh
```

## Deploy automático (GitHub Actions)

Todo push na branch `main` dispara `.github/workflows/deploy.yml`, que roda os
type-checks, faz `cdk deploy --all` e depois builda e publica o frontend — igual
ao fluxo manual acima, mas automático.

A autenticação usa OpenID Connect (sem chaves de acesso salvas no repositório): o
workflow assume a role `IcadnaGitHubActionsRole`, que só pode ser assumida por
workflows rodando neste repositório (`repo:thiagomtd/AssembleiaDeDeusNovaAlmeida:*`)
e só tem permissão para assumir as roles de deploy que o próprio `cdk bootstrap` já
cria (`cdk-hnb659fds-deploy-role`, `-file-publishing-role`, `-image-publishing-role`,
`-lookup-role`), mais o necessário para sincronizar o bucket do frontend e invalidar
o CloudFront — sem `AdministratorAccess` direto.

## Primeiro acesso (bootstrap do admin)

Como não há autocadastro, o primeiro administrador precisa ser criado
manualmente uma única vez via AWS CLI:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <UserPoolId> \
  --username +5527999112233 \
  --user-attributes Name=phone_number,Value=+5527999112233 Name=phone_number_verified,Value=true Name=name,Value="Seu Nome" \
  --desired-delivery-mediums SMS

aws cognito-idp admin-add-user-to-group \
  --user-pool-id <UserPoolId> --username +5527999112233 --group-name admin
```

Depois crie o registro correspondente na tabela `icadna-members` (mesmo
celular em E.164, `grupo: "admin"`) para que a pessoa apareça na tela de
Administração. A partir daí, todo novo membro/admin é criado pela própria
interface.

## Decisões de modelagem (DynamoDB)

Tabelas separadas por domínio (não single-table design): o volume de dados de
uma igreja é baixo e os access patterns são bem distintos (membro por
id/e-mail, lançamento por mês/ano, mídia por culto) — tabelas separadas
mantêm cada Lambda simples sem a complexidade de chaves sobrepostas.

- `icadna-members`: um registro = uma pessoa = uma conta no sistema.
- `icadna-transactions`: `PK=mesAno` (consulta o mês inteiro em uma Query),
  GSI por `ano` para relatórios anuais. Nunca expõe o vínculo dizimista↔valor
  fora da administração.
- `icadna-church-info`: item único com texto institucional, endereço,
  horários e o saldo total em caixa (mantido por incremento atômico a cada
  lançamento).
- `icadna-photos`: galeria pública da home.
- `icadna-cultos` + `icadna-culto-midia`: um culto → N itens de mídia
  (fotos/vídeos), com download individual (URL pré-assinada) ou em lote
  (Lambda gera um `.zip` em streaming).
