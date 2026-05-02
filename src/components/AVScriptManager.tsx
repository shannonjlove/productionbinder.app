import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Save, FileText, Clock, Download, History, Grid3x3, Table2, RotateCcw, FileSpreadsheet, Eye } from "lucide-react";
import jsPDF from "jspdf";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableRow } from "./SortableRow";

interface AVScript {
  id: string;
  name: string;
  production_id: string;
  created_at: string;
  updated_at: string;
}

interface AVScriptEntry {
  id: string;
  script_id: string;
  segment: string | null;
  visual: string | null;
  audio: string | null;
  notes: string | null;
  duration: string | null;
  sort_order: number;
}

interface AVScriptManagerProps {
  productionId: string;
}

type PacingType = "slow" | "medium" | "fast";

const PACING_RATES: Record<PacingType, number> = {
  slow: 120,
  medium: 150,
  fast: 180,
};

export function AVScriptManager({ productionId }: AVScriptManagerProps) {
  const [scripts, setScripts] = useState<AVScript[]>([]);
  const [selectedScript, setSelectedScript] = useState<AVScript | null>(null);
  const [entries, setEntries] = useState<AVScriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newScriptName, setNewScriptName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pacing, setPacing] = useState<PacingType>("medium");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [versions, setVersions] = useState<Array<{ id: string; version_number: number; label: string | null; snapshot: any; created_at: string }>>([]);
  const [previewVersion, setPreviewVersion] = useState<{ id: string; version_number: number; label: string | null; snapshot: any; created_at: string } | null>(null);
  const [versionLabel, setVersionLabel] = useState("");
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);

  const COLS: Array<{ key: keyof AVScriptEntry; label: string }> = [
    { key: "segment", label: "Segment" },
    { key: "visual", label: "Visual" },
    { key: "audio", label: "Audio" },
    { key: "notes", label: "Notes" },
  ];

  useEffect(() => {
    fetchScripts();
  }, [productionId]);

  useEffect(() => {
    if (selectedScript) {
      fetchEntries(selectedScript.id);
      fetchVersions(selectedScript.id);
    }
  }, [selectedScript]);

  const fetchVersions = async (scriptId: string) => {
    const { data } = await supabase
      .from("av_script_versions")
      .select("*")
      .eq("script_id", scriptId)
      .order("version_number", { ascending: false });
    setVersions(data || []);
  };

  const saveVersion = async () => {
    if (!selectedScript) return;
    const nextNum = versions.length > 0 ? versions[0].version_number + 1 : 1;
    const { error } = await supabase.from("av_script_versions").insert({
      script_id: selectedScript.id,
      version_number: nextNum,
      label: versionLabel || `v${nextNum}`,
      snapshot: entries as any,
    });
    if (error) {
      toast.error("Failed to save version");
    } else {
      toast.success(`Saved version ${nextNum}`);
      setVersionLabel("");
      fetchVersions(selectedScript.id);
    }
  };

  const restoreVersion = async (snapshot: any[]) => {
    if (!selectedScript) return;
    if (!confirm("Replace current entries with this version?")) return;
    await supabase.from("av_script_entries").delete().eq("script_id", selectedScript.id);
    const rows = snapshot.map((e: any, idx: number) => ({
      script_id: selectedScript.id,
      segment: e.segment ?? "",
      visual: e.visual ?? "",
      audio: e.audio ?? "",
      notes: e.notes ?? "",
      duration: e.duration ?? "00:00",
      sort_order: idx,
    }));
    if (rows.length > 0) await supabase.from("av_script_entries").insert(rows);
    fetchEntries(selectedScript.id);
    toast.success("Version restored");
  };

  const exportToCSV = () => {
    if (!selectedScript || entries.length === 0) {
      toast.error("No entries to export");
      return;
    }
    const esc = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const header = ["Segment", "Visual", "Audio", "Notes", "Duration"].join(",");
    const rows = entries.map(e =>
      [e.segment || "", e.visual || "", e.audio || "", e.notes || "", e.duration || ""].map(esc).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedScript.name.replace(/\s+/g, "_")}_av_script.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const fetchScripts = async () => {
    const { data, error } = await supabase
      .from("av_scripts")
      .select("*")
      .eq("production_id", productionId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load scripts");
      console.error(error);
    } else {
      setScripts(data || []);
      if (data && data.length > 0 && !selectedScript) {
        setSelectedScript(data[0]);
      }
    }
    setLoading(false);
  };

  const fetchEntries = async (scriptId: string) => {
    const { data, error } = await supabase
      .from("av_script_entries")
      .select("*")
      .eq("script_id", scriptId)
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error("Failed to load script entries");
      console.error(error);
    } else {
      setEntries(data || []);
    }
  };

  const createScript = async () => {
    if (!newScriptName.trim()) {
      toast.error("Please enter a script name");
      return;
    }

    const { data, error } = await supabase
      .from("av_scripts")
      .insert({
        name: newScriptName,
        production_id: productionId,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create script");
      console.error(error);
    } else {
      setScripts([data, ...scripts]);
      setSelectedScript(data);
      setNewScriptName("");
      setDialogOpen(false);
      toast.success("Script created");
    }
  };

  const deleteScript = async (scriptId: string) => {
    const { error } = await supabase
      .from("av_scripts")
      .delete()
      .eq("id", scriptId);

    if (error) {
      toast.error("Failed to delete script");
      console.error(error);
    } else {
      setScripts(scripts.filter(s => s.id !== scriptId));
      if (selectedScript?.id === scriptId) {
        setSelectedScript(scripts.find(s => s.id !== scriptId) || null);
      }
      toast.success("Script deleted");
    }
  };

  const addEntry = async () => {
    if (!selectedScript) return;

    const maxOrder = entries.length > 0 ? Math.max(...entries.map(e => e.sort_order)) : 0;

    const { data, error } = await supabase
      .from("av_script_entries")
      .insert({
        script_id: selectedScript.id,
        sort_order: maxOrder + 1,
        segment: "",
        visual: "",
        audio: "",
        notes: "",
        duration: "00:00",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add entry");
      console.error(error);
    } else {
      setEntries([...entries, data]);
    }
  };

  const updateEntry = async (id: string, field: keyof AVScriptEntry, value: string | number) => {
    // Optimistic update
    setEntries(prev => prev.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));

    const { error } = await supabase
      .from("av_script_entries")
      .update({ [field]: value } as any)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update entry");
      console.error(error);
      // Revert on error
      fetchEntries(selectedScript!.id);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(entries, oldIndex, newIndex).map((e, idx) => ({
      ...e,
      sort_order: idx,
    }));
    setEntries(reordered);

    await Promise.all(
      reordered.map((e) =>
        supabase.from("av_script_entries").update({ sort_order: e.sort_order }).eq("id", e.id)
      )
    );
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from("av_script_entries")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete entry");
      console.error(error);
    } else {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const countWords = (text: string | null): number => {
    if (!text || text.trim() === "") return 0;
    return text.trim().split(/\s+/).length;
  };

  const calculateDuration = (wordCount: number): string => {
    if (wordCount === 0) return "00:00";
    const wordsPerMinute = PACING_RATES[pacing];
    const minutes = wordCount / wordsPerMinute;
    const totalSeconds = Math.round(minutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalDuration = (): string => {
    const totalSeconds = entries.reduce((sum, entry) => {
      const wordCount = countWords(entry.audio);
      const duration = calculateDuration(wordCount);
      const [mins, secs] = duration.split(":").map(Number);
      return sum + mins * 60 + secs;
    }, 0);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalWords = (): number => {
    return entries.reduce((sum, entry) => sum + countWords(entry.audio), 0);
  };

  const exportToPDF = () => {
    if (!selectedScript || entries.length === 0) {
      toast.error("No entries to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.text(selectedScript.name, pageWidth / 2, 20, { align: "center" });
    
    // Stats
    doc.setFontSize(10);
    doc.text(`Total Duration: ${getTotalDuration()} | Total Words: ${getTotalWords()}`, pageWidth / 2, 30, { align: "center" });
    
    let yPos = 45;
    const lineHeight = 7;
    const colWidths = [30, 75, 75];
    const startX = 15;
    
    // Header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Segment", startX, yPos);
    doc.text("Visual", startX + colWidths[0], yPos);
    doc.text("Audio", startX + colWidths[0] + colWidths[1], yPos);
    yPos += lineHeight;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    entries.forEach((entry) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const segment = entry.segment || "";
      const visual = entry.visual || "";
      const audio = entry.audio || "";
      
      const maxLines = Math.max(
        doc.splitTextToSize(segment, colWidths[0] - 5).length,
        doc.splitTextToSize(visual, colWidths[1] - 5).length,
        doc.splitTextToSize(audio, colWidths[2] - 5).length
      );
      
      doc.text(doc.splitTextToSize(segment, colWidths[0] - 5), startX, yPos);
      doc.text(doc.splitTextToSize(visual, colWidths[1] - 5), startX + colWidths[0], yPos);
      doc.text(doc.splitTextToSize(audio, colWidths[2] - 5), startX + colWidths[0] + colWidths[1], yPos);
      
      yPos += lineHeight * maxLines + 3;
    });
    
    doc.save(`${selectedScript.name.replace(/\s+/g, "_")}_av_script.pdf`);
    toast.success("PDF exported");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">A/V Script Builder</h2>
          <p className="text-slate-400">Two-column scripts for commercials and video content</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              New Script
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">New A/V Script</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Script name..."
                value={newScriptName}
                onChange={(e) => setNewScriptName(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <Button onClick={createScript} className="w-full bg-amber-600 hover:bg-amber-700">
                Create Script
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Script List */}
      {scripts.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400">No scripts yet. Create your first A/V script.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Script Selector */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">Scripts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedScript?.id === script.id
                      ? "bg-amber-600/20 border border-amber-600/30"
                      : "hover:bg-slate-700/50"
                  }`}
                  onClick={() => setSelectedScript(script)}
                >
                  <span className="text-sm text-white truncate">{script.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScript(script.id);
                    }}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Script Editor */}
          <Card className="lg:col-span-3 bg-slate-800/50 border-slate-700">
            {selectedScript ? (
              <>
                <CardHeader className="border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{selectedScript.name}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getTotalDuration()}
                        </span>
                        <span>{getTotalWords()} words</span>
                        <span>{entries.length} segments</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex rounded-md border border-slate-600 overflow-hidden">
                        <Button
                          size="sm"
                          variant={viewMode === "table" ? "default" : "ghost"}
                          onClick={() => setViewMode("table")}
                          className={viewMode === "table" ? "bg-amber-600 hover:bg-amber-700 rounded-none" : "rounded-none text-slate-300"}
                        >
                          <Table2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          onClick={() => setViewMode("grid")}
                          className={viewMode === "grid" ? "bg-amber-600 hover:bg-amber-700 rounded-none" : "rounded-none text-slate-300"}
                        >
                          <Grid3x3 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Select value={pacing} onValueChange={(v: PacingType) => setPacing(v)}>
                        <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="slow">Slow (120 wpm)</SelectItem>
                          <SelectItem value="medium">Medium (150 wpm)</SelectItem>
                          <SelectItem value="fast">Fast (180 wpm)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="border-slate-600 text-slate-300">
                            <History className="w-4 h-4 mr-2" />
                            Versions ({versions.length})
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-slate-800 border-slate-700 text-white">
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Version label (optional)"
                                value={versionLabel}
                                onChange={(e) => setVersionLabel(e.target.value)}
                                className="bg-slate-700/50 border-slate-600 text-white text-sm"
                              />
                              <Button size="sm" onClick={saveVersion} className="bg-amber-600 hover:bg-amber-700">
                                <Save className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="max-h-72 overflow-y-auto -mx-1 px-1">
                              {versions.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-6">No saved versions yet. Save one above to start tracking history.</p>
                              ) : (
                                <ul className="divide-y divide-slate-700/60">
                                  {versions.map(v => {
                                    const segCount = Array.isArray(v.snapshot) ? v.snapshot.length : 0;
                                    return (
                                      <li key={v.id} className="py-2 flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-semibold text-amber-400">v{v.version_number}</span>
                                            <span className="text-sm text-white truncate">{v.label || "Untitled"}</span>
                                          </div>
                                          <div className="text-[11px] text-slate-400 mt-0.5">
                                            {new Date(v.created_at).toLocaleString()} · {segCount} segment{segCount === 1 ? "" : "s"}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Button size="sm" variant="ghost" title="Preview" onClick={() => setPreviewVersion(v)} className="h-7 w-7 p-0 text-slate-300 hover:text-amber-400">
                                            <Eye className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button size="sm" variant="ghost" title="Restore" onClick={() => restoreVersion(v.snapshot)} className="h-7 w-7 p-0 text-slate-300 hover:text-amber-400">
                                            <RotateCcw className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button variant="outline" onClick={exportToCSV} className="border-slate-600 text-slate-300">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                      <Button variant="outline" onClick={exportToPDF} className="border-slate-600 text-slate-300">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button onClick={addEntry} className="bg-amber-600 hover:bg-amber-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Row
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {viewMode === "table" ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700 hover:bg-transparent">
                            <TableHead className="w-8 text-slate-400"></TableHead>
                            <TableHead className="w-32 text-slate-400">Segment</TableHead>
                            <TableHead className="text-slate-400">Visual</TableHead>
                            <TableHead className="text-slate-400">Audio</TableHead>
                            <TableHead className="w-20 text-slate-400">Duration</TableHead>
                            <TableHead className="w-12 text-slate-400"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <SortableContext items={entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
                            {entries.map((entry) => {
                              const wordCount = countWords(entry.audio);
                              const duration = calculateDuration(wordCount);

                              return (
                                <SortableRow key={entry.id} id={entry.id} asTableRow className="border-b border-slate-700 hover:bg-slate-700/30">
                                  {({ handle }) => (
                                    <>
                                      <TableCell>{handle}</TableCell>
                                      <TableCell>
                                        <Input
                                          value={entry.segment || ""}
                                          onChange={(e) => updateEntry(entry.id, "segment", e.target.value)}
                                          placeholder="Segment..."
                                          className="bg-transparent border-slate-600 text-white text-sm"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Textarea
                                          value={entry.visual || ""}
                                          onChange={(e) => updateEntry(entry.id, "visual", e.target.value)}
                                          placeholder="Visual description..."
                                          className="bg-transparent border-slate-600 text-white text-sm min-h-[60px] resize-none"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Textarea
                                          value={entry.audio || ""}
                                          onChange={(e) => updateEntry(entry.id, "audio", e.target.value)}
                                          placeholder="Audio/narration..."
                                          className="bg-transparent border-slate-600 text-white text-sm min-h-[60px] resize-none"
                                        />
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <span className="text-sm font-mono text-amber-500">{duration}</span>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteEntry(entry.id)}
                                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </TableCell>
                                    </>
                                  )}
                                </SortableRow>
                              );
                            })}
                          </SortableContext>
                          {entries.length === 0 && (
                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                No entries yet. Click "Add Row" to start building your script.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </DndContext>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[640px]">
                        <div className="grid grid-cols-[40px_repeat(4,minmax(0,1fr))_60px] bg-slate-900/60 border-b border-slate-700 text-xs font-medium text-slate-400 uppercase tracking-wide">
                          <div className="p-2 text-center">#</div>
                          {COLS.map(c => (
                            <div key={c.key} className="p-2 border-l border-slate-700">{c.label}</div>
                          ))}
                          <div className="p-2 border-l border-slate-700"></div>
                        </div>
                        {entries.map((entry, rIdx) => (
                          <div key={entry.id} className="grid grid-cols-[40px_repeat(4,minmax(0,1fr))_60px] border-b border-slate-700 hover:bg-slate-700/20">
                            <div className="p-2 text-center text-xs text-slate-500 flex items-center justify-center">{rIdx + 1}</div>
                            {COLS.map((c, cIdx) => {
                              const isActive = activeCell?.row === rIdx && activeCell?.col === cIdx;
                              return (
                                <div
                                  key={c.key}
                                  className={`border-l border-slate-700 ${isActive ? "ring-2 ring-amber-500 ring-inset" : ""}`}
                                  onClick={() => setActiveCell({ row: rIdx, col: cIdx })}
                                >
                                  <textarea
                                    value={(entry[c.key] as string) || ""}
                                    onChange={(e) => updateEntry(entry.id, c.key, e.target.value)}
                                    onFocus={() => setActiveCell({ row: rIdx, col: cIdx })}
                                    placeholder={c.label}
                                    rows={2}
                                    className="w-full h-full p-2 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none resize-none"
                                  />
                                </div>
                              );
                            })}
                            <div className="border-l border-slate-700 flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEntry(entry.id)}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {entries.length === 0 && (
                          <div className="text-center text-slate-500 py-8 text-sm">
                            No entries yet. Click "Add Row" to start building your script.
                          </div>
                        )}
                        <div className="p-2 border-t border-slate-700">
                          <Button onClick={addEntry} variant="ghost" size="sm" className="w-full text-slate-400 hover:text-amber-400">
                            <Plus className="w-4 h-4 mr-2" /> Add Row
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-slate-400">Select a script to edit</p>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
