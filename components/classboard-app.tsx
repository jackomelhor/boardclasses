"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  FileText,
  Home,
  Link2,
  Loader2,
  LogOut,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ChecklistItem, Priority, Task, TaskFormValues, TaskStatus, TaskType, Workspace } from "@/lib/types";
import { TaskForm } from "@/components/task-form";

type Screen = "dashboard" | "tasks" | "calendar" | "workspace";
type AuthMode = "signin" | "signup";

type WorkspaceMembershipQuery = {
  workspace_id: string;
  role: string;
  workspaces: Workspace | Workspace[] | null;
};

const todayIso = new Date().toISOString().slice(0, 10);

const demoWorkspace: Workspace = {
  id: "demo-workspace",
  owner_id: "demo-user",
  name: "Turma 2ºB",
  school_name: "Colégio Alfa",
  workspace_type: "turma",
  invite_code: "DEMO2B",
};

const demoTasks: Task[] = [
  {
    id: "1",
    workspace_id: demoWorkspace.id,
    author_id: "demo-user",
    title: "Entrega de redação de Português",
    description: "Escrever e revisar a redação sobre leitura crítica.",
    subject: "Português",
    task_type: "trabalho",
    due_date: todayIso,
    priority: "alta",
    status: "em_andamento",
    attachment_name: null,
    attachment_url: null,
    checklist_items: [
      { id: "1-a", task_id: "1", content: "Escolher tema", is_done: true },
      { id: "1-b", task_id: "1", content: "Escrever rascunho", is_done: true },
      { id: "1-c", task_id: "1", content: "Revisar texto", is_done: false },
    ],
  },
  {
    id: "2",
    workspace_id: demoWorkspace.id,
    author_id: "demo-user",
    title: "Estudar Matemática",
    description: "Revisar equações do 2º grau e resolver a lista 1.",
    subject: "Matemática",
    task_type: "atividade",
    due_date: todayIso,
    priority: "media",
    status: "pendente",
    attachment_name: null,
    attachment_url: null,
    checklist_items: [
      { id: "2-a", task_id: "2", content: "Resolver lista 1", is_done: true },
      { id: "2-b", task_id: "2", content: "Rever exemplos do caderno", is_done: false },
    ],
  },
  {
    id: "3",
    workspace_id: demoWorkspace.id,
    author_id: "demo-user",
    title: "Prova de História",
    description: "Capítulos 3 e 4.",
    subject: "História",
    task_type: "prova",
    due_date: addDays(2),
    priority: "alta",
    status: "pendente",
    attachment_name: null,
    attachment_url: null,
    checklist_items: [
      { id: "3-a", task_id: "3", content: "Revisar capítulo 3", is_done: false },
      { id: "3-b", task_id: "3", content: "Fazer mapa mental", is_done: false },
    ],
  },
  {
    id: "4",
    workspace_id: demoWorkspace.id,
    author_id: "demo-user",
    title: "Prova de Química",
    description: "Tabela periódica e ligações químicas.",
    subject: "Química",
    task_type: "prova",
    due_date: addDays(4),
    priority: "alta",
    status: "pendente",
    attachment_name: null,
    attachment_url: null,
    checklist_items: [
      { id: "4-a", task_id: "4", content: "Treinar balanceamento", is_done: false },
      { id: "4-b", task_id: "4", content: "Rever anotações", is_done: false },
    ],
  },
  {
    id: "5",
    workspace_id: demoWorkspace.id,
    author_id: "demo-user",
    title: "Trabalho de Ciências",
    description: "Preparar apresentação em grupo sobre reciclagem.",
    subject: "Ciências",
    task_type: "apresentacao",
    due_date: addDays(3),
    priority: "media",
    status: "pendente",
    attachment_name: "roteiro.pdf",
    attachment_url: "#",
    checklist_items: [
      { id: "5-a", task_id: "5", content: "Pesquisar tema", is_done: true },
      { id: "5-b", task_id: "5", content: "Montar slides", is_done: false },
      { id: "5-c", task_id: "5", content: "Ensaiar apresentação", is_done: false },
    ],
  },
];

