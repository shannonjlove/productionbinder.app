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
import { Plus, Trash2, Save, FileText, Clock, GripVertical, Download } from "lucide-react";
import jsPDF from "jspdf";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

interface SortableRowProps {
  entry: AVScriptEntry;
  wordCount: number;
  duration: string;
  updateEntry: (id: string, field: keyof AVScriptEntry, value: string | number) => void;
  deleteEntry: (id: string) => void;
}

function SortableRow({ entry, wordCount, duration, updateEntry, deleteEntry }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="border-border/50 hover:bg-secondary/30">
      <TableCell className="text-muted-foreground cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4" />
      </TableCell>
      <TableCell>
        <Input
          value={entry.segment || ""}
          onChange={(e) => updateEntry(entry.id, "segment", e.target.value)}
          placeholder="Segment..."
          className="bg-transparent border-border text-foreground text-sm"
        />
      </TableCell>
      <TableCell>
        <Textarea
          value={entry.visual || ""}
          onChange={(e) => updateEntry(entry.id, "visual", e.target.value)}
          placeholder="Visual description..."
          className="bg-transparent border-border text-foreground text-sm min-h-[60px] resize-none"
        />
      </TableCell>
      <TableCell>
        <Textarea
          value={entry.audio || ""}
          onChange={(e) => updateEntry(entry.id, "audio", e.target.value)}
          placeholder="Audio/narration..."
          className="bg-transparent border-border text-foreground text-sm min-h-[60px] resize-none"
        />
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm font-mono text-primary">{duration}</span>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteEntry(entry.id)}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function AVScriptManager({ productionId }: AVScriptManagerProps) {
  const [scripts, setScripts] = useState<AVScript[]>([]);
  const [selectedScript, setSelectedScript] = useState<AVScript | null>(null);
  const [entries, setEntries] = useState<AVScriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newScriptName, setNewScriptName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pacing, setPacing] = useState<PacingType>("medium");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchScripts();
  }, [productionId]);

  useEffect(() => {
    if (selectedScript) {
      fetchEntries(selectedScript.id);
    }
  }, [selectedScript]);

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
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update entry");
      console.error(error);
      // Revert on error
      fetchEntries(selectedScript!.id);
    }
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);

    const reorderedEntries = arrayMove(entries, oldIndex, newIndex);
    
    // Optimistic update
    setEntries(reorderedEntries);

    // Update sort_order in database
    const updates = reorderedEntries.map((entry, index) => ({
      id: entry.id,
      sort_order: index + 1,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("av_script_entries")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id);

      if (error) {
        console.error("Failed to update sort order:", error);
        toast.error("Failed to reorder entries");
        fetchEntries(selectedScript!.id);
        return;
      }
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">A/V Script Builder</h2>
          <p className="text-muted-foreground">Two-column scripts for commercials and video content</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all">
              <Plus className="w-4 h-4 mr-2" />
              New Script
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-border/50">
            <DialogHeader>
              <DialogTitle className="text-foreground">New A/V Script</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Script name..."
                value={newScriptName}
                onChange={(e) => setNewScriptName(e.target.value)}
                className="bg-secondary/50 border-border text-foreground"
              />
              <Button onClick={createScript} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all">
                Create Script
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Script List */}
      {scripts.length === 0 ? (
        <Card variant="glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No scripts yet. Create your first A/V script.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Script Selector */}
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scripts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedScript?.id === script.id
                      ? "bg-primary/20 border border-primary/30 shadow-glow-sm"
                      : "hover:bg-secondary/50"
                  }`}
                  onClick={() => setSelectedScript(script)}
                >
                  <span className="text-sm text-foreground truncate">{script.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScript(script.id);
                    }}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Script Editor */}
          <Card variant="glass" className="lg:col-span-3">
            {selectedScript ? (
              <>
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">{selectedScript.name}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getTotalDuration()}
                        </span>
                        <span>{getTotalWords()} words</span>
                        <span>{entries.length} segments</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={pacing} onValueChange={(v: PacingType) => setPacing(v)}>
                        <SelectTrigger className="w-32 bg-secondary/50 border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-panel border-border/50">
                          <SelectItem value="slow">Slow (120 wpm)</SelectItem>
                          <SelectItem value="medium">Medium (150 wpm)</SelectItem>
                          <SelectItem value="fast">Fast (180 wpm)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={exportToPDF} className="border-border/50 text-foreground hover:bg-secondary/50">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                      <Button onClick={addEntry} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Row
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="w-8 text-muted-foreground"></TableHead>
                          <TableHead className="w-32 text-muted-foreground">Segment</TableHead>
                          <TableHead className="text-muted-foreground">Visual</TableHead>
                          <TableHead className="text-muted-foreground">Audio</TableHead>
                          <TableHead className="w-20 text-muted-foreground">Duration</TableHead>
                          <TableHead className="w-12 text-muted-foreground"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext
                          items={entries.map((e) => e.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {entries.map((entry) => {
                            const wordCount = countWords(entry.audio);
                            const duration = calculateDuration(wordCount);
                            
                            return (
                              <SortableRow
                                key={entry.id}
                                entry={entry}
                                wordCount={wordCount}
                                duration={duration}
                                updateEntry={updateEntry}
                                deleteEntry={deleteEntry}
                              />
                            );
                          })}
                        </SortableContext>
                        {entries.length === 0 && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No entries yet. Click "Add Row" to start building your script.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </DndContext>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Select a script to edit</p>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
