import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft, Trash2, Plus, LogIn, Bug, Globe, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

type RoleRow = { id: string; user_id: string; role: string; email?: string | null; full_name?: string | null };
type AuditRow = {
  id: string;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  created_at: string;
  new_data: any;
  old_data: any;
};
type SignInRow = {
  id: string; email: string | null; event_type: string; user_agent: string | null;
  ip_address: string | null; metadata: any; created_at: string;
};
type DebugRow = {
  id: string; level: string; source: string | null; message: string;
  context: any; url: string | null; created_at: string;
};
type DomainRow = {
  id: string; domain: string; record_type: string; name: string;
  value: string; notes: string | null;
};
type AutoAdminRow = { email: string; created_at: string };
type DomainCheck = { url: string; status: number | null; ok: boolean; error?: string };

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [signIns, setSignIns] = useState<SignInRow[]>([]);
  const [debugEvents, setDebugEvents] = useState<DebugRow[]>([]);
  const [filter, setFilter] = useState("");
  const [signInFilter, setSignInFilter] = useState("");
  const [debugFilter, setDebugFilter] = useState("");
  const [debugLevel, setDebugLevel] = useState<string>("all");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "producer" | "crew">("admin");
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [autoAdmins, setAutoAdmins] = useState<AutoAdminRow[]>([]);
  const [newAutoEmail, setNewAutoEmail] = useState("");
  const [newDomain, setNewDomain] = useState({ domain: "productionbinder.app", record_type: "A", name: "", value: "", notes: "" });
  const [checks, setChecks] = useState<DomainCheck[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const loadData = async () => {
    const [{ data: r }, { data: a }, { data: profiles }, { data: si }, { data: de }, { data: dom }, { data: aa }] = await Promise.all([
      supabase.from("user_roles").select("*").order("role"),
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("user_id, email, full_name"),
      supabase.from("sign_in_log").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("debug_events").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("domain_records").select("*").order("domain").order("record_type"),
      supabase.from("auto_admin_emails").select("*").order("created_at"),
    ]);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    setRoles((r || []).map((row: any) => ({
      ...row,
      email: profileMap.get(row.user_id)?.email,
      full_name: profileMap.get(row.user_id)?.full_name,
    })));
    setAudit((a as AuditRow[]) || []);
    setSignIns((si as SignInRow[]) || []);
    setDebugEvents((de as DebugRow[]) || []);
    setDomains((dom as DomainRow[]) || []);
    setAutoAdmins((aa as AutoAdminRow[]) || []);
  };

  const runDomainChecks = async () => {
    setChecking(true);
    const urls = [
      "https://productionbinder.app",
      "https://www.productionbinder.app",
      "https://production-binder-app.lovable.app",
    ];
    const results = await Promise.all(urls.map(async (url) => {
      try {
        const r = await fetch(url, { method: "GET", mode: "no-cors" });
        return { url, status: r.status || 0, ok: true } as DomainCheck;
      } catch (e: any) {
        return { url, status: null, ok: false, error: e?.message || "fetch failed" } as DomainCheck;
      }
    }));
    setChecks(results);
    setChecking(false);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  if (authLoading || roleLoading) return <div className="p-8 text-slate-300">Loading…</div>;
  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center text-slate-300">
      <Card className="max-w-md bg-slate-900/60 border-slate-700">
        <CardHeader><CardTitle className="text-slate-100">Admin only</CardTitle></CardHeader>
        <CardContent>You don't have permission to view this page.</CardContent>
      </Card>
    </div>
  );

  const removeRole = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Role removed"); loadData(); }
  };

  const addRole = async () => {
    if (!newEmail) return;
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", newEmail).maybeSingle();
    if (!profile) { toast.error("No user found with that email"); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: profile.user_id, role: newRole });
    if (error) toast.error(error.message); else { toast.success("Role granted"); setNewEmail(""); loadData(); }
  };

  const filteredAudit = audit.filter(a =>
    !filter ||
    a.table_name.includes(filter) ||
    a.action.toLowerCase().includes(filter.toLowerCase()) ||
    (a.user_email || "").toLowerCase().includes(filter.toLowerCase())
  );

  const filteredSignIns = signIns.filter(s =>
    !signInFilter ||
    (s.email || "").toLowerCase().includes(signInFilter.toLowerCase()) ||
    s.event_type.toLowerCase().includes(signInFilter.toLowerCase())
  );

  const filteredDebug = debugEvents.filter(d =>
    (debugLevel === "all" || d.level === debugLevel) &&
    (!debugFilter ||
      d.message.toLowerCase().includes(debugFilter.toLowerCase()) ||
      (d.source || "").toLowerCase().includes(debugFilter.toLowerCase()))
  );

  const clearDebug = async () => {
    if (!confirm("Delete all debug events?")) return;
    const { error } = await supabase.from("debug_events").delete().not("id", "is", null);
    if (error) toast.error(error.message);
    else { toast.success("Debug events cleared"); loadData(); }
  };

  const eventBadge = (t: string) => {
    if (t === "sign_in_failed") return "destructive" as const;
    if (t === "sign_in") return "default" as const;
    return "secondary" as const;
  };

  const levelBadge = (l: string) => {
    if (l === "error") return "destructive" as const;
    if (l === "warn") return "default" as const;
    return "secondary" as const;
  };

  return (
    <div className="min-h-screen p-6 bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-amber-500" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <Link to="/"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
        </div>

        <Tabs defaultValue="roles">
          <TabsList className="bg-slate-900 border border-slate-700">
            <TabsTrigger value="roles">User Roles</TabsTrigger>
            <TabsTrigger value="signins"><LogIn className="w-3.5 h-3.5 mr-1" />Sign-in Log</TabsTrigger>
            <TabsTrigger value="debug"><Bug className="w-3.5 h-3.5 mr-1" />Debug</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <Card className="bg-slate-900/60 border-slate-700">
              <CardHeader><CardTitle>Manage Roles</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="user email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="bg-slate-950 border-slate-700" />
                  <select value={newRole} onChange={e => setNewRole(e.target.value as any)} className="bg-slate-950 border border-slate-700 rounded-md px-3 text-sm">
                    <option value="admin">admin</option>
                    <option value="producer">producer</option>
                    <option value="crew">crew</option>
                  </select>
                  <Button onClick={addRole}><Plus className="w-4 h-4 mr-1" />Grant</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead></TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.full_name || "—"}</TableCell>
                        <TableCell className="text-slate-400">{r.email || r.user_id.slice(0, 8)}</TableCell>
                        <TableCell><Badge variant={r.role === "admin" ? "default" : "secondary"}>{r.role}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => removeRole(r.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signins">
            <Card className="bg-slate-900/60 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Sign-in Log
                  <Input placeholder="filter by email or event…" value={signInFilter} onChange={e => setSignInFilter(e.target.value)} className="max-w-xs bg-slate-950 border-slate-700" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>When</TableHead><TableHead>Email</TableHead><TableHead>Event</TableHead><TableHead>User Agent</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSignIns.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs text-slate-400 whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-slate-300">{s.email || "—"}</TableCell>
                        <TableCell><Badge variant={eventBadge(s.event_type)}>{s.event_type}</Badge></TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-md truncate">{s.user_agent}</TableCell>
                      </TableRow>
                    ))}
                    {filteredSignIns.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-8">No sign-in events</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debug">
            <Card className="bg-slate-900/60 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                  <span>Debug Events</span>
                  <div className="flex items-center gap-2">
                    <select value={debugLevel} onChange={e => setDebugLevel(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-md px-3 text-sm h-9">
                      <option value="all">all levels</option>
                      <option value="error">error</option>
                      <option value="warn">warn</option>
                      <option value="info">info</option>
                      <option value="debug">debug</option>
                    </select>
                    <Input placeholder="filter…" value={debugFilter} onChange={e => setDebugFilter(e.target.value)} className="max-w-xs bg-slate-950 border-slate-700" />
                    <Button variant="outline" size="sm" onClick={loadData}>Refresh</Button>
                    <Button variant="destructive" size="sm" onClick={clearDebug}><Trash2 className="w-3.5 h-3.5 mr-1" />Clear</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Timestamp</TableHead><TableHead>Level</TableHead><TableHead>Source</TableHead><TableHead>Message</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDebug.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="text-xs text-slate-400 whitespace-nowrap font-mono">{new Date(d.created_at).toISOString()}</TableCell>
                        <TableCell><Badge variant={levelBadge(d.level)}>{d.level}</Badge></TableCell>
                        <TableCell className="font-mono text-xs text-slate-400">{d.source || "—"}</TableCell>
                        <TableCell className="text-sm">
                          <div className="text-slate-200">{d.message}</div>
                          {d.context && (
                            <pre className="text-[10px] text-slate-500 mt-1 max-w-2xl overflow-x-auto">{JSON.stringify(d.context, null, 2)}</pre>
                          )}
                          {d.url && <div className="text-[10px] text-slate-600 mt-1 truncate">{d.url}</div>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredDebug.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-8">No debug events</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="bg-slate-900/60 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Audit Log
                  <Input placeholder="filter…" value={filter} onChange={e => setFilter(e.target.value)} className="max-w-xs bg-slate-950 border-slate-700" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>When</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Table</TableHead><TableHead>Record</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudit.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-slate-300">{a.user_email || "system"}</TableCell>
                        <TableCell><Badge variant={a.action === "DELETE" ? "destructive" : "secondary"}>{a.action}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{a.table_name}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-400">{a.record_id?.slice(0, 8)}</TableCell>
                      </TableRow>
                    ))}
                    {filteredAudit.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">No entries</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
