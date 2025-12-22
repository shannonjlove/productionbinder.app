import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Clock, FileText, Save, ArrowLeft } from "lucide-react";

interface AVScript {
  id: string;
  production_id: string;
  name: string;
  created_at: string;
}

interface AVScriptEntry {
  id: string;
  script_id: string;
  segment: string | null;
  visual: string | null;
  audio: string | null;
  duration: string | null;
  notes: string | null;
  sort_order: number;
}

interface AVScriptBuilderProps {
  productionId: string;
}

const WORDS_PER_MINUTE = 150;

export function AVScriptBuilder({ productionId }: AVScriptBuilderProps) {
  const [scripts, setScripts] = useState<AVScript[]>([]);
  const [selectedScript, setSelectedScript] = useState<AVScript | null>(null);
  const [entries, setEntries] = useState<AVScriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newScriptOpen, setNewScriptOpen] = useState(false);
  const [newScriptName, setNewScriptName] = useState("");
  const [useAutoDuration, setUseAutoDuration] = useState(true);

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
        production_id: productionId,
        name: newScriptName
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create script");
      console.error(error);
    } else {
      setScripts([data, ...scripts]);
      setSelectedScript(data);
      setNewScriptOpen(false);
      setNewScriptName("");
      toast.success("Script created");
      
      // Add first empty row
      await addEntry(data.id);
    }
  };

  const deleteScript = async (scriptId: string) => {
    const { error } = await supabase
      .from("av_scripts")
      .delete()
      .eq("id", scriptId);

    if (error) {
      toast.error("Failed to delete script");
    } else {
      setScripts(scripts.filter(s => s.id !== scriptId));
      if (selectedScript?.id === scriptId) {
        setSelectedScript(null);
        setEntries([]);
      }
      toast.success("Script deleted");
    }
  };

  const addEntry = async (scriptId?: string) => {
    const targetScriptId = scriptId || selectedScript?.id;
    if (!targetScriptId) return;

    const maxOrder = entries.length > 0 ? Math.max(...entries.map(e => e.sort_order)) + 1 : 0;

    const { data, error } = await supabase
      .from("av_script_entries")
      .insert({
        script_id: targetScriptId,
        sort_order: maxOrder,
        segment: "",
        visual: "",
        audio: "",
        duration: "",
        notes: ""
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add row");
      console.error(error);
    } else {
      setEntries([...entries, data]);
    }
  };

  const updateEntry = async (entryId: string, field: keyof AVScriptEntry, value: string) => {
    setEntries(entries.map(e => 
      e.id === entryId ? { ...e, [field]: value } : e
    ));

    const { error } = await supabase
      .from("av_script_entries")
      .update({ [field]: value })
      .eq("id", entryId);

    if (error) {
      console.error("Failed to update entry:", error);
    }
  };

  const deleteEntry = async (entryId: string) => {
    const { error } = await supabase
      .from("av_script_entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      toast.error("Failed to delete row");
    } else {
      setEntries(entries.filter(e => e.id !== entryId));
    }
  };

  const countWords = (text: string | null) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const calculateDuration = (wordCount: number) => {
    const seconds = Math.ceil((wordCount / WORDS_PER_MINUTE) * 60);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalWordCount = () => {
    return entries.reduce((sum, entry) => sum + countWords(entry.audio), 0);
  };

  const getTotalDuration = () => {
    if (useAutoDuration) {
      return calculateDuration(getTotalWordCount());
    }
    
    let totalSeconds = 0;
    entries.forEach(entry => {
      if (entry.duration) {
        const parts = entry.duration.split(":");
        if (parts.length === 2) {
          totalSeconds += parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
      }
    });
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!selectedScript) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">A/V Script Builder</h2>
            <p className="text-slate-400">Create and manage audio/visual scripts</p>
          </div>
          <Dialog open={newScriptOpen} onOpenChange={setNewScriptOpen}>
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
                <div className="space-y-2">
                  <Label className="text-slate-300">Script Name</Label>
                  <Input
                    placeholder="e.g. 30-Second Commercial"
                    value={newScriptName}
                    onChange={(e) => setNewScriptName(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <Button onClick={createScript} className="w-full bg-amber-600 hover:bg-amber-700">
                  Create Script
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {scripts.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Scripts Yet</h3>
              <p className="text-slate-400 text-center mb-4">
                Create your first A/V script to get started with visual and audio planning.
              </p>
              <Button onClick={() => setNewScriptOpen(true)} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Script
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scripts.map((script) => (
              <Card 
                key={script.id} 
                className="bg-slate-800/50 border-slate-700 hover:border-amber-600/50 transition-colors cursor-pointer"
                onClick={() => setSelectedScript(script)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-white text-lg">{script.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScript(script.id);
                    }}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">
                    Created {new Date(script.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setSelectedScript(null);
              setEntries([]);
            }}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedScript.name}</h2>
            <p className="text-slate-400">A/V Script Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Auto Duration:</span>
            <Button
              variant={useAutoDuration ? "default" : "outline"}
              size="sm"
              onClick={() => setUseAutoDuration(!useAutoDuration)}
              className={useAutoDuration ? "bg-amber-600 hover:bg-amber-700" : "border-slate-600 text-slate-300"}
            >
              {useAutoDuration ? "On" : "Off"}
            </Button>
          </div>
          <Button onClick={() => addEntry()} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          <span className="text-slate-400">Rows:</span>
          <span className="font-semibold text-white">{entries.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Words:</span>
          <span className="font-semibold text-white">{getTotalWordCount()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-slate-400">Duration:</span>
          <span className="font-semibold text-white">{getTotalDuration()}</span>
        </div>
      </div>

      {/* Script Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="w-10 px-2 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">
                  Segment
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Visual
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Audio / Narration
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">
                  Words
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">
                  Duration
                </th>
                <th className="w-10 px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const wordCount = countWords(entry.audio);
                const autoDuration = calculateDuration(wordCount);
                
                return (
                  <tr key={entry.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-2 py-2 text-center">
                      <GripVertical className="w-4 h-4 text-slate-500 cursor-grab" />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={entry.segment || ""}
                        onChange={(e) => updateEntry(entry.id, "segment", e.target.value)}
                        placeholder={`${index + 1}`}
                        className="bg-transparent border-slate-600 text-white text-sm h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Textarea
                        value={entry.visual || ""}
                        onChange={(e) => updateEntry(entry.id, "visual", e.target.value)}
                        placeholder="Describe the visual..."
                        className="bg-transparent border-slate-600 text-white text-sm min-h-[60px] resize-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Textarea
                        value={entry.audio || ""}
                        onChange={(e) => updateEntry(entry.id, "audio", e.target.value)}
                        placeholder="Narration or audio description..."
                        className="bg-transparent border-slate-600 text-white text-sm min-h-[60px] resize-none"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-sm font-mono text-slate-300">{wordCount}</span>
                    </td>
                    <td className="px-4 py-2">
                      {useAutoDuration ? (
                        <span className="text-sm font-mono text-amber-400">{autoDuration}</span>
                      ) : (
                        <Input
                          value={entry.duration || ""}
                          onChange={(e) => updateEntry(entry.id, "duration", e.target.value)}
                          placeholder="0:00"
                          className="bg-transparent border-slate-600 text-white text-sm h-8 font-mono"
                        />
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntry(entry.id)}
                        className="text-slate-400 hover:text-red-400 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-slate-400 mb-4">No rows yet. Add your first row to start building the script.</p>
            <Button onClick={() => addEntry()} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Add First Row
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}