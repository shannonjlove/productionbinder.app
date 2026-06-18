import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Plus, Pencil, Trash2, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
}

function actionMeta(action: string) {
  switch (action) {
    case "INSERT":
      return { label: "Created", Icon: Plus, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    case "UPDATE":
      return { label: "Updated", Icon: Pencil, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    case "DELETE":
      return { label: "Deleted", Icon: Trash2, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
    default:
      return { label: action, Icon: Circle, color: "text-slate-300 bg-slate-500/10 border-slate-500/30" };
  }
}

function summarize(entry: AuditEntry): string {
  const data = entry.new_data || entry.old_data || {};
  const candidate =
    data.name ||
    data.title ||
    data.full_name ||
    data.scene_number ||
    data.email ||
    entry.record_id?.slice(0, 8);
  return candidate ? String(candidate) : "record";
}

export function ActivityFeedPanel() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel("audit_log_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_log" },
        (payload) => {
          setEntries((prev) => [payload.new as AuditEntry, ...prev].slice(0, 200));
          if (!open) setNewCount((c) => c + 1);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setNewCount(0);
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!cancelled) {
        setEntries((data as AuditEntry[]) || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-slate-300 hover:text-white hover:bg-slate-700/50"
          aria-label="Open activity feed"
        >
          <Activity className="w-4 h-4 mr-2" />
          Activity
          {newCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-[10px] font-semibold text-slate-900 flex items-center justify-center">
              {newCount > 99 ? "99+" : newCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-slate-900/95 backdrop-blur-xl border-slate-700 text-slate-100 w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="px-5 py-4 border-b border-slate-700">
          <SheetTitle className="text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            Live Activity
          </SheetTitle>
          <SheetDescription className="text-slate-400 text-xs">
            Real-time stream of changes, updates, and who made them.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {loading && entries.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">Loading activity…</p>
            )}
            {!loading && entries.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">
                No activity yet. Changes will appear here in real time.
              </p>
            )}
            {entries.map((entry) => {
              const meta = actionMeta(entry.action);
              const Icon = meta.Icon;
              const who = entry.user_email || "system";
              const what = summarize(entry);
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-md border ${meta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="border-slate-600 text-slate-300 text-[10px] uppercase tracking-wide">
                          {entry.table_name.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 mt-1 truncate">
                        <span className="font-medium">{meta.label}</span>{" "}
                        <span className="text-slate-400">{what}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">by {who}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
