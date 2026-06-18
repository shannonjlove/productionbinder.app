import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Search, Users } from "lucide-react";
import { toast } from "sonner";

type UserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  isAdmin: boolean;
};

export function UsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("user_id, email, full_name").order("email"),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    const adminSet = new Set((roles || []).map((r: any) => r.user_id));
    setUsers((profiles || []).map((p: any) => ({
      user_id: p.user_id,
      email: p.email,
      full_name: p.full_name,
      isAdmin: adminSet.has(p.user_id),
    })));
    setDirty({});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q)
    );
  }, [users, filter]);

  const toggle = (userId: string, next: boolean) => {
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, isAdmin: next } : u));
    setDirty(prev => ({ ...prev, [userId]: true }));
  };

  const dirtyCount = Object.keys(dirty).length;

  const saveAll = async () => {
    setSaving(true);
    try {
      const changes = users.filter(u => dirty[u.user_id]);
      for (const u of changes) {
        if (u.isAdmin) {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: u.user_id, role: "admin" });
          if (error && !String(error.message).toLowerCase().includes("duplicate")) {
            throw error;
          }
        } else {
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", u.user_id)
            .eq("role", "admin");
          if (error) throw error;
        }
      }
      toast.success(`Saved ${changes.length} change${changes.length === 1 ? "" : "s"}`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 bg-slate-950 border-slate-700"
          />
        </div>
        <Button
          onClick={saveAll}
          disabled={dirtyCount === 0 || saving}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving…" : `Save${dirtyCount ? ` (${dirtyCount})` : ""}`}
        </Button>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400"><Users className="w-3.5 h-3.5 inline mr-1" />User</TableHead>
              <TableHead className="text-slate-400">Email</TableHead>
              <TableHead className="text-slate-400 text-right">Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={3} className="text-center text-slate-500 py-6">Loading users…</TableCell></TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-slate-500 py-6">No users found.</TableCell></TableRow>
            )}
            {filtered.map(u => (
              <TableRow key={u.user_id} className="border-slate-800">
                <TableCell className="text-slate-200">
                  <div className="flex items-center gap-2">
                    <span>{u.full_name || "—"}</span>
                    {dirty[u.user_id] && <Badge variant="secondary" className="text-[10px]">unsaved</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-slate-400 font-mono text-xs">{u.email || "—"}</TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={u.isAdmin}
                    onCheckedChange={(v) => toggle(u.user_id, v)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-slate-500">
        Changes are logged automatically to the Audit Log (table: <span className="font-mono">user_roles</span>).
      </p>
    </div>
  );
}
