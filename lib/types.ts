export type Priority = "alta" | "media" | "baixa";
export type TaskStatus = "pendente" | "em_andamento" | "concluida";
export type TaskType = "prova" | "trabalho" | "atividade" | "apresentacao";

export type Workspace = {
  id: string;
  owner_id: string;
  name: string;
  school_name: string | null;
  workspace_type: "individual" | "grupo" | "turma";
  invite_code: string;
  created_at?: string;
};

export type ChecklistItem = {
  id: string;
  task_id: string;
  content: string;
  is_done: boolean;
  created_at?: string;
};

export type Task = {
  id: string;
  workspace_id: string;
  author_id: string;
  title: string;
  description: string | null;
  subject: string;
  task_type: TaskType;
  due_date: string;
  priority: Priority;
  status: TaskStatus;
  attachment_name: string | null;
  attachment_url: string | null;
  created_at?: string;
  checklist_items: ChecklistItem[];
};

export type TaskFormValues = {
  title: string;
  description: string;
  subject: string;
  taskType: TaskType;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  checklistRaw: string;
  file: File | null;
};
