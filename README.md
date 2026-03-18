# ClassBoard — fases 1 e 2

Web app em **Next.js + TypeScript + Tailwind + Supabase**.

Este pacote já inclui:

- autenticação por email e senha
- dashboard escolar
- criação de tarefas
- checklist por tarefa
- prioridade
- calendário semanal
- painel da turma
- convite por link
- anexo em tarefa usando Supabase Storage
- lembrete local por notificação do navegador
- modo demonstração, para abrir o app mesmo antes de configurar o banco

---

## 1) Tecnologias

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

---

## 2) Como rodar localmente

### Pré-requisitos

- Node.js 20+
- npm 10+

### Passos

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra:

```bash
http://localhost:3000
```

Se você ainda não tiver configurado o Supabase, o projeto abre em **modo demonstração**.

---

## 3) Como ativar o banco de dados no Supabase

### Etapa 1 — criar o projeto

1. Crie uma conta no Supabase.
2. Crie um novo projeto.
3. Escolha nome, região e senha do banco.
4. Aguarde o provisionamento.

### Etapa 2 — pegar as chaves

No painel do Supabase, copie:

- `Project URL`
- `anon public key`

Depois preencha o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

### Etapa 3 — criar as tabelas e políticas

1. No Supabase, abra o **SQL Editor**.
2. Copie todo o conteúdo do arquivo `supabase/schema.sql`.
3. Execute o script.

Esse script cria:

- `workspaces`
- `workspace_members`
- `tasks`
- `checklist_items`
- bucket `task-files`
- políticas de segurança com RLS

### Etapa 4 — autenticação por email

No Supabase:

1. Vá em **Authentication**.
2. Ative o provider **Email**.
3. Escolha se quer confirmação por email ou não.

Para testes rápidos, você pode deixar a confirmação desligada.

### Etapa 5 — reiniciar o projeto

Depois de preencher o `.env.local`, rode novamente:

```bash
npm run dev
```

Agora o login deixa de ser demo e passa a usar o Supabase de verdade.

---

## 4) Como o app está organizado

```text
app/
  page.tsx
  join/[inviteCode]/page.tsx
components/
  classboard-app.tsx
  task-form.tsx
lib/
  supabase/client.ts
  types.ts
supabase/
  schema.sql
```

### Estrutura principal

- `app/page.tsx`: entrada do app
- `components/classboard-app.tsx`: tela principal, autenticação e navegação
- `components/task-form.tsx`: modal para nova tarefa
- `app/join/[inviteCode]/page.tsx`: rota para entrar via convite
- `lib/supabase/client.ts`: conexão com Supabase
- `supabase/schema.sql`: banco de dados, RLS e bucket

---

## 5) Fluxo do produto já implementado

### Fase 1

- criar conta
- entrar no app
- criar workspace inicial
- ver painel
- criar tarefas
- acompanhar tarefas no dashboard
- ver calendário
- usar convite por link

### Fase 2

- prioridade
- checklist
- progresso da tarefa
- anexo
- notificação local no navegador

> Observação importante: a notificação implementada nesta versão é de **lembrança local ao abrir o painel**. Agendamento de email ou envio automático em horário exato fica como próxima evolução.

---

## 6) Como subir para a web na Vercel

### Opção mais simples: GitHub + Vercel

#### 1. subir para o GitHub

Dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Primeira versão do ClassBoard"
```

Crie um repositório no GitHub e depois rode:

```bash
git remote add origin SEU_REPOSITORIO_GIT
git branch -M main
git push -u origin main
```

#### 2. importar na Vercel

1. Entre na Vercel.
2. Clique em **Add New > Project**.
3. Conecte seu GitHub.
4. Importe o repositório.
5. A Vercel detecta automaticamente que é um projeto Next.js.

#### 3. adicionar variáveis de ambiente

Na Vercel, adicione estas variáveis:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Depois faça um novo deploy.

#### 4. compartilhar com testers

Após o deploy, a Vercel gera uma URL pública. Você pode enviar essa URL diretamente para seus testers.

---

## 7) Como fazer testes com outras pessoas

### Fluxo recomendado

1. Você cria sua conta.
2. O app cria um workspace inicial.
3. No painel da turma, copie o link de convite.
4. Envie esse link para os testers.
5. O tester cria a própria conta.
6. O tester entra no link de convite e se adiciona à turma.

---

## 8) Próximas melhorias que valem a pena

### Alta prioridade

- tela real de gerenciamento de membros
- múltiplos workspaces por usuário
- planos pagos
- bloqueio por assinatura
- filtros mais avançados
- dashboard do dono da turma

### Depois

- email reminders automáticos
- notificações agendadas
- grupos internos
- visão mensal do calendário
- edição e exclusão de tarefas
- analytics de produtividade

---

## 9) Dicas para não se perder

### Primeiro valide isto

- o login funciona
- as tarefas são criadas
- o checklist atualiza
- o link de convite funciona
- os testers conseguem entrar

### Só depois avance para

- pagamentos
- planos
- cancelamento com bloqueio
- regras comerciais

Esse é o ponto mais importante do projeto. Antes de monetizar, valide que a turma realmente usa.

---

## 10) Comandos úteis

### desenvolvimento

```bash
npm run dev
```

### build de produção

```bash
npm run build
```

### rodar produção local

```bash
npm run start
```

---

## 11) Observação final

Este projeto foi montado para ser **bonito o suficiente para mostrar**, mas também **simples o suficiente para você entender e evoluir**.

A escolha mais madura aqui foi não misturar agora:

- cobrança
- múltiplos planos completos
- backend extra
- regras comerciais complexas

Primeiro valide o uso real da turma. Isso te poupa retrabalho.
