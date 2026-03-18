"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, Users } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { Workspace } from "@/lib/types";

export default function JoinWorkspacePage() {
  const params = useParams<{ inviteCode: string }>();
  const inviteCode = params.inviteCode;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteCode) return;
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    void (async () => {
      const query = await supabase.from("workspaces").select("*").eq("invite_code", inviteCode).single();
      if (query.error) {
        setErrorMessage("Convite não encontrado.");
      } else {
        setWorkspace(query.data as Workspace);
      }
      setLoading(false);
    })();
  }, [inviteCode]);

  const disabledReason = useMemo(() => {
    if (!isSupabaseConfigured) return "Configure o Supabase primeiro.";
    if (!workspace) return "Workspace não encontrado.";
    return null;
  }, [workspace]);

  async function handleJoin() {
    if (!supabase || !workspace) return;
    setJoining(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("Faça login no app principal antes de entrar na turma.");
      }

      const existing = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", workspace.id)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (existing.error) throw existing.error;

      if (!existing.data) {
        const insert = await supabase.from("workspace_members").insert({
          workspace_id: workspace.id,
          user_id: session.user.id,
          role: "member",
        });
        if (insert.error) throw insert.error;
      }

      setMessage("Entrada na turma realizada. Agora volte para a página principal.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível entrar na turma.";
      setErrorMessage(message);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-panel">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-[24px] bg-brand-600 text-white">
          <Users className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Entrar na turma</h1>
        <p className="mt-2 text-slate-500">Use este link para participar do workspace compartilhado do ClassBoard.</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Código do convite</p>
          <p className="mt-1 font-semibold text-slate-900">{inviteCode || "..."}</p>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando convite...
            </div>
          ) : workspace ? (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Workspace</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{workspace.name}</p>
              <p className="mt-1 text-slate-600">{workspace.school_name}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorMessage ?? "Convite inválido."}</div>
          )}

          {message && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {message}
            </div>
          )}

          {errorMessage && workspace && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorMessage}</div>
          )}

          <button
            type="button"
            disabled={Boolean(disabledReason) || joining}
            onClick={() => void handleJoin()}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-brand-600 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {joining ? "Entrando..." : "Entrar na turma"}
          </button>

          {disabledReason && !workspace && <p className="text-sm text-slate-500">{disabledReason}</p>}

          <Link href="/" className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 font-medium text-slate-700 transition hover:bg-slate-50">
            Voltar para o app
          </Link>
        </div>
      </div>
    </div>
  );
}
