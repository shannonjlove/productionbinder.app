import { useEffect, useMemo, useState, DragEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, ChevronLeft, ChevronRight, Trash2, Pencil, Calendar as CalendarIcon,
  History as HistoryIcon, Bell, Repeat, AlertTriangle, GripVertical,
} from "lucide-react";

interface CalendarTask {
  id: string;
  production_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  priority: string;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  location: string | null;
  owner_name: string | null;
  manager_name: string | null;
  worker_name: string | null;
  backup_name: string | null;
  notes: string | null;
  recurrence: string;
  recurrence_until: string | null;
  recurrence_parent_id: string | null;
  reminder_minutes_before: number | null;
  reminder_sent: boolean;
}

interface HistoryRow {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by_name: string | null;
  note: string | null;
  changed_at: string;
}

interface Props {
  productionId: string;
}

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-600 text-slate-100",
  in_progress: "bg-blue-600 text-white",
  blocked: "bg-red-600 text-white",
  done: "bg-emerald-600 text-white",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-700 text-slate-300",
  medium: "bg-amber-600 text-white",
  high: "bg-orange-600 text-white",
  critical: "bg-red-700 text-white",
};

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfWeek(d: Date) {
  const date = new Date(d);
  date.setDate(date.getDate() - date.getDay());
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d: Date, n: number) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

function expandRecurrence(start: string, rule: string, until: string | null): string[] {
  if (!rule || rule === "none") return [start];
  const dates: string[] = [];
  const end = until ? new Date(until) : addMonths(new Date(start), 3);
  let cur = new Date(start);
  let safety = 0;
  while (cur <= end && safety < 365) {
    dates.push(toISODate(cur));
    if (rule === "daily") cur = addDays(cur, 1);
    else if (rule === "weekly") cur = addDays(cur, 7);
    else if (rule === "monthly") cur = addMonths(cur, 1);
    else break;
    safety++;
  }
  return dates;
}

function minutesUntil(dateStr: string, timeStr: string | null): number {
  const d = new Date(`${dateStr}T${timeStr || "09:00"}:00`);
  return Math.round((d.getTime() - Date.now()) / 60000);
}

const emptyForm = {
  title: "",
  description: "",
  category: "general",
  status: "todo",
  priority: "medium",
  scheduled_date: toISODate(new Date()),
  start_time: "",
  end_time: "",
  location: "",
  owner_name: "",
  manager_name: "",
  worker_name: "",
  backup_name: "",
  notes: "",
  recurrence: "none",
  recurrence_until: "",
  reminder_minutes_before: "",
};

