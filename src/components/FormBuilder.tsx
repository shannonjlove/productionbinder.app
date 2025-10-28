import { useState, useEffect } from "react";
import { Plus, Trash2, Download, Save, Clock, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type PacingType = "slow" | "medium" | "fast";

const PACING_RATES: Record<PacingType, number> = {
  slow: 120,    // words per minute
  medium: 150,
  fast: 180,
};

interface Row {
  id: string;
  segment: string;
  visual: string;
  audio: string;
  notes: string;
  duration: string; // in format MM:SS or just seconds
}

const STORAGE_KEY = "av-script-data";

export const FormBuilder = () => {
  const [rows, setRows] = useState<Row[]>([
    { id: "1", segment: "", visual: "", audio: "", notes: "", duration: "" },
  ]);
  const [pacing, setPacing] = useState<PacingType>("medium");
  const [useAutoDuration, setUseAutoDuration] = useState(true);

  // Count words in text
  const countWords = (text: string): number => {
    if (!text || text.trim() === "") return 0;
    return text.trim().split(/\s+/).length;
  };

  // Calculate duration from word count and pacing
  const calculateDurationFromWords = (wordCount: number): string => {
    if (wordCount === 0) return "00:00";
    const wordsPerMinute = PACING_RATES[pacing];
    const minutes = wordCount / wordsPerMinute;
    const totalSeconds = Math.round(minutes * 60);
    return formatSecondsToTime(totalSeconds);
  };

  // Get total word count
  const getTotalWordCount = (): number => {
    return rows.reduce((sum, row) => sum + countWords(row.audio), 0);
  };

  // Parse duration string (MM:SS or SS) to total seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr || timeStr.trim() === "") return 0;
    
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    } else {
      return parseInt(timeStr) || 0;
    }
  };

  // Format seconds to MM:SS
  const formatSecondsToTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate total running time
  const getTotalRunningTime = (): string => {
    const totalSeconds = rows.reduce((sum, row) => {
      const duration = useAutoDuration 
        ? calculateDurationFromWords(countWords(row.audio))
        : row.duration;
      return sum + parseTimeToSeconds(duration);
    }, 0);
    return formatSecondsToTime(totalSeconds);
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRows(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved data");
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  const addRow = () => {
    const newRow: Row = {
      id: Date.now().toString(),
      segment: "",
      visual: "",
      audio: "",
      notes: "",
      duration: "",
    };
    setRows([...rows, newRow]);
    toast.success("Row added");
  };

  const deleteRow = (id: string) => {
    if (rows.length === 1) {
      toast.error("Cannot delete the last row");
      return;
    }
    setRows(rows.filter((row) => row.id !== id));
    toast.success("Row deleted");
  };

  const updateCell = (id: string, field: keyof Omit<Row, "id">, value: string) => {
    setRows(rows.map((row) => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      
      // Auto-update duration when audio changes and auto-duration is enabled
      if (field === "audio" && useAutoDuration) {
        const wordCount = countWords(value);
        updated.duration = calculateDurationFromWords(wordCount);
      }
      
      return updated;
    }));
  };

  // Update all durations when pacing changes
  useEffect(() => {
    if (useAutoDuration) {
      setRows(rows.map(row => ({
        ...row,
        duration: calculateDurationFromWords(countWords(row.audio))
      })));
    }
  }, [pacing, useAutoDuration]);

  const exportToCSV = () => {
    const headers = ["Segment/Scene", "Visual", "Audio", "Word Count", "Duration"];
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => {
        const wordCount = countWords(row.audio);
        const duration = useAutoDuration 
          ? calculateDurationFromWords(wordCount)
          : row.duration;
        return [row.segment, row.visual, row.audio, wordCount.toString(), duration]
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(",");
      }),
      "",
      `"Total Words:",,,"${getTotalWordCount()}",""`,
      `"Total Running Time:",,,,"${getTotalRunningTime()}"`,
      `"Pacing:",,,"${pacing}",""`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `av-script-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Exported successfully");
  };

  const saveManually = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    toast.success("Saved successfully");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            AV Script Builder
          </h1>
          <p className="text-muted-foreground">
            Create professional audio-visual scripts with ease
          </p>
        </header>

        {/* Controls Section */}
        <div className="mb-6 space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={addRow} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Row
            </Button>
            <Button onClick={saveManually} variant="secondary" className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Pacing and Stats */}
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Script Pacing:</span>
              </div>
              <Select value={pacing} onValueChange={(v) => setPacing(v as PacingType)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow (120 wpm)</SelectItem>
                  <SelectItem value="medium">Medium (150 wpm)</SelectItem>
                  <SelectItem value="fast">Fast (180 wpm)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={useAutoDuration ? "default" : "outline"}
                size="sm"
                onClick={() => setUseAutoDuration(!useAutoDuration)}
              >
                {useAutoDuration ? "Auto Duration" : "Manual Duration"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="bg-muted/50 px-4 py-2 rounded-lg border border-border">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Words: </span>
                  <span className="font-bold text-foreground">{getTotalWordCount()}</span>
                </div>
              </div>
              <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                <Clock className="h-4 w-4 text-primary inline-block mr-2" />
                <span className="text-sm text-muted-foreground">Total Time: </span>
                <span className="font-bold text-primary text-lg">{getTotalRunningTime()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          {/* Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-semibold text-foreground w-[12%]">
                    Segment/Scene
                  </th>
                  <th className="text-left p-4 font-semibold text-foreground w-[26%]">
                    Visual
                  </th>
                  <th className="text-left p-4 font-semibold text-foreground w-[26%]">
                    Audio
                  </th>
                  <th className="text-left p-4 font-semibold text-foreground w-[14%]">
                    Notes
                  </th>
                  <th className="text-left p-4 font-semibold text-foreground w-[8%]">
                    Words
                  </th>
                  <th className="text-left p-4 font-semibold text-foreground w-[10%]">
                    Duration
                  </th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3">
                      <Input
                        value={row.segment}
                        onChange={(e) => updateCell(row.id, "segment", e.target.value)}
                        placeholder={`Scene ${index + 1}`}
                        className="border-0 bg-transparent focus:bg-background"
                      />
                    </td>
                    <td className="p-3">
                      <Textarea
                        value={row.visual}
                        onChange={(e) => updateCell(row.id, "visual", e.target.value)}
                        placeholder="Describe what viewers will see..."
                        className="min-h-[80px] border-0 bg-transparent focus:bg-background resize-none"
                      />
                    </td>
                    <td className="p-3">
                      <Textarea
                        value={row.audio}
                        onChange={(e) => updateCell(row.id, "audio", e.target.value)}
                        placeholder="Describe audio, narration, music..."
                        className="min-h-[80px] border-0 bg-transparent focus:bg-background resize-none"
                      />
                    </td>
                    <td className="p-3">
                      <Textarea
                        value={row.notes}
                        onChange={(e) => updateCell(row.id, "notes", e.target.value)}
                        placeholder="Additional notes..."
                        className="min-h-[80px] border-0 bg-transparent focus:bg-background resize-none"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-sm font-mono text-muted-foreground">
                        {countWords(row.audio)}
                      </div>
                    </td>
                    <td className="p-3">
                      <Input
                        value={useAutoDuration 
                          ? calculateDurationFromWords(countWords(row.audio))
                          : row.duration
                        }
                        onChange={(e) => updateCell(row.id, "duration", e.target.value)}
                        placeholder="MM:SS"
                        className="border-0 bg-transparent focus:bg-background font-mono"
                        disabled={useAutoDuration}
                      />
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRow(row.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet View */}
          <div className="lg:hidden space-y-4 p-4">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="bg-muted/30 rounded-lg p-4 space-y-4 border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Row {index + 1}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRow(row.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Segment/Scene
                  </label>
                  <Input
                    value={row.segment}
                    onChange={(e) => updateCell(row.id, "segment", e.target.value)}
                    placeholder={`Scene ${index + 1}`}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Visual
                  </label>
                  <Textarea
                    value={row.visual}
                    onChange={(e) => updateCell(row.id, "visual", e.target.value)}
                    placeholder="Describe what viewers will see..."
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Audio
                  </label>
                  <Textarea
                    value={row.audio}
                    onChange={(e) => updateCell(row.id, "audio", e.target.value)}
                    placeholder="Describe audio, narration, music..."
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Notes
                  </label>
                  <Textarea
                    value={row.notes}
                    onChange={(e) => updateCell(row.id, "notes", e.target.value)}
                    placeholder="Additional notes..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                      Word Count
                    </label>
                    <div className="bg-muted/50 rounded-md px-3 py-2 text-sm font-mono">
                      {countWords(row.audio)} words
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                      Duration (MM:SS)
                    </label>
                    <Input
                      value={useAutoDuration 
                        ? calculateDurationFromWords(countWords(row.audio))
                        : row.duration
                      }
                      onChange={(e) => updateCell(row.id, "duration", e.target.value)}
                      placeholder="00:30"
                      className="font-mono"
                      disabled={useAutoDuration}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Changes are automatically saved to your browser</p>
        </div>
      </div>
    </div>
  );
};
