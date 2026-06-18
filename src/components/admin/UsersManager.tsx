import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Save,
  Search,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type UserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  isAdmin: boolean;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function UsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  // Reset to page 1 when filter or page size changes
  useEffect(() => { setPage(1); }, [filter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const paged = filtered.slice(startIdx, startIdx + pageSize);
  const showingFrom = filtered.length === 0 ? 0 : startIdx + 1;
  const showingTo = Math.min(startIdx + pageSize, filtered.length);

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
              <TableHead className="text-slate-400">Role</TableHead>
              <TableHead className="text-slate-400 text-right">Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-6">Loading users…</TableCell></TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-6">No users found.</TableCell></TableRow>
            )}
            {paged.map(u => (
              <TableRow key={u.user_id} className="border-slate-800">
                <TableCell className="text-slate-200">
                  <div className="flex items-center gap-2">
                    <span>{u.full_name || "—"}</span>
                    {dirty[u.user_id] && <Badge variant="secondary" className="text-[10px]">unsaved</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-slate-400 font-mono text-xs">{u.email || "—"}</TableCell>
                <TableCell>
                  {u.isAdmin ? (
                    <Badge className="bg-amber-600/20 text-amber-300 border border-amber-600/40 hover:bg-amber-600/30">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-700 text-slate-400">
                      <User className="w-3 h-3 mr-1" />
                      User
                    </Badge>
                  )}
                </TableCell>
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="h-8 w-[80px] bg-slate-950 border-slate-700 text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ml-2">
            Showing {showingFrom}–{showingTo} of {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </Button>
          <span className="text-xs text-slate-400 min-w-[80px] text-center">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Changes are logged automatically to the Audit Log (table: <span className="font-mono">user_roles</span>).
      </p>
    </div>
  );
}