export function ContentCalendar({ productionId }: Props) {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [crewNames, setCrewNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"project" | "manager" | "weekly" | "daily">("weekly");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarTask | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [historyTask, setHistoryTask] = useState<CalendarTask | null>(null);
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([]);
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchCrew();
    const channel = supabase
      .channel(`calendar_tasks_${productionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_tasks", filter: `production_id=eq.${productionId}` }, () => fetchTasks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productionId]);

  // Periodic reminder check
  useEffect(() => {
    const id = setInterval(() => setDismissedReminders((s) => new Set(s)), 60000);
    return () => clearInterval(id);
  }, []);

  async function fetchTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("calendar_tasks")
      .select("*")
      .eq("production_id", productionId)
      .order("scheduled_date", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) toast.error("Failed to load tasks");
    else setTasks((data as CalendarTask[]) || []);
    setLoading(false);
  }

  async function fetchCrew() {
    const { data } = await supabase.from("crew_members").select("name").eq("production_id", productionId);
    const names = Array.from(new Set((data || []).map((c: any) => c.name).filter(Boolean))) as string[];
    setCrewNames(names);
  }

  function openNew(date?: Date) {
    setEditing(null);
    setForm({ ...emptyForm, scheduled_date: toISODate(date || cursor) });
    setDialogOpen(true);
  }

  function openEdit(t: CalendarTask) {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description || "",
      category: t.category || "general",
      status: t.status,
      priority: t.priority,
      scheduled_date: t.scheduled_date,
      start_time: t.start_time || "",
      end_time: t.end_time || "",
      location: t.location || "",
      owner_name: t.owner_name || "",
      manager_name: t.manager_name || "",
      worker_name: t.worker_name || "",
      backup_name: t.backup_name || "",
      notes: t.notes || "",
      recurrence: t.recurrence || "none",
      recurrence_until: t.recurrence_until || "",
      reminder_minutes_before: t.reminder_minutes_before?.toString() || "",
    });
    setDialogOpen(true);
  }

  async function saveTask() {
    if (!form.title.trim()) return toast.error("Title is required");
    const basePayload = {
      production_id: productionId,
      title: form.title.trim(),
      description: form.description || null,
      category: form.category,
      status: form.status,
      priority: form.priority,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      location: form.location || null,
      owner_name: form.owner_name || null,
      manager_name: form.manager_name || null,
      worker_name: form.worker_name || null,
      backup_name: form.backup_name || null,
      notes: form.notes || null,
      recurrence: form.recurrence || "none",
      recurrence_until: form.recurrence_until || null,
      reminder_minutes_before: form.reminder_minutes_before ? parseInt(form.reminder_minutes_before, 10) : null,
    };

    if (editing) {
      const { error } = await supabase
        .from("calendar_tasks")
        .update({ ...basePayload, scheduled_date: form.scheduled_date })
        .eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Task updated");
    } else {
      const dates = expandRecurrence(form.scheduled_date, form.recurrence, form.recurrence_until || null);
      // Create parent first
      const { data: parent, error: pErr } = await supabase
        .from("calendar_tasks")
        .insert({ ...basePayload, scheduled_date: dates[0] })
        .select()
        .single();
      if (pErr) return toast.error(pErr.message);
      if (dates.length > 1) {
        const children = dates.slice(1).map((d) => ({
          ...basePayload,
          scheduled_date: d,
          recurrence: "none",
          recurrence_until: null,
          recurrence_parent_id: parent.id,
        }));
        const { error: cErr } = await supabase.from("calendar_tasks").insert(children);
        if (cErr) toast.error(`Created parent but recurrence failed: ${cErr.message}`);
        else toast.success(`Created ${dates.length} occurrences`);
      } else {
        toast.success("Task created");
      }
    }
    setDialogOpen(false);
    fetchTasks();
  }

  async function deleteTask(id: string, hasChildren = false) {
    const msg = hasChildren
      ? "Delete this recurring task and ALL its future occurrences?"
      : "Delete this task?";
    if (!confirm(msg)) return;
    const { error } = await supabase.from("calendar_tasks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    fetchTasks();
  }

  async function quickStatus(t: CalendarTask, status: string) {
    const { error } = await supabase.from("calendar_tasks").update({ status }).eq("id", t.id);
    if (error) return toast.error(error.message);
    fetchTasks();
  }

  async function rescheduleTask(taskId: string, newDate: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.scheduled_date === newDate) return;
    // optimistic
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, scheduled_date: newDate } : t)));
    const { error } = await supabase.from("calendar_tasks").update({ scheduled_date: newDate }).eq("id", taskId);
    if (error) {
      toast.error(error.message);
      fetchTasks();
    } else {
      toast.success(`Moved to ${newDate}`);
    }
  }

  async function openHistory(t: CalendarTask) {
    setHistoryTask(t);
    const { data } = await supabase
      .from("calendar_task_history")
      .select("*")
      .eq("task_id", t.id)
      .order("changed_at", { ascending: false });
    setHistoryRows((data as HistoryRow[]) || []);
  }

  // Reminders: tasks within reminder window, not done, not dismissed
  const dueReminders = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === "done") return false;
      if (dismissedReminders.has(t.id)) return false;
      const mins = minutesUntil(t.scheduled_date, t.start_time);
      if (t.reminder_minutes_before != null) {
        return mins <= t.reminder_minutes_before && mins >= -60;
      }
      // default: show overdue and today's tasks (within 24h past start)
      return mins <= 0 && mins >= -24 * 60;
    });
  }, [tasks, dismissedReminders]);

  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dayKey = toISODate(cursor);
  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {};
    tasks.forEach((t) => { (map[t.scheduled_date] ||= []).push(t); });
    return map;
  }, [tasks]);

  const managerGroups = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {};
    tasks.forEach((t) => {
      const k = t.manager_name?.trim() || "Unassigned";
      (map[k] ||= []).push(t);
    });
    return map;
  }, [tasks]);

  const projectStats = useMemo(() => {
    const by: Record<string, number> = { todo: 0, in_progress: 0, blocked: 0, done: 0 };
    tasks.forEach((t) => { by[t.status] = (by[t.status] || 0) + 1; });
    return { total: tasks.length, todo: by.todo, in_progress: by.in_progress, blocked: by.blocked, done: by.done };
  }, [tasks]);

  // ---------- Drag-and-drop handlers ----------
  function onDragStart(e: DragEvent<HTMLDivElement>, taskId: string) {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDayDragOver(e: DragEvent<HTMLDivElement>, key: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDate !== key) setDragOverDate(key);
  }
  function onDayDrop(e: DragEvent<HTMLDivElement>, newDate: string) {
    e.preventDefault();
    setDragOverDate(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) rescheduleTask(id, newDate);
  }

  function PersonSelect({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
      <div className="space-y-1.5">
        <Input
          list="crew-names-list"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-800 border-slate-700"
          placeholder={placeholder}
        />
      </div>
    );
  }

  function TaskCard({ t, compact = false, draggable = false }: { t: CalendarTask; compact?: boolean; draggable?: boolean }) {
    const overdue = t.status !== "done" && minutesUntil(t.scheduled_date, t.start_time) < 0;
    return (
      <div
        draggable={draggable}
        onDragStart={draggable ? (e) => onDragStart(e, t.id) : undefined}
        className={`group rounded-lg border ${overdue ? "border-red-700/60" : "border-slate-700/60"} bg-slate-800/60 backdrop-blur-sm p-2 hover:border-amber-600/50 transition ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <button onClick={() => openEdit(t)} className="text-left flex-1 min-w-0">
            <div className="font-medium text-white text-sm truncate flex items-center gap-1">
              {draggable && <GripVertical className="w-3 h-3 text-slate-500 shrink-0" />}
              {t.recurrence && t.recurrence !== "none" && <Repeat className="w-3 h-3 text-amber-400 shrink-0" />}
              {t.recurrence_parent_id && <Repeat className="w-3 h-3 text-slate-500 shrink-0" />}
              <span className="truncate">{t.title}</span>
            </div>
            {!compact && t.description && (
              <div className="text-xs text-slate-400 truncate">{t.description}</div>
            )}
            {(t.start_time || t.location) && (
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {t.start_time?.slice(0, 5)}
                {t.start_time && t.end_time ? `–${t.end_time.slice(0, 5)}` : ""}
                {t.location ? ` · ${t.location}` : ""}
              </div>
            )}
          </button>
          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={() => openHistory(t)} title="History">
              <HistoryIcon className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={() => openEdit(t)}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-400" onClick={() => deleteTask(t.id, t.recurrence !== "none")}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <Badge className={`${STATUS_COLORS[t.status]} text-[10px] px-1.5 py-0`}>{t.status.replace("_", " ")}</Badge>
          <Badge className={`${PRIORITY_COLORS[t.priority]} text-[10px] px-1.5 py-0`}>{t.priority}</Badge>
          {t.reminder_minutes_before != null && (
            <Badge className="bg-indigo-700 text-white text-[10px] px-1.5 py-0 flex items-center gap-0.5">
              <Bell className="w-2.5 h-2.5" /> {t.reminder_minutes_before}m
            </Badge>
          )}
          {overdue && (
            <Badge className="bg-red-700 text-white text-[10px] px-1.5 py-0 flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> overdue
            </Badge>
          )}
        </div>
        {(t.owner_name || t.manager_name || t.worker_name || t.backup_name) && !compact && (
          <div className="text-[10px] text-slate-400 mt-1.5 space-y-0.5">
            {t.manager_name && <div><span className="text-slate-500">Mgr:</span> {t.manager_name}</div>}
            {t.owner_name && <div><span className="text-slate-500">Owner:</span> {t.owner_name}</div>}
            {t.worker_name && <div><span className="text-slate-500">Worker:</span> {t.worker_name}</div>}
            {t.backup_name && <div><span className="text-slate-500">Backup:</span> {t.backup_name}</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <datalist id="crew-names-list">
        {crewNames.map((n) => <option key={n} value={n} />)}
      </datalist>

      {/* Reminders banner */}
      {dueReminders.length > 0 && (
        <Card className="bg-amber-950/40 border-amber-700/60">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-medium text-sm">
                <Bell className="w-4 h-4" /> {dueReminders.length} reminder{dueReminders.length === 1 ? "" : "s"}
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-300" onClick={() => setDismissedReminders(new Set(dueReminders.map((t) => t.id)))}>
                Dismiss all
              </Button>
            </div>
            <div className="space-y-1">
              {dueReminders.slice(0, 5).map((t) => {
                const mins = minutesUntil(t.scheduled_date, t.start_time);
                return (
                  <div key={t.id} className="flex items-center justify-between gap-2 text-xs">
                    <button onClick={() => openEdit(t)} className="text-left flex-1 min-w-0 truncate text-white hover:text-amber-300">
                      {mins < 0 ? `Overdue by ${-mins}m` : `Due in ${mins}m`} · {t.title}
                    </button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-slate-300" onClick={() => setDismissedReminders((s) => new Set([...s, t.id]))}>
                      ✕
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-500" /> Content Calendar
          </h3>
          <p className="text-sm text-slate-400">Drag tasks between days · recurring tasks · reminders · status history.</p>
        </div>
        <Button onClick={() => openNew()} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" /> New Task
        </Button>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="project">Project</TabsTrigger>
          <TabsTrigger value="manager">By Manager</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
        </TabsList>

        {/* PROJECT */}
        <TabsContent value="project" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total", value: projectStats.total, color: "text-white" },
              { label: "To Do", value: projectStats.todo || 0, color: "text-slate-200" },
              { label: "In Progress", value: projectStats.in_progress || 0, color: "text-blue-400" },
              { label: "Blocked", value: projectStats.blocked || 0, color: "text-red-400" },
              { label: "Done", value: projectStats.done || 0, color: "text-emerald-400" },
            ].map((s) => (
              <Card key={s.label} className="bg-slate-800/60 border-slate-700">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-400">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          {loading ? (
            <div className="text-slate-400">Loading…</div>
          ) : tasks.length === 0 ? (
            <Card className="bg-slate-800/40 border-slate-700"><CardContent className="p-8 text-center text-slate-400">No tasks yet. Click “New Task” to add one.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tasks.map((t) => (
                <div key={t.id} className="space-y-2">
                  <div className="text-xs text-slate-400">{t.scheduled_date}</div>
                  <TaskCard t={t} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* MANAGER */}
        <TabsContent value="manager" className="mt-4 space-y-4">
          {Object.keys(managerGroups).length === 0 ? (
            <Card className="bg-slate-800/40 border-slate-700"><CardContent className="p-8 text-center text-slate-400">No tasks yet.</CardContent></Card>
          ) : (
            Object.entries(managerGroups).map(([mgr, list]) => (
              <Card key={mgr} className="bg-slate-800/60 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base flex items-center justify-between">
                    <span>{mgr}</span>
                    <Badge className="bg-slate-700 text-slate-200">{list.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((t) => <TaskCard key={t.id} t={t} />)}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* WEEKLY */}
        <TabsContent value="weekly" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setCursor(addDays(cursor, -7))} className="border-slate-700"><ChevronLeft className="w-4 h-4" /></Button>
            <div className="text-white font-medium">
              {weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – {weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())} className="border-slate-700">Today</Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(addDays(cursor, 7))} className="border-slate-700"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {weekDays.map((d) => {
              const key = toISODate(d);
              const dayTasks = tasksByDate[key] || [];
              const isToday = key === toISODate(new Date());
              const isDragOver = dragOverDate === key;
              return (
                <div
                  key={key}
                  onDragOver={(e) => onDayDragOver(e, key)}
                  onDragLeave={() => setDragOverDate((c) => (c === key ? null : c))}
                  onDrop={(e) => onDayDrop(e, key)}
                  className={`rounded-lg border ${isDragOver ? "border-amber-500 bg-amber-950/20" : isToday ? "border-amber-600/60" : "border-slate-700"} bg-slate-800/40 p-2 min-h-[160px] transition-colors`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                      <div className={`text-sm font-semibold ${isToday ? "text-amber-400" : "text-white"}`}>{d.getDate()}</div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-amber-400" onClick={() => openNew(d)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {dayTasks.map((t) => <TaskCard key={t.id} t={t} compact draggable />)}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* DAILY */}
        <TabsContent value="daily" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setCursor(addDays(cursor, -1))} className="border-slate-700"><ChevronLeft className="w-4 h-4" /></Button>
            <div
              onDragOver={(e) => onDayDragOver(e, dayKey)}
              onDragLeave={() => setDragOverDate((c) => (c === dayKey ? null : c))}
              onDrop={(e) => onDayDrop(e, dayKey)}
              className={`flex-1 text-center text-white font-medium py-2 rounded-lg border ${dragOverDate === dayKey ? "border-amber-500 bg-amber-950/20" : "border-transparent"}`}
            >
              {cursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())} className="border-slate-700">Today</Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(addDays(cursor, 1))} className="border-slate-700"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          {(tasksByDate[dayKey] || []).length === 0 ? (
            <Card className="bg-slate-800/40 border-slate-700">
              <CardContent className="p-8 text-center text-slate-400">
                No tasks on this day. <Button variant="link" className="text-amber-400 px-1" onClick={() => openNew(cursor)}>Add one</Button>
                <div className="text-xs text-slate-500 mt-2">Tip: drag a task from another day onto the date header above to reschedule.</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(tasksByDate[dayKey] || []).map((t) => (
                <Card key={t.id} className="bg-slate-800/60 border-slate-700">
                  <CardContent className="p-3 space-y-2">
                    <TaskCard t={t} draggable />
                    <div className="flex gap-1 flex-wrap">
                      {["todo", "in_progress", "blocked", "done"].map((s) => (
                        <Button key={s} size="sm" variant={t.status === s ? "default" : "outline"} className={`h-7 text-xs ${t.status === s ? "bg-amber-600 hover:bg-amber-700" : "border-slate-700"}`} onClick={() => quickStatus(t, s)}>
                          {s.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Task edit/create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700" rows={2} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="bg-slate-800 border-slate-700" />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-slate-800 border-slate-700" placeholder="general / production / post / marketing" />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="bg-slate-800 border-slate-700" />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="bg-slate-800 border-slate-700" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-slate-800 border-slate-700" />
            </div>

            {/* Assignments */}
            <div className="md:col-span-2 border-t border-slate-700 pt-3">
              <div className="text-xs uppercase text-slate-500 mb-2">Assignments (type or pick from crew)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Owner</Label><PersonSelect value={form.owner_name} onChange={(v) => setForm({ ...form, owner_name: v })} placeholder="Owner" /></div>
                <div><Label>Manager</Label><PersonSelect value={form.manager_name} onChange={(v) => setForm({ ...form, manager_name: v })} placeholder="Manager" /></div>
                <div><Label>Worker</Label><PersonSelect value={form.worker_name} onChange={(v) => setForm({ ...form, worker_name: v })} placeholder="Worker" /></div>
                <div><Label>Backup Assistant</Label><PersonSelect value={form.backup_name} onChange={(v) => setForm({ ...form, backup_name: v })} placeholder="Backup" /></div>
              </div>
            </div>

            {/* Recurrence */}
            <div className="md:col-span-2 border-t border-slate-700 pt-3">
              <div className="text-xs uppercase text-slate-500 mb-2 flex items-center gap-1"><Repeat className="w-3 h-3" /> Recurrence</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Repeat</Label>
                  <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v })} disabled={!!editing}>
                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Does not repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  {editing && <div className="text-[11px] text-slate-500 mt-1">Edit applies to this occurrence only.</div>}
                </div>
                <div>
                  <Label>Repeat until</Label>
                  <Input type="date" value={form.recurrence_until} onChange={(e) => setForm({ ...form, recurrence_until: e.target.value })} className="bg-slate-800 border-slate-700" disabled={form.recurrence === "none" || !!editing} />
                </div>
              </div>
            </div>

            {/* Reminders */}
            <div className="md:col-span-2 border-t border-slate-700 pt-3">
              <div className="text-xs uppercase text-slate-500 mb-2 flex items-center gap-1"><Bell className="w-3 h-3" /> Reminder</div>
              <div>
                <Label>Notify (minutes before start)</Label>
                <Input type="number" min="0" value={form.reminder_minutes_before} onChange={(e) => setForm({ ...form, reminder_minutes_before: e.target.value })} className="bg-slate-800 border-slate-700" placeholder="e.g. 15" />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-slate-800 border-slate-700" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={saveTask} className="bg-amber-600 hover:bg-amber-700">{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyTask} onOpenChange={(o) => !o && setHistoryTask(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><HistoryIcon className="w-4 h-4" /> Status History</DialogTitle>
          </DialogHeader>
          {historyTask && (
            <div className="space-y-2">
              <div className="text-sm text-slate-300">{historyTask.title}</div>
              {historyRows.length === 0 ? (
                <div className="text-sm text-slate-500">No history yet.</div>
              ) : (
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {historyRows.map((h) => (
                    <li key={h.id} className="text-xs border-l-2 border-amber-600/60 pl-3 py-1">
                      <div className="text-slate-300">
                        {h.from_status ? <><Badge className={`${STATUS_COLORS[h.from_status]} text-[10px] px-1.5 py-0 mr-1`}>{h.from_status}</Badge> → </> : null}
                        <Badge className={`${STATUS_COLORS[h.to_status]} text-[10px] px-1.5 py-0`}>{h.to_status}</Badge>
                      </div>
                      <div className="text-slate-500 mt-0.5">{new Date(h.changed_at).toLocaleString()}{h.note ? ` · ${h.note}` : ""}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
