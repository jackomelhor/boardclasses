-- ClassBoard - schema inicial para fases 1 e 2
-- Execute tudo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create or replace function public.generate_invite_code()
returns text
language sql
as $$
  select upper(substring(encode(gen_random_bytes(6), 'hex') from 1 for 10));
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  school_name text,
  workspace_type text not null check (workspace_type in ('individual', 'grupo', 'turma')),
  invite_code text not null unique default public.generate_invite_code(),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  subject text not null,
  task_type text not null check (task_type in ('prova', 'trabalho', 'atividade', 'apresentacao')),
  due_date date not null,
  priority text not null default 'media' check (priority in ('alta', 'media', 'baixa')),
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluida')),
  attachment_name text,
  attachment_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  content text not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.tasks enable row level security;
alter table public.checklist_items enable row level security;

-- workspaces
create policy "workspace members can read workspaces"
on public.workspaces
for select
using (
  public.is_workspace_member(id)
  or owner_id = auth.uid()
);

create policy "authenticated users can create workspace"
on public.workspaces
for insert
with check (
  auth.uid() = owner_id
);

create policy "owners can update own workspace"
on public.workspaces
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "owners can delete own workspace"
on public.workspaces
for delete
using (owner_id = auth.uid());

-- workspace_members
create policy "members can read membership rows"
on public.workspace_members
for select
using (
  user_id = auth.uid()
  or public.is_workspace_member(workspace_id)
);

create policy "authenticated users can join a workspace as themselves"
on public.workspace_members
for insert
with check (
  user_id = auth.uid()
);

create policy "owners can manage memberships"
on public.workspace_members
for update
using (
  exists (
    select 1 from public.workspaces w
    where w.id = workspace_id and w.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = workspace_id and w.owner_id = auth.uid()
  )
);

create policy "owners can remove memberships"
on public.workspace_members
for delete
using (
  exists (
    select 1 from public.workspaces w
    where w.id = workspace_id and w.owner_id = auth.uid()
  )
  or user_id = auth.uid()
);

-- tasks
create policy "members can read tasks"
on public.tasks
for select
using (public.is_workspace_member(workspace_id));

create policy "members can create tasks"
on public.tasks
for insert
with check (
  public.is_workspace_member(workspace_id)
  and author_id = auth.uid()
);

create policy "members can update tasks"
on public.tasks
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members can delete tasks"
on public.tasks
for delete
using (public.is_workspace_member(workspace_id));

-- checklist_items
create policy "members can read checklist"
on public.checklist_items
for select
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_workspace_member(t.workspace_id)
  )
);

create policy "members can create checklist"
on public.checklist_items
for insert
with check (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_workspace_member(t.workspace_id)
  )
);

create policy "members can update checklist"
on public.checklist_items
for update
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_workspace_member(t.workspace_id)
  )
)
with check (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_workspace_member(t.workspace_id)
  )
);

create policy "members can delete checklist"
on public.checklist_items
for delete
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_workspace_member(t.workspace_id)
  )
);

-- bucket para anexos
insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', true)
on conflict (id) do nothing;

create policy "authenticated users can upload task files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'task-files');

create policy "public can read task files"
on storage.objects
for select
to public
using (bucket_id = 'task-files');

create policy "users can update own task files"
on storage.objects
for update
to authenticated
using (bucket_id = 'task-files' and owner = auth.uid())
with check (bucket_id = 'task-files' and owner = auth.uid());

create policy "users can delete own task files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'task-files' and owner = auth.uid());
