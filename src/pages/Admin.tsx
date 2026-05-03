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
import { ShieldCheck, ArrowLeft, Trash2, Plus, LogIn, Bug } from "lucide-react";

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

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [filter, setFilter] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "producer" | "crew">("admin");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const loadData = async () => {
    const [{ data: r }, { data: a }, { data: profiles }] = await Promise.all([
      supabase.from("user_roles").select("*").order("role"),
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("user_id, email, full_name"),
    ]);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    setRoles((r || []).map((row: any) => ({
      ...row,
      email: profileMap.get(row.user_id)?.email,
      full_name: profileMap.get(row.user_id)?.full_name,
    })));
    setAudit((a as AuditRow[]) || []);
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