function addDays(amount: number) {
  const date = new Date();
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function startOfWeek(base = new Date()) {
  const date = new Date(base);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function diffInDays(dateString: string) {
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(`${dateString}T00:00:00`).getTime();
  return Math.round((target - current) / (1000 * 60 * 60 * 24));
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function humanDueLabel(dateString: string) {
  const days = diffInDays(dateString);
  if (days < 0) return `Atrasada há ${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return `Em ${days} dias`;
}

function mapPriority(priority: Priority) {
  if (priority === "alta") return "bg-red-50 text-red-700 border-red-200";
  if (priority === "media") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function mapUrgency(dateString: string) {
  const days = diffInDays(dateString);
  if (days <= 1) return "bg-red-50 text-red-700 border-red-200";
  if (days <= 3) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function statusLabel(status: TaskStatus) {
  const labels: Record<TaskStatus, string> = {
    pendente: "Pendente",
    em_andamento: "Em andamento",
    concluida: "Concluída",
  };
  return labels[status];
}

function typeLabel(type: TaskType) {
  const labels: Record<TaskType, string> = {
    prova: "Prova",
    trabalho: "Trabalho",
    atividade: "Atividade",
    apresentacao: "Apresentação",
  };
  return labels[type];
}

function calculateProgress(items: ChecklistItem[]) {
  if (!items.length) return 0;
  const done = items.filter((item) => item.is_done).length;
  return Math.round((done / items.length) * 100);
}

async function uploadAttachment(file: File, userId: string) {
  if (!supabase) return { attachment_name: null, attachment_url: null };
  const safeName = file.name.replace(/\s+/g, "-");
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("task-files").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("task-files").getPublicUrl(path);
  return {
    attachment_name: file.name,
    attachment_url: data.publicUrl,
  };
}

export function ClassBoardApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState<"todos" | "proximas" | "provas" | "concluidas">("todos");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoadingAuth(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession ?? null);
      setLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (demoMode) {
      setWorkspace(demoWorkspace);
      setTasks(demoTasks);
      return;
    }

    if (!session?.user || !supabase) {
      setWorkspace(null);
      setTasks([]);
      return;
    }

    void bootstrapWorkspace(session.user);
  }, [session?.user?.id, demoMode]);

  useEffect(() => {
    setNotificationPermission(typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported");
  }, []);

  useEffect(() => {
    if (notificationPermission !== "granted") return;
    if (!tasks.length) return;

    const cacheKey = `classboard-notified-${new Date().toISOString().slice(0, 10)}`;
    const notified = typeof window !== "undefined" ? window.sessionStorage.getItem(cacheKey) : null;
    if (notified) return;

    const dueSoon = tasks.filter((task) => diffInDays(task.due_date) <= 1 && task.status !== "concluida");
    if (!dueSoon.length) return;

    const task = dueSoon[0];
    new Notification("ClassBoard", {
      body: `${task.title} • ${humanDueLabel(task.due_date)}`,
    });
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(cacheKey, "1");
    }
  }, [notificationPermission, tasks]);

  const todayTasks = useMemo(() => tasks.filter((task) => diffInDays(task.due_date) === 0), [tasks]);
  const upcomingTests = useMemo(() => tasks.filter((task) => task.task_type === "prova" && task.status !== "concluida").slice(0, 2), [tasks]);
  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.task_type !== "prova" && task.status !== "concluida").slice(0, 2),
    [tasks]
  );
  const doneCount = useMemo(() => tasks.filter((task) => task.status === "concluida").length, [tasks]);
  const pendingCount = useMemo(() => tasks.filter((task) => task.status !== "concluida").length, [tasks]);
  const weeklyCalendar = useMemo(() => {
    const weekStart = startOfWeek();
    return Array.from({ length: 5 }).map((_, index) => {
      const current = new Date(weekStart);
      current.setDate(weekStart.getDate() + index);
      const iso = current.toISOString().slice(0, 10);
      const items = tasks.filter((task) => task.due_date === iso);
      const dayLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(current).replace(".", "");
      return { iso, dayLabel, items };
    });
  }, [tasks]);
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = `${task.title} ${task.subject}`.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (taskFilter === "proximas") return diffInDays(task.due_date) <= 3;
      if (taskFilter === "provas") return task.task_type === "prova";
      if (taskFilter === "concluidas") return task.status === "concluida";
      return true;
    });
  }, [tasks, search, taskFilter]);

  async function bootstrapWorkspace(user: User) {
    if (!supabase) return;
    setLoadingData(true);
    setErrorMessage(null);

    try {
      const membershipQuery = await supabase
        .from("workspace_members")
        .select("workspace_id, role, workspaces(*)")
        .eq("user_id", user.id)
        .limit(1);

      if (membershipQuery.error) throw membershipQuery.error;

      const row = membershipQuery.data?.[0] as WorkspaceMembershipQuery | undefined;

      if (!row) {
        const insertedWorkspace = await supabase
          .from("workspaces")
          .insert({
            owner_id: user.id,
            name: "Turma 2ºB",
            school_name: "Colégio Alfa",
            workspace_type: "turma",
          })
          .select("*")
          .single();

        if (insertedWorkspace.error) throw insertedWorkspace.error;

        const newWorkspace = insertedWorkspace.data as Workspace;

        const insertedMembership = await supabase.from("workspace_members").insert({
          workspace_id: newWorkspace.id,
          user_id: user.id,
          role: "owner",
        });

        if (insertedMembership.error) throw insertedMembership.error;

        const insertedTasks = await supabase
          .from("tasks")
          .insert(
            demoTasks.map((task) => ({
              workspace_id: newWorkspace.id,
              author_id: user.id,
              title: task.title,
              description: task.description,
              subject: task.subject,
              task_type: task.task_type,
              due_date: task.due_date,
              priority: task.priority,
              status: task.status,
              attachment_name: task.attachment_name,
              attachment_url: task.attachment_url,
            }))
          )
          .select("id, title");

        if (insertedTasks.error) throw insertedTasks.error;

        for (const task of demoTasks) {
          const dbTask = insertedTasks.data?.find((item) => item.title === task.title);
          if (!dbTask || !task.checklist_items.length) continue;
          const checklistInsert = await supabase.from("checklist_items").insert(
            task.checklist_items.map((item) => ({
              task_id: dbTask.id,
              content: item.content,
              is_done: item.is_done,
            }))
          );
          if (checklistInsert.error) throw checklistInsert.error;
        }

        setWorkspace(newWorkspace);
        await loadTasks(newWorkspace.id);
        setMessage("Workspace inicial criado com tarefas de demonstração.");
      } else {
        const currentWorkspace = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
        setWorkspace(currentWorkspace ?? null);
        if (currentWorkspace) {
          await loadTasks(currentWorkspace.id);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível carregar os dados.";
      setErrorMessage(message);
    } finally {
      setLoadingData(false);
    }
  }

  async function loadTasks(workspaceId: string) {
    if (!supabase) return;
    const query = await supabase
      .from("tasks")
      .select("*, checklist_items(*)")
      .eq("workspace_id", workspaceId)
      .order("due_date", { ascending: true });

    if (query.error) throw query.error;
    const records = (query.data ?? []) as Task[];
    setTasks(
      records.map((task) => ({
        ...task,
        checklist_items: [...(task.checklist_items ?? [])].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")),
      }))
    );
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingAuth(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      if (!supabase || !isSupabaseConfigured) {
        setDemoMode(true);
        setMessage("Modo demonstração ativado porque o Supabase ainda não foi configurado.");
        return;
      }

      if (authMode === "signup") {
        const response = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (response.error) throw response.error;
        setMessage("Conta criada. Se a confirmação por email estiver ligada no Supabase, confirme seu email antes de entrar.");
      } else {
        const response = await supabase.auth.signInWithPassword({ email, password });
        if (response.error) throw response.error;
        setMessage("Login realizado com sucesso.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível autenticar.";
      setErrorMessage(message);
    } finally {
      setSubmittingAuth(false);
    }
  }

  async function handleSignOut() {
    setMessage(null);
    setErrorMessage(null);
    if (demoMode) {
      setDemoMode(false);
      setWorkspace(null);
      setTasks([]);
      return;
    }
    if (!supabase) return;
    await supabase.auth.signOut();
    setWorkspace(null);
    setTasks([]);
  }

  async function handleCreateTask(values: TaskFormValues) {
    if (!workspace) return;
    setSavingTask(true);
    setErrorMessage(null);

    try {
      const attachment = values.file && session?.user && supabase ? await uploadAttachment(values.file, session.user.id) : { attachment_name: null, attachment_url: null };
      const checklistLines = values.checklistRaw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (demoMode || !supabase || !session?.user) {
        const newTask: Task = {
          id: crypto.randomUUID(),
          workspace_id: workspace.id,
          author_id: session?.user?.id ?? "demo-user",
          title: values.title,
          description: values.description || null,
          subject: values.subject,
          task_type: values.taskType,
          due_date: values.dueDate,
          priority: values.priority,
          status: values.status,
          attachment_name: values.file?.name ?? null,
          attachment_url: null,
          checklist_items: checklistLines.map((content) => ({
            id: crypto.randomUUID(),
            task_id: "local-task",
            content,
            is_done: false,
          })),
        };
        setTasks((prev) => [...prev, newTask].sort((a, b) => a.due_date.localeCompare(b.due_date)));
      } else {
        const insertedTask = await supabase
          .from("tasks")
          .insert({
            workspace_id: workspace.id,
            author_id: session.user.id,
            title: values.title,
            description: values.description || null,
            subject: values.subject,
            task_type: values.taskType,
            due_date: values.dueDate,
            priority: values.priority,
            status: values.status,
            ...attachment,
          })
          .select("*")
          .single();

        if (insertedTask.error) throw insertedTask.error;

        if (checklistLines.length) {
          const insertChecklist = await supabase.from("checklist_items").insert(
            checklistLines.map((content) => ({
              task_id: insertedTask.data.id,
              content,
              is_done: false,
            }))
          );
          if (insertChecklist.error) throw insertChecklist.error;
        }

        await loadTasks(workspace.id);
      }

      setShowTaskForm(false);
      setMessage("Tarefa criada com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar a tarefa.";
      setErrorMessage(message);
    } finally {
      setSavingTask(false);
    }
  }

  async function toggleChecklist(task: Task, item: ChecklistItem) {
    try {
      const updatedItems = task.checklist_items.map((current) =>
        current.id === item.id ? { ...current, is_done: !current.is_done } : current
      );
      const nextStatus: TaskStatus = updatedItems.length > 0 && updatedItems.every((entry) => entry.is_done) ? "concluida" : "em_andamento";

      if (demoMode || !supabase) {
        setTasks((prev) =>
          prev.map((currentTask) =>
            currentTask.id === task.id
              ? {
                  ...currentTask,
                  status: nextStatus,
                  checklist_items: updatedItems,
                }
              : currentTask
          )
        );
        return;
      }

      const checklistUpdate = await supabase.from("checklist_items").update({ is_done: !item.is_done }).eq("id", item.id);
      if (checklistUpdate.error) throw checklistUpdate.error;

      const taskUpdate = await supabase.from("tasks").update({ status: nextStatus }).eq("id", task.id);
      if (taskUpdate.error) throw taskUpdate.error;

      setTasks((prev) =>
        prev.map((currentTask) =>
          currentTask.id === task.id
            ? {
                ...currentTask,
                status: nextStatus,
                checklist_items: updatedItems,
              }
            : currentTask
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível atualizar o checklist.";
      setErrorMessage(message);
    }
  }

  async function requestNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }

  async function copyInviteLink() {
    if (!workspace) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const link = `${origin}/join/${workspace.invite_code}`;
    await navigator.clipboard.writeText(link);
    setMessage("Link de convite copiado.");
  }

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-5 shadow-panel">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          <span className="font-medium text-slate-700">Carregando ClassBoard...</span>
        </div>
      </div>
    );
  }

  if (!session?.user && !demoMode) {
    return (
      <div className="auth-grid-bg min-h-screen px-4 py-8 text-white md:px-8 lg:px-10">
        <div className="mx-auto grid min-h-[90vh] max-w-7xl gap-6 lg:grid-cols-[220px_1.1fr_0.95fr]">
          <aside className="hidden rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-950/40">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${
                    authMode === "signin" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <Mail className="h-4 w-4" /> Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${
                    authMode === "signup" ? "bg-brand-600 text-white shadow-lg shadow-brand-950/40" : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <Users className="h-4 w-4" /> Criar conta
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">Visual inspirado na sua referência 2, adaptado para um MVP funcional.</p>
          </aside>

          <section className="flex rounded-[34px] border border-white/10 bg-gradient-to-br from-brand-500 via-blue-600 to-sky-500 p-8 shadow-2xl shadow-brand-950/30">
            <div className="flex w-full flex-col justify-between gap-10">
              <div className="space-y-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                  <Sparkles className="h-4 w-4" /> Plataforma de organização escolar colaborativa
                </div>
                <div className="max-w-xl space-y-4">
                  <h1 className="text-4xl font-bold leading-tight md:text-5xl">ClassBoard</h1>
                  <p className="text-lg leading-relaxed text-blue-50">
                    Fase 1 e fase 2 prontas no mesmo web app: autenticação, painel da turma, tarefas, calendário,
                    checklist, prioridade, anexo e lembretes no navegador.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <p className="text-3xl font-bold">45</p>
                  <p className="mt-1 text-sm text-blue-50">membros no plano turma</p>
                </div>
                <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <p className="text-3xl font-bold">1</p>
                  <p className="mt-1 text-sm text-blue-50">dashboard centralizado</p>
                </div>
                <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <p className="text-3xl font-bold">3</p>
                  <p className="mt-1 text-sm text-blue-50">alertas possíveis por tarefa</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-slate-950/85 p-8 backdrop-blur">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-400">Acesso</p>
                <h2 className="mt-1 text-3xl font-bold">{authMode === "signup" ? "Criar sua conta" : "Entrar"}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {isSupabaseConfigured
                    ? "Conectado ao Supabase. Você pode testar o fluxo real de autenticação."
                    : "O projeto também funciona em modo demonstração antes de configurar o banco."}
                </p>
              </div>

              {message && <AlertBanner tone="success" message={message} />}
              {errorMessage && <AlertBanner tone="error" message={errorMessage} />}

              <form className="space-y-4" onSubmit={handleAuthSubmit}>
                {authMode === "signup" && (
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300">Nome</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={authMode === "signup"}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-slate-500"
                      placeholder="João Silva"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    type="email"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-slate-500"
                    placeholder="joao@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Senha</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    type="password"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-slate-500"
                    placeholder="******"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAuth}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-brand-600 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submittingAuth ? "Processando..." : authMode === "signup" ? "Criar conta" : "Entrar"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setErrorMessage(null);
                  setDemoMode(true);
                }}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-medium text-white transition hover:bg-white/10"
              >
                Explorar modo demonstração
              </button>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">Dica</p>
                <p className="mt-2 leading-relaxed">
                  Primeiro rode o projeto localmente. Depois conecte o Supabase usando o arquivo <code className="rounded bg-black/20 px-1.5 py-0.5">.env.local</code> e execute o SQL em <code className="rounded bg-black/20 px-1.5 py-0.5">supabase/schema.sql</code>.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <TaskForm open={showTaskForm} onClose={() => setShowTaskForm(false)} onSubmit={handleCreateTask} submitting={savingTask} />
      <div className="flex min-h-screen">
        <aside className="hidden w-24 border-r border-slate-200 bg-slate-950 px-4 py-6 text-white xl:flex xl:w-72 xl:flex-col xl:gap-6">
          <div className="flex items-center gap-3 px-2">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-950/40">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">ClassBoard</p>
              <p className="text-xs text-slate-400">Fases 1 + 2</p>
            </div>
          </div>

          <nav className="space-y-2">
            <SidebarButton active={screen === "dashboard"} label="Painel" icon={<Home className="h-5 w-5" />} onClick={() => setScreen("dashboard")} />
            <SidebarButton active={screen === "tasks"} label="Tarefas" icon={<ClipboardList className="h-5 w-5" />} onClick={() => setScreen("tasks")} />
            <SidebarButton active={screen === "calendar"} label="Calendário" icon={<CalendarDays className="h-5 w-5" />} onClick={() => setScreen("calendar")} />
            <SidebarButton active={screen === "workspace"} label="Turma" icon={<Users className="h-5 w-5" />} onClick={() => setScreen("workspace")} />
          </nav>

          <div className="mt-auto space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-blue-300" /> Estrutura profissional
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              Este pacote já vem com UI, Supabase preparado, SQL, upload de anexo e guia de deploy para seus testers.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> {demoMode ? "Sair da demo" : "Sair"}
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 md:px-6 xl:px-8">
          <div className="mx-auto max-w-7xl space-y-5">
            <div className="flex flex-col gap-3 rounded-[28px] bg-white p-4 shadow-panel md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">{workspace?.school_name ?? "Escola"}</p>
                <h1 className="text-2xl font-bold text-slate-900">{workspace?.name ?? "Minha turma"}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={requestNotifications}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Bell className="h-4 w-4" />
                  {notificationPermission === "granted"
                    ? "Notificações ativas"
                    : notificationPermission === "denied"
                    ? "Permissão negada"
                    : notificationPermission === "unsupported"
                    ? "Sem suporte"
                    : "Ativar notificações"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskForm(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <Plus className="h-4 w-4" /> Nova tarefa
                </button>
              </div>
            </div>

            {message && <AlertBanner tone="success" message={message} />}
            {errorMessage && <AlertBanner tone="error" message={errorMessage} />}

            {loadingData ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-[30px] bg-white shadow-panel">
                <div className="flex items-center gap-3 text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> Carregando dados do workspace...
                </div>
              </div>
            ) : (
              <>
                {screen === "dashboard" && (
                  <div className="space-y-5">
                    <section className="rounded-[30px] bg-gradient-to-r from-brand-600 to-sky-500 p-6 text-white shadow-panel">
                      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-blue-100">
                            <Home className="h-4 w-4" /> {workspace?.name} <span className="opacity-60">|</span> {workspace?.school_name}
                          </div>
                          <h2 className="mt-2 text-3xl font-bold">Olá{session?.user?.user_metadata?.full_name ? `, ${session.user.user_metadata.full_name}` : demoMode ? ", João" : ""}!</h2>
                          <p className="mt-2 text-blue-50">Painel central da turma para acompanhar provas, trabalhos e prazos.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <QuickMetric label="Concluídas" value={String(doneCount)} tone="bg-white/15" />
                          <QuickMetric label="Pendentes" value={String(pendingCount)} tone="bg-white/15" />
                          <QuickMetric label="Provas" value={String(upcomingTests.length)} tone="bg-white/15" />
                        </div>
                      </div>
                    </section>

                    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                      <Panel title="Hoje">
                        <div className="space-y-3">
                          {todayTasks.length ? (
                            todayTasks.map((task) => <TaskRow key={task.id} task={task} />)
                          ) : (
                            <EmptyState text="Nenhuma tarefa para hoje." />
                          )}
                        </div>
                      </Panel>

                      <div className="grid gap-5">
                        <Panel title="Próximas Provas">
                          <div className="space-y-3">
                            {upcomingTests.length ? (
                              upcomingTests.map((task) => <CompactTaskRow key={task.id} task={task} />)
                            ) : (
                              <EmptyState text="Sem provas próximas." />
                            )}
                          </div>
                        </Panel>

                        <Panel title="Tarefas Pendentes">
                          <div className="space-y-3">
                            {pendingTasks.length ? (
                              pendingTasks.map((task) => <CompactTaskRow key={task.id} task={task} />)
                            ) : (
                              <EmptyState text="Nenhuma pendência agora." />
                            )}
                          </div>
                        </Panel>
                      </div>
                    </div>

                    <Panel title="Resumo da Semana">
                      <div className="grid gap-4 md:grid-cols-3">
                        <SummaryCard label="Concluídas" value={doneCount} className="bg-brand-600 text-white" />
                        <SummaryCard label="Pendentes" value={pendingCount} className="bg-orange-500 text-white" />
                        <SummaryCard label="Prova na semana" value={upcomingTests.length} className="bg-emerald-500 text-white" />
                      </div>
                    </Panel>
                  </div>
                )}

                {screen === "tasks" && (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900">Tarefas</h2>
                        <p className="mt-1 text-slate-500">Aqui estão a fase 1 e a fase 2 integradas: criação, checklist, prioridade, filtro e anexo.</p>
                      </div>
                    </div>

                    <Panel title="Filtros">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-md">
                          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                          <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por tarefa ou matéria"
                            className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            ["todos", "Todos"],
                            ["proximas", "Próximas"],
                            ["provas", "Provas"],
                            ["concluidas", "Concluídas"],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setTaskFilter(value as typeof taskFilter)}
                              className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-medium transition ${
                                taskFilter === value
                                  ? "bg-brand-600 text-white"
                                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Panel>

                    <div className="grid gap-5 xl:grid-cols-2">
                      {filteredTasks.map((task) => {
                        const progress = calculateProgress(task.checklist_items);
                        return (
                          <div key={task.id} className="rounded-[28px] bg-white p-5 shadow-panel">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${mapPriority(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${mapUrgency(task.due_date)}`}>
                                      {humanDueLabel(task.due_date)}
                                    </span>
                                  </div>
                                  <h3 className="text-xl font-bold text-slate-900">{task.title}</h3>
                                  <p className="text-sm text-slate-500">
                                    {task.subject} • {typeLabel(task.task_type)} • {statusLabel(task.status)}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{formatDate(task.due_date)}</div>
                              </div>

                              {task.description && <p className="text-sm leading-relaxed text-slate-600">{task.description}</p>}

                              <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                  <span className="text-slate-500">Progresso</span>
                                  <span className="font-semibold text-slate-900">{progress}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="font-medium text-slate-800">Checklist</p>
                                {task.checklist_items.length ? (
                                  task.checklist_items.map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => void toggleChecklist(task, item)}
                                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
                                    >
                                      <span className={item.is_done ? "text-slate-400 line-through" : "text-slate-700"}>{item.content}</span>
                                      <CheckCircle2 className={`h-5 w-5 ${item.is_done ? "text-emerald-500" : "text-slate-300"}`} />
                                    </button>
                                  ))
                                ) : (
                                  <EmptyState text="Sem checklist nesta tarefa." compact />
                                )}
                              </div>

                              {task.attachment_name && (
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-brand-600" />
                                    <div>
                                      <p className="font-medium text-slate-800">{task.attachment_name}</p>
                                      <p className="text-sm text-slate-500">Anexo da tarefa</p>
                                    </div>
                                  </div>
                                  {task.attachment_url && task.attachment_url !== "#" ? (
                                    <a
                                      href={task.attachment_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-brand-600 shadow-sm"
                                    >
                                      Abrir
                                    </a>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {screen === "calendar" && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">Calendário</h2>
                      <p className="mt-1 text-slate-500">Visão semanal do MVP para testes rápidos com a turma.</p>
                    </div>
                    <Panel title="Semana atual">
                      <div className="grid gap-4 md:grid-cols-5">
                        {weeklyCalendar.map((day) => (
                          <div key={day.iso} className="min-h-[220px] rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm uppercase text-slate-500">{day.dayLabel}</p>
                                <p className="text-lg font-semibold text-slate-900">{formatDate(day.iso)}</p>
                              </div>
                              <div className={`h-3 w-3 rounded-full ${day.items.length ? "bg-brand-600" : "bg-slate-300"}`} />
                            </div>
                            <div className="mt-4 space-y-3">
                              {day.items.length ? (
                                day.items.map((task) => (
                                  <div key={task.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <p className="font-medium text-slate-800">{task.title}</p>
                                    <p className="mt-1 text-sm text-slate-500">{task.subject}</p>
                                  </div>
                                ))
                              ) : (
                                <EmptyState text="Sem eventos" compact />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  </div>
                )}

                {screen === "workspace" && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">Painel da turma</h2>
                      <p className="mt-1 text-slate-500">Espaço para convite por link, visão coletiva e próximas avaliações.</p>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
                      <Panel title="Próximas avaliações da turma">
                        <div className="space-y-3">
                          {tasks
                            .filter((task) => task.task_type === "prova")
                            .slice(0, 4)
                            .map((task) => (
                              <div key={task.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                                <div>
                                  <p className="font-semibold text-slate-800">{task.subject}</p>
                                  <p className="text-sm text-slate-500">{formatDate(task.due_date)} • {task.title}</p>
                                </div>
                                <span className="text-sm font-semibold text-brand-600">{humanDueLabel(task.due_date)}</span>
                              </div>
                            ))}
                        </div>
                      </Panel>

                      <Panel title="Convite da turma">
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Link de entrada</p>
                            <p className="mt-1 break-all font-semibold text-slate-900">
                              {(typeof window !== "undefined" ? window.location.origin : "http://localhost:3000") + "/join/" + (workspace?.invite_code ?? "sem-codigo")}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void copyInviteLink()}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 font-semibold text-white transition hover:bg-brand-700"
                          >
                            <Copy className="h-4 w-4" /> Copiar link
                          </button>
                          <div className="rounded-2xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-600">
                            <p className="font-medium text-slate-800">Como funciona</p>
                            <p className="mt-2">
                              Quem abrir o link cai na rota de convite e pode entrar no workspace. Para isso, precisa estar autenticado.
                            </p>
                          </div>
                        </div>
                      </Panel>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
        active ? "bg-brand-600 text-white shadow-lg shadow-brand-950/30" : "text-slate-300 hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[30px] bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {task.task_type === "prova" ? <AlertCircle className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{task.title}</p>
          <p className="text-sm text-slate-500">{task.subject}</p>
        </div>
      </div>
      <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${mapUrgency(task.due_date)}`}>{humanDueLabel(task.due_date)}</span>
    </div>
  );
}

function CompactTaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
      <div>
        <p className="font-semibold text-slate-800">{task.subject}</p>
        <p className="text-sm text-slate-500">{task.title}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-brand-600">{humanDueLabel(task.due_date).replace("Em ", "")}</p>
        <p className="text-xs text-slate-400">{formatDate(task.due_date)}</p>
      </div>
    </div>
  );
}

function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 ${compact ? "px-4 py-3 text-sm" : "px-4 py-6"}`}>
      {text}
    </div>
  );
}

function SummaryCard({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-[24px] p-5 ${className}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm opacity-90">{label}</p>
    </div>
  );
}

function QuickMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-[24px] p-4 ${tone}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-blue-50">{label}</p>
    </div>
  );
}

function AlertBanner({ tone, message }: { tone: "success" | "error"; message: string }) {
  const styles = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700";
  return <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${styles}`}>{message}</div>;
}
