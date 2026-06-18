import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, ChevronLeft, ChevronRight, Trash2, Pencil, Calendar as CalendarIcon } from "lucide-react";

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
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
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
};

export function ContentCalendar({ productionId }: Props) {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"project" | "manager" | "weekly" | "daily">("weekly");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarTask | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    fetchTasks();
  }, [productionId]);

  async function fetchTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("calendar_tasks")
      .select("*")
      .eq("production_id", productionId)
      .order("scheduled_date", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) {
      toast.error("Failed to load tasks");
    } else {
      setTasks((data as CalendarTask[]) || []);
    }
    setLoading(false);
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
    });
    setDialogOpen(true);
  }

  async function saveTask() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      production_id: productionId,
      title: form.title.trim(),
      description: form.description || null,
      category: form.category,
      status: form.status,
      priority: form.priority,
      scheduled_date: form.scheduled_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      location: form.location || null,
      owner_name: form.owner_name || null,
      manager_name: form.manager_name || null,
      worker_name: form.worker_name || null,
      backup_name: form.backup_name || null,
      notes: form.notes || null,
    };
    const { error } = editing
      ? await supabase.from("calendar_tasks").update(payload).eq("id", editing.id)
      : await supabase.from("calendar_tasks").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Task updated" : "Task created");
    setDialogOpen(false);
    fetchTasks();
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
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

  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dayKey = toISODate(cursor);
  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {};
    tasks.forEach((t) => {
      (map[t.scheduled_date] ||= []).push(t);
    });
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
    const total = tasks.length;
    const by: Record<string, number> = { todo: 0, in_progress: 0, blocked: 0, done: 0 };
    tasks.forEach((t) => {
      by[t.status] = (by[t.status] || 0) + 1;
    });
    return { total, ...by };
  }, [tasks]);

  function TaskCard({ t, compact = false }: { t: CalendarTask; compact?: boolean }) {
    return (
      <div
        className="group rounded-lg border border-slate-700/60 bg-slate-800/60 backdrop-blur-sm p-2 hover:border-amber-600/50 transition"
      >
        <div className="flex items-start justify-between gap-2">
          <button onClick={() => openEdit(t)} className="text-left flex-1 min-w-0">
            <div className="font-medium text-white text-sm truncate">{t.title}</div>
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
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={() => openEdit(t)}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-400" onClick={() => deleteTask(t.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <Badge className={`${STATUS_COLORS[t.status]} text-[10px] px-1.5 py-0`}>{t.status.replace("_", " ")}</Badge>
          <Badge className={`${PRIORITY_COLORS[t.priority]} text-[10px] px-1.5 py-0`}>{t.priority}</Badge>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-500" /> Content Calendar
          </h3>
          <p className="text-sm text-slate-400">Assignable tasks across project, manager, weekly, and daily views.</p>
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
              return (
                <div key={key} className={`rounded-lg border ${isToday ? "border-amber-600/60" : "border-slate-700"} bg-slate-800/40 p-2 min-h-[160px]`}>
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
                    {dayTasks.map((t) => <TaskCard key={t.id} t={t} compact />)}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* DAILY */}
        <TabsContent value="daily" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setCursor(addDays(cursor, -1))} className="border-slate-700"><ChevronLeft className="w-4 h-4" /></Button>
            <div className="text-white font-medium">{cursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())} className="border-slate-700">Today</Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(addDays(cursor, 1))} className="border-slate-700"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          {(tasksByDate[dayKey] || []).length === 0 ? (
            <Card className="bg-slate-800/40 border-slate-700">
              <CardContent className="p-8 text-center text-slate-400">
                No tasks on this day. <Button variant="link" className="text-amber-400 px-1" onClick={() => openNew(cursor)}>Add one</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(tasksByDate[dayKey] || []).map((t) => (
                <Card key={t.id} className="bg-slate-800/60 border-slate-700">
                  <CardContent className="p-3 space-y-2">
                    <TaskCard t={t} />
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
            <div>
              <Label>Owner</Label>
              <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className="bg-slate-800 border-slate-700" />
            </div>
            <div>
              <Label>Manager</Label>
              <Input value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} className="bg-slate-800 border-slate-700" />
            </div>
            <div>
              <Label>Worker</Label>
              <Input value={form.worker_name} onChange={(e) => setForm({ ...form, worker_name: e.target.value })} className="bg-slate-800 border-slate-700" />
            </div>
            <div>
              <Label>Backup Assistant</Label>
              <Input value={form.backup_name} onChange={(e) => setForm({ ...form, backup_name: e.target.value })} className="bg-slate-800 border-slate-700" />
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
    </div>
  );
}
